// Contas online: o jogo conversa com uma API falsa (mesmas rotas e respostas do servidor/), sem precisar do PostgreSQL.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { preparar, abrir, sleep } = require('./ajuda');
const { mesclarProgresso } = require('../servidor/mesclar');

const API = 'http://api.teste';
let A;
before(async()=>{ A=await preparar(); });
after(async()=>{ await A.fim(); });

// imitação do servidor: contas em memória, token = "tok-<id>"
function apiFalsa(){
  const db = { contas:[], pedidos:[], partidas:[] };
  const contaDo = h=>db.contas.find(c=>`Bearer tok-${c.id}`===h.authorization);
  const conta = c=>({ token:`tok-${c.id}`, conta:{ id:c.id, nome:c.nome, email:c.email } });
  db.criar = (email,senha,nome)=>{ const c={ id:db.contas.length+1, email, senha, nome, dados:null, recordes:{} }; db.contas.push(c); return c; };
  db.rota = async route=>{
    const req = route.request(), url = new URL(req.url()), h = req.headers(), corpo = req.postData() ? JSON.parse(req.postData()) : null;
    if(db.foraDoAr) return route.abort('internetdisconnected');
    if(db.demora) await sleep(db.demora);
    const chave = `${req.method()} ${url.pathname}`;
    db.pedidos.push(chave);
    const responder = (status,dados)=>route.fulfill({ status, contentType:'application/json', headers:{ 'Access-Control-Allow-Origin':'*' }, body:dados===undefined?'':JSON.stringify(dados) });
    if(req.method()==='OPTIONS') return route.fulfill({ status:204, headers:{ 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'Content-Type, Authorization', 'Access-Control-Allow-Methods':'GET, POST, PUT, DELETE' } });
    const eu = contaDo(h);
    switch(chave){
      case 'POST /api/contas':
        if(db.contas.some(c=>c.email===corpo.email)) return responder(409,{ erro:'email_em_uso' });
        return responder(200, conta(db.criar(corpo.email,corpo.senha,corpo.nome)));
      case 'POST /api/sessoes': {
        const c = db.contas.find(c=>c.email===corpo.email && c.senha===corpo.senha);
        return c ? responder(200, conta(c)) : responder(401,{ erro:'login_invalido' });
      }
      case 'DELETE /api/contas': if(!eu) return responder(401,{ erro:'nao_autorizado' }); db.contas=db.contas.filter(c=>c!==eu); return route.fulfill({ status:204, headers:{ 'Access-Control-Allow-Origin':'*' } });
      case 'GET /api/progresso': if(!eu) return responder(401,{ erro:'nao_autorizado' }); return responder(200,{ dados:eu.dados });
      case 'PUT /api/progresso': if(!eu) return responder(401,{ erro:'nao_autorizado' }); eu.dados=mesclarProgresso(corpo.dados, eu.dados||{}); return responder(200,{ dados:eu.dados, atualizado:new Date().toISOString() });
      case 'POST /api/partidas': if(!eu) return responder(401,{ erro:'nao_autorizado' }); db.partidas.push({ id:String(db.partidas.length+1), conta:eu, fase:corpo.fase, dificuldade:corpo.dificuldade }); return responder(200,{ partida:db.partidas.at(-1).id });
      case 'POST /api/recordes': {
        if(!eu) return responder(401,{ erro:'nao_autorizado' });
        const pt=db.partidas.find(x=>x.id===corpo.partida && x.conta===eu && x.fase===corpo.fase && x.dificuldade===corpo.dificuldade);
        if(!pt) return responder(400,{ erro:'partida_invalida' });
        db.partidas=db.partidas.filter(x=>x!==pt);
        const k=`${corpo.fase}:${corpo.dificuldade}`, velho=eu.recordes[k];
        if(!velho || corpo.tempo<velho.tempo) eu.recordes[k]=corpo;
        return responder(200,{ tempo:eu.recordes[k].tempo, novo:eu.recordes[k]===corpo });
      }
      case 'GET /api/ranking': {
        const k=`${url.searchParams.get('fase')}:${url.searchParams.get('dificuldade')}`;
        const linhas=db.contas.filter(c=>c.recordes[k]).map(c=>({ nome:c.nome, personagem:c.recordes[k].personagem, chapeu:c.recordes[k].chapeu, tempo:c.recordes[k].tempo, eu:c===eu }));
        return responder(200,{ linhas:linhas.sort((a,b)=>a.tempo-b.tempo) });
      }
    }
    return responder(404,{ erro:'nao_encontrado' });
  };
  return db;
}
async function abrirComApi(db){
  const J = await abrir(A.browser, A.url, { antes:`window.ESTRELA_CONFIG={ api:'${API}' };` });
  await J.ctx.route(`${API}/**`, db.rota);
  return J;
}
// o navegador avisa no console toda resposta de erro da API (409, 401...), que aqui são esperadas
const semHttp = erros=>erros.filter(e=>!/^Failed to load resource/.test(e));
async function ate(cond){ for(let i=0;i<100;i++){ if(cond()) return; await sleep(30); } throw new Error('a API falsa não recebeu o pedido'); }

test('sem API configurada, nada de conta online aparece', async()=>{
  const J = await abrir(A.browser, A.url);
  assert.ok(!(await J.page.isVisible('#btnContaNovo')));
  await J.criarJogador('Ana');
  assert.ok(!(await J.page.isVisible('#btnConta')));
  assert.ok(!(await J.page.isVisible('#seloOnline')));
  assert.deepEqual(J.erros, []);
  await J.fechar();
});

test('cria a conta, sincroniza o progresso, manda o recorde e mostra o ranking mundial', async()=>{
  const db = apiFalsa();
  const outro = db.criar('zeca@teste.br','123456','Zeca'); outro.recordes['1:normal']={ fase:1, dificuldade:'normal', personagem:'luzia', chapeu:'palha', tempo:90 };
  const J = await abrirComApi(db);
  await J.criarJogador('Ana','tiao');
  await J.page.click('#btnConta');
  assert.equal(await J.ev(()=>telaAtual), 'telaConta');
  await J.page.fill('#emailConta','ana@teste');
  await J.page.fill('#senhaConta','segredo1');
  await J.page.click('#btnEnviarConta');
  assert.equal(await J.page.textContent('#erroConta'), 'Digite um e-mail válido.');
  await J.page.fill('#emailConta','zeca@teste.br');
  await J.page.click('#btnEnviarConta');
  await J.page.waitForSelector('#erroConta:has-text("Já existe uma conta")');
  await J.page.fill('#emailConta','ana@teste.br');
  await J.page.click('#btnEnviarConta');
  await J.page.waitForSelector('#contaLigada:not([hidden])');
  assert.equal(await J.page.textContent('#contaEmail'), 'ana@teste.br');
  const ana = db.contas.find(c=>c.email==='ana@teste.br');
  assert.equal(ana.nome, 'Ana');
  assert.equal(ana.dados.personagem, 'tiao', 'o progresso do aparelho sobe ao ligar a conta');
  assert.equal(ana.dados.id, undefined);

  // progresso: as mudanças vão sozinhas para o servidor
  await J.ev(()=>{ perfil.cordeis.push('c1'); salvarPerfis(); });
  await ate(()=>ana.dados.cordeis.includes('c1'));

  assert.equal(await J.page.textContent('#contaEstado'), 'Tudo sincronizado.');

  // sem internet: avisa e guarda para mandar depois
  db.foraDoAr = true;
  await J.page.click('#btnSincronizar');
  await J.page.waitForSelector('#contaEstado:has-text("Sem conexão")');
  db.foraDoAr = false;
  await J.page.click('#btnSincronizar');
  await J.page.waitForSelector('#contaEstado:has-text("Tudo sincronizado.")');

  // recorde ao concluir a fase
  await J.page.click('#btnVoltarConta');
  assert.match(await J.page.textContent('#seloOnline'), /ana@teste\.br/);
  // outro aparelho achou um cordel; na próxima sincronização ele aparece aqui, sem perder o que foi feito aqui
  ana.dados.cordeis.push('c9');
  await J.ev(()=>{ perfil.cordeis.push('c2'); salvarPerfis(); return sincronizarPendentes(); });
  assert.deepEqual((await J.ev(()=>perfil.cordeis)).sort(), ['c1','c2','c9']);
  assert.deepEqual([...ana.dados.cordeis].sort(), ['c1','c2','c9']);

  await J.comecarFase(1);
  await J.ate(()=>S0.partida && S0.partida.id);
  await J.ev(()=>{ time=100; concluirFase(); });
  await ate(()=>ana.recordes['1:normal']);
  assert.equal(ana.recordes['1:normal'].tempo, 100);
  assert.equal(ana.recordes['1:normal'].personagem, 'tiao');

  // ranking mundial
  await J.ev(()=>abrirMenu());
  await J.page.click('#btnRanking');
  assert.ok(await J.page.isVisible('#fonteRanking'));
  db.demora = 2200;                                   // servidor gratuito acordando
  await J.page.click('#fonteRanking .aba >> nth=1');
  await J.page.waitForSelector('#avisoServidor:not([hidden])');
  assert.equal(await J.page.textContent('#avisoServidor'), 'Acordando o servidor no sertão…');
  await J.page.waitForSelector('#listaRanking .linha');
  assert.ok(await J.page.isHidden('#avisoServidor'));
  db.demora = 0;
  assert.deepEqual(await J.page.locator('#listaRanking .quem b').allTextContents(), ['Zeca','Ana']);
  assert.equal(await J.page.textContent('#listaRanking .eu .quem b'), 'Ana');
  assert.deepEqual(semHttp(J.erros), []);
  await J.fechar();
});

test('em outro aparelho, entrar com a conta traz o jogador e o progresso', async()=>{
  const db = apiFalsa();
  const c = db.criar('bia@teste.br','minhasenha','Bia');
  c.dados = { nome:'Bia', personagem:'luzia', dificuldade:'dificil', fases:{1:{feita:true,tempos:{dificil:140}}}, cordeis:['c1','c2'], conquistas:{pe_na_estrada:1}, bonusVida:1, fim:false };
  const J = await abrirComApi(db);
  assert.equal(await J.ev(()=>telaAtual), 'telaNovo');
  await J.page.click('#btnContaNovo');
  assert.ok(!(await J.page.isVisible('#modoConta')), 'sem jogador para ligar, só dá para entrar');
  await J.page.fill('#emailConta','bia@teste.br');
  await J.page.fill('#senhaConta','errada1');
  await J.page.click('#btnEnviarConta');
  await J.page.waitForSelector('#erroConta:has-text("E-mail ou senha errados.")');
  await J.page.fill('#senhaConta','minhasenha');
  await J.page.click('#btnEnviarConta');
  await J.ate(()=>telaAtual==='telaMenu');
  const pf = await J.ev(()=>({ nome:perfil.nome, pers:perfil.personagem, dif:perfil.dificuldade, feita:perfil.fases[1].feita, rec:recorde(perfil,1,'dificil'), cordeis:perfil.cordeis.length, sessao:!!sessaoDe(perfil) }));
  assert.deepEqual(pf, { nome:'Bia', pers:'luzia', dif:'dificil', feita:true, rec:140, cordeis:2, sessao:true });
  // recordes antigos não vão para o ranking mundial: só valem fases começadas com o servidor marcando a hora
  await J.ev(()=>sincronizarPendentes());
  assert.ok(!db.pedidos.includes('POST /api/recordes'));

  // apagar a conta online mantém o jogador no aparelho
  await J.page.click('#btnConta');
  await J.page.click('#btnApagarConta');
  await J.page.click('#btnApagarSim');
  await J.page.waitForSelector('#formConta:not([hidden])');
  assert.equal(db.contas.length, 0);
  await J.page.click('#btnVoltarConta');
  assert.ok(!(await J.page.isVisible('#seloOnline')));
  assert.equal(await J.ev(()=>perfis.lista.length), 1);
  assert.deepEqual(semHttp(J.erros), []);
  await J.fechar();
});

test('juntar progressos não perde nada dos dois lados', async()=>{
  const J = await abrir(A.browser, A.url);
  const r = await J.ev(()=>mesclarProgresso(
    { nome:'Ana', personagem:'ze', fases:{1:{feita:true,tempos:{normal:120}},2:{feita:true,tempo:300}}, cordeis:['c1'], conquistas:{a:5}, fezCom:['ze'], estat:{inimigos:3}, bonusVida:0, fim:false },
    { nome:'Ana', personagem:'tiao', fases:{1:{feita:true,tempos:{normal:100,facil:80}},3:{feita:true,tempos:{dificil:500}}}, cordeis:['c2'], conquistas:{a:2,b:7}, fezCom:['tiao'], estat:{inimigos:9}, bonusVida:1, fim:true }));
  assert.equal(r.personagem, 'ze', 'as escolhas do aparelho valem');
  assert.deepEqual(r.fases, { 1:{feita:true,tempos:{normal:100,facil:80}}, 2:{feita:true,tempos:{normal:300}}, 3:{feita:true,tempos:{dificil:500}} });
  assert.deepEqual(r.cordeis.sort(), ['c1','c2']);
  assert.deepEqual(r.conquistas, { a:2, b:7 });
  assert.deepEqual(r.fezCom.sort(), ['tiao','ze']);
  assert.deepEqual([r.estat.inimigos, r.bonusVida, r.fim], [9, 1, true]);
  await J.fechar();
});
