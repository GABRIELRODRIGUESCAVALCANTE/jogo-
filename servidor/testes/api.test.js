// Testes da API contra um PostgreSQL de verdade (DATABASE_URL). Sem banco, os testes são pulados.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
const { criarServidor, hashSenha, confereSenha, criarToken, lerToken } = require('../servidor');

const temBanco = !!process.env.DATABASE_URL;
let pool, srv, base;
before(async()=>{
  if(!temBanco) return;
  pool = new Pool({ connectionString:process.env.DATABASE_URL });
  await pool.query(fs.readFileSync(path.join(__dirname,'..','esquema.sql'),'utf8'));
  await pool.query('truncate contas restart identity cascade');
  srv = criarServidor({ pool, segredo:'segredo-de-teste-com-mais-de-32-caracteres', origens:['https://jogo.exemplo'] });
  await new Promise(r=>srv.listen(0,'127.0.0.1',r));
  base = `http://127.0.0.1:${srv.address().port}`;
});
after(async()=>{ if(srv) srv.close(); if(pool) await pool.end(); });

async function api(metodo, rota, corpo, token){
  const r = await fetch(base+rota,{ method:metodo, headers:{'Content-Type':'application/json', ...(token?{Authorization:'Bearer '+token}:{})}, body:corpo?JSON.stringify(corpo):undefined });
  return { status:r.status, dados:r.status===204?null:await r.json() };
}

test('senhas e tokens', ()=>{
  const h = hashSenha('segredo123');
  assert.ok(h.startsWith('scrypt$') && !h.includes('segredo123'));
  assert.ok(confereSenha('segredo123', h)); assert.ok(!confereSenha('errada', h));
  const t = criarToken('x'.repeat(32), 7);
  assert.equal(lerToken('x'.repeat(32), t), 7);
  assert.equal(lerToken('y'.repeat(32), t), null, 'assinatura com outro segredo não vale');
  assert.equal(lerToken('x'.repeat(32), t.slice(0,-2)+'aa'), null, 'token adulterado não vale');
});

test('criar conta, entrar e validações', { skip:!temBanco }, async()=>{
  let r = await api('POST','/api/contas',{ email:'ana@exemplo.com', senha:'segredo1', nome:'  Ana  ' });
  assert.equal(r.status,200); assert.equal(r.dados.conta.nome,'Ana'); assert.ok(r.dados.token);
  assert.equal((await api('POST','/api/contas',{ email:'ANA@exemplo.com', senha:'segredo1', nome:'Outra' })).dados.erro, 'email_em_uso');
  assert.equal((await api('POST','/api/contas',{ email:'bia@exemplo.com', senha:'123', nome:'Bia' })).dados.erro, 'senha_curta');
  assert.equal((await api('POST','/api/contas',{ email:'sem-arroba', senha:'segredo1', nome:'Bia' })).dados.erro, 'email_invalido');
  assert.equal((await api('POST','/api/contas',{ email:'bia@exemplo.com', senha:'segredo1', nome:'x'.repeat(17) })).dados.erro, 'nome_invalido');
  assert.equal((await api('POST','/api/sessoes',{ email:'ana@exemplo.com', senha:'errada' })).status, 401);
  r = await api('POST','/api/sessoes',{ email:'Ana@Exemplo.com', senha:'segredo1' });
  assert.equal(r.status,200); assert.equal(r.dados.conta.email,'ana@exemplo.com');
  const { rows } = await pool.query('select senha_hash from contas');
  assert.ok(rows.every(l=>l.senha_hash.startsWith('scrypt$')), 'senha nunca é guardada em texto');
});

test('progresso na nuvem exige login e guarda JSON', { skip:!temBanco }, async()=>{
  assert.equal((await api('GET','/api/progresso')).status, 401);
  const { dados:{ token } } = await api('POST','/api/sessoes',{ email:'ana@exemplo.com', senha:'segredo1' });
  assert.deepEqual((await api('GET','/api/progresso',null,token)).dados.dados, null);
  const dados = { personagem:'luzia', cordeis:['c1','c2'], fases:{1:{feita:true,tempos:{normal:95}}} };
  assert.equal((await api('PUT','/api/progresso',{ dados },token)).status, 200);
  assert.deepEqual((await api('GET','/api/progresso',null,token)).dados.dados.cordeis, ['c1','c2']);
  assert.equal((await api('PUT','/api/progresso',{ dados:[1,2] },token)).status, 400);
});

test('progresso de dois aparelhos se junta em vez de sobrescrever', { skip:!temBanco }, async()=>{
  const { dados:{ token } } = await api('POST','/api/sessoes',{ email:'ana@exemplo.com', senha:'segredo1' });
  // o celular jogou offline a fase 2; o computador, que não sabia disso, manda o progresso dele
  await api('PUT','/api/progresso',{ dados:{ personagem:'luzia', cordeis:['c1','c4'], fases:{1:{feita:true,tempos:{normal:95}},2:{feita:true,tempos:{normal:200}}}, conquistas:{travessia:5}, estat:{inimigos:30} } },token);
  const r = await api('PUT','/api/progresso',{ dados:{ personagem:'tiao', cordeis:['c1','c2','c3'], fases:{1:{feita:true,tempos:{normal:80,facil:70}}}, conquistas:{pe_na_estrada:3}, estat:{inimigos:12} } },token);
  const d = r.dados.dados;
  assert.equal(d.personagem, 'tiao', 'as escolhas de quem enviou por último valem');
  assert.deepEqual([...d.cordeis].sort(), ['c1','c2','c3','c4']);
  assert.deepEqual(d.fases, { 1:{feita:true,tempos:{normal:80,facil:70}}, 2:{feita:true,tempos:{normal:200}} });
  assert.deepEqual(d.conquistas, { travessia:5, pe_na_estrada:3 });
  assert.equal(d.estat.inimigos, 30);
  assert.deepEqual((await api('GET','/api/progresso',null,token)).dados.dados, d);
});

// começa uma partida e finge que ela começou "segundos" atrás no relógio do servidor
async function partida(token, fase, dificuldade='normal', segundos=3600){
  const { dados } = await api('POST','/api/partidas',{ fase, dificuldade },token);
  await pool.query(`update partidas set iniciada_em = now() - make_interval(secs => $2) where id=$1`, [dados.partida, segundos]);
  return dados.partida;
}

test('recordes guardam só o melhor tempo e o ranking ordena', { skip:!temBanco }, async()=>{
  const contas = [];
  for(const [email,nome] of [['bia@exemplo.com','Bia'],['caio@exemplo.com','Caio']]) contas.push((await api('POST','/api/contas',{ email, senha:'segredo1', nome })).dados.token);
  const ana = (await api('POST','/api/sessoes',{ email:'ana@exemplo.com', senha:'segredo1' })).dados.token;
  const rec = async(tk,fase,tempo,personagem='ze',dificuldade='normal')=>api('POST','/api/recordes',{ fase, dificuldade, personagem, chapeu:'palha', tempo, partida:await partida(tk,fase,dificuldade) },tk);
  assert.equal((await rec(ana,1,120)).dados.novo, true);
  assert.deepEqual((await rec(ana,1,150)).dados, { tempo:120, novo:false }, 'tempo pior não substitui');
  assert.equal((await rec(ana,1,100,'luzia')).dados.tempo, 100);
  await rec(contas[0],1,90,'tiao'); await rec(contas[1],1,200);
  assert.equal((await rec(ana,9,100)).status, 400);
  let r = await api('GET','/api/ranking?fase=1&dificuldade=normal',null,ana);
  assert.deepEqual(r.dados.linhas.map(l=>[l.nome,l.tempo,l.personagem,l.eu]), [['Bia',90,'tiao',false],['Ana',100,'luzia',true],['Caio',200,'ze',false]]);
  for(const f of [2,3,4]) await rec(ana,f,100);
  r = await api('GET','/api/ranking?fase=jornada&dificuldade=normal');
  assert.deepEqual(r.dados.linhas.map(l=>[l.nome,l.tempo]), [['Ana',400]], 'jornada só conta quem fez as quatro fases');
  await rec(ana,5,300);                                    // o Desafio dos Chefes não entra na jornada
  r = await api('GET','/api/ranking?fase=jornada&dificuldade=normal');
  assert.deepEqual(r.dados.linhas.map(l=>[l.nome,l.tempo]), [['Ana',400]]);
  r = await api('GET','/api/ranking?fase=5&dificuldade=normal');
  assert.deepEqual(r.dados.linhas.map(l=>[l.nome,l.tempo]), [['Ana',300]]);
  assert.equal((await api('GET','/api/ranking?fase=1&dificuldade=impossivel')).status, 400);
});

test('recordes impossíveis são recusados', { skip:!temBanco }, async()=>{
  const ana = (await api('POST','/api/sessoes',{ email:'ana@exemplo.com', senha:'segredo1' })).dados.token;
  const bia = (await api('POST','/api/sessoes',{ email:'bia@exemplo.com', senha:'segredo1' })).dados.token;
  const enviar = (corpo,tk=ana)=>api('POST','/api/recordes',Object.assign({ fase:2, dificuldade:'normal', personagem:'luzia', tempo:60 },corpo),tk);
  assert.equal((await enviar({ partida:await partida(ana,2), tempo:3 })).dados.erro, 'tempo_impossivel', 'abaixo do mínimo da fase');
  assert.equal((await enviar({})).dados.erro, 'partida_invalida', 'sem partida');
  assert.equal((await enviar({ partida:'abc' })).dados.erro, 'partida_invalida');
  assert.equal((await enviar({ partida:await partida(bia,2) })).dados.erro, 'partida_invalida', 'partida de outra conta');
  assert.equal((await enviar({ partida:await partida(ana,3) })).dados.erro, 'partida_invalida', 'partida de outra fase');
  assert.equal((await enviar({ partida:await partida(ana,2,'facil') })).dados.erro, 'partida_invalida', 'partida de outra dificuldade');
  assert.equal((await enviar({ partida:await partida(ana,2,'normal',20) })).dados.erro, 'tempo_impossivel', 'mais rápido que o relógio do servidor');
  const certa = await partida(ana,2,'normal',70);
  assert.equal((await enviar({ partida:certa })).status, 200);
  assert.equal((await enviar({ partida:certa })).dados.erro, 'partida_invalida', 'cada partida vale uma vez');
  assert.equal((await api('POST','/api/partidas',{ fase:6, dificuldade:'normal' },ana)).status, 400);
  assert.equal((await api('POST','/api/partidas',{ fase:1, dificuldade:'normal' })).status, 401);
});

test('CORS só libera a origem configurada', { skip:!temBanco }, async()=>{
  const ok = await fetch(base+'/api/saude',{ headers:{ Origin:'https://jogo.exemplo' } });
  assert.equal(ok.headers.get('access-control-allow-origin'),'https://jogo.exemplo');
  const outra = await fetch(base+'/api/saude',{ headers:{ Origin:'https://malicioso.exemplo' } });
  assert.equal(outra.headers.get('access-control-allow-origin'), null);
});

test('apagar a conta remove progresso e recordes', { skip:!temBanco }, async()=>{
  const { dados:{ token } } = await api('POST','/api/sessoes',{ email:'ana@exemplo.com', senha:'segredo1' });
  assert.equal((await api('DELETE','/api/contas',null,token)).status, 204);
  const { rows } = await pool.query(`select (select count(*) from contas where email='ana@exemplo.com') c, (select count(*) from progresso) p, (select count(*) from recordes where conta_id=1) r`);
  assert.deepEqual(rows[0], { c:'0', p:'0', r:'0' });
});
