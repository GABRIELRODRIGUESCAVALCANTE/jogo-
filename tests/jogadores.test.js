// Jogadores: criar, validar nome, escolher personagem, salvar/continuar, pausar e apagar.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { preparar, abrir, sleep } = require('./ajuda');

let A, J;
before(async()=>{ A=await preparar(); J=await abrir(A.browser,A.url); });
after(async()=>{ await A.fim(); });

test('sem jogadores, abre o formulário de novo jogador', async()=>{
  assert.equal(await J.ev(()=>telaAtual), 'telaNovo');
  await J.page.click('#formNovo button[type=submit]');
  assert.ok(await J.page.isVisible('#erroNovo'), 'nome vazio mostra erro');
  assert.ok(await J.ev(()=>document.querySelector('#escolhaNovo [data-id="rosa"]').getAttribute('aria-disabled')==='true'), 'Rosa começa bloqueada');
});

test('cria jogador e troca de personagem', async()=>{
  await J.criarJogador('Gabriel','luzia');
  assert.equal(await J.ev(()=>heroi.nome), 'Luzia');
  await J.page.click('#btnPersonagem'); await J.page.click('#listaPersonagens [data-id="tiao"]');
  assert.equal(await J.ev(()=>perfil.personagem), 'tiao');
  await J.page.click('#btnVoltarPers');
});

test('pausa, sai para o menu e continua depois de recarregar', async()=>{
  await J.page.click('#btnJogar'); await J.page.click('#btnComecarFase'); await sleep(60); await J.pular();
  await J.invencivel(); await J.tp(43,6); await sleep(100);
  await J.page.keyboard.press('Escape'); assert.ok(await J.page.isVisible('#ovPausa'));
  await J.page.click('#btnSairMenu');
  assert.match(await J.page.textContent('#btnJogar'), /^Continuar/);
  await J.page.reload(); await J.page.waitForFunction(()=>telaAtual==='telaPerfis');
  await J.page.click('.perfil-entrar'); await J.page.click('#btnJogar'); await sleep(100);
  assert.deepEqual(await J.ev(()=>({fase:fase.id, fumo:S0.hasFumo, stage:S0.stage, run:running})), {fase:1, fumo:true, stage:3, run:true});
});

test('nome repetido é recusado e jogador pode ser apagado', async()=>{
  await J.page.keyboard.press('Escape'); await J.page.click('#btnSairMenu');
  await J.page.click('#btnTrocar'); await J.page.click('#btnNovoPerfil');
  await J.page.fill('#nomeNovo','gabriel'); await J.page.click('#formNovo button[type=submit]');
  assert.match(await J.page.textContent('#erroNovo'), /Já existe/);
  await J.criarJogador('Beto');
  await J.page.click('#btnTrocar');
  assert.equal(await J.page.locator('.perfil').count(), 2);
  await J.page.click('.perfil:first-child .link'); await J.page.click('.perfil:first-child .link.perigo');
  assert.equal(await J.page.locator('.perfil').count(), 1);
  assert.equal(await J.page.textContent('.perfil-nome'), 'Gabriel');
  assert.deepEqual(J.erros, []);
});
