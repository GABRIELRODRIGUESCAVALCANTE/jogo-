// Cenas de cordel: aparecem antes da fase e no final, e podem ser desligadas.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { preparar, abrir } = require('./ajuda');

let A, J;
before(async()=>{ A=await preparar(); J=await abrir(A.browser,A.url,{cenas:true}); await J.criarJogador('Nina','luzia'); });
after(async()=>{ await A.fim(); });

test('a cena aparece antes da fase e leva ao cartão de título', async()=>{
  await J.page.click('#btnJogar');
  assert.equal(await J.ev(()=>telaAtual), 'telaCena');
  assert.equal(await J.page.textContent('#cenaTitulo'), 'O boi que fugiu na lua cheia');
  assert.equal(await J.page.locator('#cenaVerso span').count(), 4);
  const tinta=await J.ev(()=>{ const d=$('cenaTela').getContext('2d').getImageData(0,0,480,270).data; let n=0; for(let i=0;i<d.length;i+=4) if(d[i]<60) n++; return n; });
  assert.ok(tinta>8000, 'a ilustração foi desenhada');
  await J.page.click('#btnCenaSeguir');
  assert.ok(await J.page.isVisible('#ovTitulo'));
});

test('todas as cenas desenham sem erro nos três idiomas', async()=>{
  for(const lang of ['pt','en','es']){
    await J.ev(l=>trocarIdioma(l),lang);
    for(const id of ['1','2','3','4','final']) await J.ev(id=>{ desenharCena(id,$('cenaTela')); textoCena(id); },id);
  }
  await J.ev(()=>trocarIdioma('pt'));
  assert.deepEqual(J.erros, []);
});

test('dá para desligar as cenas nas Opções', async()=>{
  await J.page.click('#btnOpcoes'); await J.page.uncheck('#opCenas'); await J.page.click('#btnVoltarOpcoes');
  await J.ev(()=>{ abrirMenu(); });
  await J.page.click('#btnJogar');
  assert.ok(await J.page.isVisible('#ovTitulo'));
  assert.deepEqual(J.erros, []);
});
