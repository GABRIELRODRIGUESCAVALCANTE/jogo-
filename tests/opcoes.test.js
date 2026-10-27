// Opções: teclas configuráveis, acessibilidade e volume.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { preparar, abrir, sleep } = require('./ajuda');

let A, J;
before(async()=>{ A=await preparar(); J=await abrir(A.browser,A.url); await J.criarJogador('Iara','luzia'); });
after(async()=>{ await A.fim(); });

test('trocar a tecla do chicote vale no jogo e aparece na legenda', async()=>{
  await J.page.click('#btnOpcoes'); assert.equal(await J.ev(()=>telaAtual), 'telaOpcoes');
  const linhas=await J.page.locator('#listaTeclas button').count(); assert.equal(linhas, 7);
  await J.page.click('#listaTeclas button >> nth=4');           // chicote
  await J.page.keyboard.press('KeyF');
  assert.equal(await J.ev(()=>KEYMAP.KeyF), 'whip');
  assert.equal(await J.ev(()=>KEYMAP.Space), 'whip', 'as teclas padrão continuam valendo');
  await J.page.click('#btnVoltarOpcoes'); assert.equal(await J.ev(()=>telaAtual), 'telaMenu');
  await J.comecarFase(1);
  await J.page.keyboard.press('KeyF'); await J.ate(()=>p.whipT>0);
  assert.match(await J.page.textContent('.legenda'), /F/);
});

test('opções abertas no meio do jogo voltam para o jogo pausado', async()=>{
  await J.page.click('#btnOpcoes');
  assert.equal(await J.ev(()=>[telaAtual,paused].join()), 'telaOpcoes,true');
  await J.page.check('#opContraste'); await J.page.check('#opTexto'); await J.page.uncheck('#opSeta');
  await J.page.fill('#opVolMusica','40'); await J.page.dispatchEvent('#opVolMusica','input');
  assert.deepEqual(await J.ev(()=>({c:contraste, g:document.body.classList.contains('texto-grande'), s:mostrarSeta, v:volMusica})), {c:true, g:true, s:false, v:.4});
  await J.page.keyboard.press('Escape');
  assert.equal(await J.ev(()=>telaAtual), 'telaJogo');
  assert.ok(await J.page.isVisible('#ovPausa'));
  await J.page.click('#btnVoltar'); assert.ok(await J.ev(()=>running));
});

test('as opções ficam salvas e podem voltar ao padrão', async()=>{
  await J.page.reload(); await J.page.waitForFunction(()=>typeof telaAtual!=='undefined');
  assert.deepEqual(await J.ev(()=>({c:contraste, s:mostrarSeta, f:KEYMAP.KeyF})), {c:true, s:false, f:'whip'});
  await J.page.click('#btnOpcoes'); await J.page.click('#btnTeclasPadrao');
  assert.equal(await J.ev(()=>KEYMAP.KeyF), undefined);
  assert.deepEqual(J.erros, []);
});
