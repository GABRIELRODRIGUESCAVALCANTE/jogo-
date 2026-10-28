// Almanaque do Sertão: páginas se abrem quando a criatura aparece, e os encontros são contados.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { preparar, abrir, sleep } = require('./ajuda');

let A, J;
before(async()=>{ A=await preparar(); J=await abrir(A.browser,A.url); await J.criarJogador('Ana','tiao'); });
after(async()=>{ await A.fim(); });
const reg=id=>J.ev(id=>(almanaqueDe(perfil)[id]||null),id);

test('ver, vencer e conversar enchem o almanaque', async()=>{
  await J.comecarFase(1);
  await J.invencivel();
  assert.equal(await reg('cabra'), null);
  // uma cabra na tela abre a página dela, com aviso
  await J.ev(()=>{ const c=inimigos.find(c=>c.tipo==='cabra'); c.x=p.x+40; c.y=p.y; });
  await J.ate(()=>(almanaqueDe(perfil).cabra||{}).vista>0);
  assert.match(await J.page.textContent('#toast'), /Cabra Cabriola/);
  // vencer conta
  await J.ev(()=>{ const c=inimigos.find(c=>c.tipo==='cabra' && !c.dead); c.hp=1; c.x=p.x; c.y=p.y-14; p.dir={x:0,y:-1}; });
  await J.page.keyboard.press('Space');
  await J.ate(()=>(almanaqueDe(perfil).cabra||{}).n===1);
  // conversar com a Caipora conta
  await J.tp(21,8); await J.ate(()=>dlg.open); await J.pular();
  await J.falar(7,9);
  assert.equal((await reg('caipora')).n, 1);

  await J.ev(()=>abrirMenu());
  await J.page.click('#btnAlmanaque');
  assert.equal(await J.ev(()=>telaAtual), 'telaAlmanaque');
  assert.equal(await J.page.textContent('#contaAlmanaque'), '2 de 8 criaturas encontradas');
  const titulos = await J.page.locator('#listaAlmanaque h3').allTextContents();
  assert.equal(titulos.length, 8);
  assert.deepEqual(titulos.slice(0,2), ['Caipora','Cabra Cabriola']);
  assert.equal(titulos.filter(x=>x==='Página em branco').length, 6);
  assert.deepEqual(await J.page.locator('#listaAlmanaque .contagem').allTextContents(), ['Conversas: 1','Vencidos por você: 1']);
  await J.ev(()=>trocarIdioma('en'));
  assert.equal(await J.page.textContent('#contaAlmanaque'), '2 of 8 creatures found');
  await J.ev(()=>trocarIdioma('pt'));
  await J.page.keyboard.press('Escape');
  assert.equal(await J.ev(()=>telaAtual), 'telaMenu');
  assert.deepEqual(J.erros, []);
});

test('chefe vencido entra no almanaque e os contadores sobrevivem a juntar progressos', async()=>{
  await J.comecarFase(3);
  await J.invencivel();
  await J.ev(()=>{ chefe.active=true; });
  await J.ate(()=>(almanaqueDe(perfil).mula||{}).vista>0);
  await J.ev(()=>{ chefe.hp=1; aoVencerChefe(); });
  assert.equal((await reg('mula')).n, 1);
  const junto = await J.ev(()=>mesclarProgresso({estat:{inimigos:1, criaturas:{mula:{vista:5,n:1}}}}, {estat:{inimigos:4, criaturas:{mula:{vista:3,n:2}, cabra:{vista:1,n:7}}}}).estat);
  assert.deepEqual(junto, { inimigos:4, criaturas:{ mula:{vista:5,n:2}, cabra:{vista:1,n:7} } });
  assert.deepEqual(J.erros, []);
});
