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
  assert.deepEqual((await api('GET','/api/progresso',null,token)).dados.dados, dados);
  assert.equal((await api('PUT','/api/progresso',{ dados:[1,2] },token)).status, 400);
});

test('recordes guardam só o melhor tempo e o ranking ordena', { skip:!temBanco }, async()=>{
  const contas = [];
  for(const [email,nome] of [['bia@exemplo.com','Bia'],['caio@exemplo.com','Caio']]) contas.push((await api('POST','/api/contas',{ email, senha:'segredo1', nome })).dados.token);
  const ana = (await api('POST','/api/sessoes',{ email:'ana@exemplo.com', senha:'segredo1' })).dados.token;
  const rec = (tk,fase,tempo,personagem='ze',dificuldade='normal')=>api('POST','/api/recordes',{ fase, dificuldade, personagem, chapeu:'palha', tempo },tk);
  assert.equal((await rec(ana,1,120)).dados.novo, true);
  assert.deepEqual((await rec(ana,1,150)).dados, { tempo:120, novo:false }, 'tempo pior não substitui');
  assert.equal((await rec(ana,1,100,'luzia')).dados.tempo, 100);
  await rec(contas[0],1,90,'tiao'); await rec(contas[1],1,200);
  assert.equal((await rec(ana,1,5)).status, 400, 'tempo impossível é recusado');
  assert.equal((await rec(ana,9,100)).status, 400);
  let r = await api('GET','/api/ranking?fase=1&dificuldade=normal',null,ana);
  assert.deepEqual(r.dados.linhas.map(l=>[l.nome,l.tempo,l.personagem,l.eu]), [['Bia',90,'tiao',false],['Ana',100,'luzia',true],['Caio',200,'ze',false]]);
  for(const f of [2,3,4]) await rec(ana,f,100);
  r = await api('GET','/api/ranking?fase=jornada&dificuldade=normal');
  assert.deepEqual(r.dados.linhas.map(l=>[l.nome,l.tempo]), [['Ana',400]], 'jornada só conta quem fez as quatro fases');
  assert.equal((await api('GET','/api/ranking?fase=1&dificuldade=impossivel')).status, 400);
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
