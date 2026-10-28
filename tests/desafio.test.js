// Desafio dos Chefes: liberado ao terminar a jornada, quatro lutas seguidas com a mesma vida e recorde próprio.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { preparar, abrir, sleep } = require('./ajuda');

let A, J;
before(async()=>{ A=await preparar(); J=await abrir(A.browser,A.url); await J.criarJogador('Ana','tiao'); });
after(async()=>{ await A.fim(); });
const etapa=()=>J.ev(()=>({ n:desafio && desafio.etapa, fase:fase.id, chefe:!!(chefe && chefe.active), hp:S0.hp, livre:!boxHits(p.x,p.y,p.w,p.h) }));

test('o desafio só abre depois da jornada', async()=>{
  assert.equal(await J.page.getAttribute('#btnDesafio','aria-disabled'), 'true');
  assert.match(await J.page.textContent('#btnDesafio'), /Termine a jornada/);
  await J.page.dispatchEvent('#btnDesafio','click');
  assert.equal(await J.ev(()=>telaAtual), 'telaMenu');
  await J.ev(()=>{ perfil.fim=true; salvarPerfis(); abrirMenu(); });
  assert.equal(await J.page.getAttribute('#btnDesafio','aria-disabled'), null);
});

test('quatro lutas seguidas, com a mesma vida, até o recorde', async()=>{
  await J.page.click('#btnDesafio');
  await J.page.waitForSelector('#ovTitulo:not([hidden])');
  assert.equal(await J.page.textContent('#tituloNome'), 'Desafio dos Chefes');
  await J.page.click('#btnComecarFase');
  assert.equal(await J.ev(()=>dlg.open), false, 'sem falas de abertura');
  let e = await etapa();
  assert.deepEqual([e.n, e.fase, e.livre], [0, 1, true]);
  assert.equal(await J.ev(()=>items.length), 0, 'sem rapadura nem cordel');
  assert.ok(await J.ev(()=>inimigos.every(c=>c.brava)), 'as cabras vêm de longe');
  assert.match(await J.page.textContent('#objetivo'), /Desafio 1\/4/);

  // vence as cabras com 2 corações: a próxima luta começa com 2
  await J.ev(()=>{ S0.hp=2; for(const c of inimigos) c.dead=true; });
  await J.ate(()=>desafio.etapa===1 && fase.id===2);
  e = await etapa(); assert.deepEqual([e.chefe, e.hp, e.livre], [true, 2, true]);
  assert.match(await J.page.textContent('#chefe'), /Caboclo/);

  for(const [n,f] of [[2,3],[3,4]]){
    await J.ev(()=>{ chefe.hp=0; chefeVencido(); });
    await J.ate(([n,f])=>desafio.etapa===n && fase.id===f, [n,f]);
    e = await etapa(); assert.deepEqual([e.chefe, e.hp, e.livre], [true, 2, true], `luta ${n+1}`);
  }
  assert.equal(await J.ev(()=>fogueirasAcesas().length), 4, 'na noite, as fogueiras já estão acesas');
  await J.ev(()=>{ chefe.hp=0; chefeVencido(); });
  await J.page.waitForSelector('#ovDesafio:not([hidden])');
  assert.equal(await J.page.textContent('#desafioTitulo'), 'Desafio vencido!');
  assert.match(await J.page.textContent('#desafioRecorde'), /Novo recorde/);
  const r = await J.ev(()=>({ tempo:recordeDesafio(perfil), salva:!!partidaSalva(perfil) }));
  assert.ok(r.tempo>0); assert.equal(r.salva, false, 'o desafio não deixa partida para continuar');

  // ranking: aba própria
  await J.page.click('#btnDesafioMenu');
  assert.match(await J.page.textContent('#btnDesafio'), /Melhor:/);
  await J.page.click('#btnRanking');
  await J.page.click('#abasRanking .aba >> nth=-1');
  assert.equal(await J.page.textContent('#tituloRanking'), 'Desafio dos Chefes');
  assert.deepEqual(await J.page.locator('#listaRanking .quem b').allTextContents(), ['Ana']);
  assert.deepEqual(J.erros, []);
});

test('cair no meio acaba o desafio, e reiniciar começa do zero', async()=>{
  await J.ev(()=>abrirMenu());
  await J.page.click('#btnDesafio'); await J.page.click('#btnComecarFase');
  await J.ev(()=>{ S0.hp=1; p.inv=0; hurt(1,p.x+10,p.y); });
  await J.page.waitForSelector('#ovDesafio:not([hidden])');
  assert.equal(await J.page.textContent('#desafioTitulo'), 'O desafio acabou');
  assert.match(await J.page.textContent('#desafioTexto'), /luta 1 de 4/);
  await J.page.click('#btnDesafioDeNovo');
  await J.page.click('#btnComecarFase');
  assert.deepEqual(await J.ev(()=>[desafio.etapa, desafio.tempo, S0.hp===S0.maxHp]), [0, 0, true]);
  await J.ev(()=>abrirMenu());
  assert.equal(await J.ev(()=>desafio), null);
  assert.deepEqual(J.erros, []);
});
