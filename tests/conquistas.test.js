// Conquistas: desbloqueio, aviso, tela de conquistas e visuais liberados.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { preparar, abrir } = require('./ajuda');

let A, J;
before(async()=>{ A=await preparar(); J=await abrir(A.browser,A.url); await J.criarJogador('Dora','ze'); });
after(async()=>{ await A.fim(); });

test('primeiro cordel dá conquista, aviso e libera o chapéu de palha', async()=>{
  await J.comecarFase(1);
  await J.tp(21,8); await J.ate(()=>dlg.open); await J.pular();
  assert.ok(await J.ev(()=>temConquista(perfil,'primeiro_cordel')));
  await J.ate(()=>!$('avisoConquista').hidden);
  assert.equal(await J.page.textContent('#avisoConquistaNome'), 'Leitor de cordel');
  assert.ok(await J.ev(()=>visualLiberado(perfil,CHAPEUS.palha)));
  assert.ok(!(await J.ev(()=>visualLiberado(perfil,CHICOTES.dourado))));
});

test('bater na Caipora é conquista secreta', async()=>{
  await J.ev(()=>{ const c=npcs.find(n=>n.type==='caipora'); p.x=c.x-16; p.y=c.y; p.dir={x:1,y:0}; p.inv=0; });
  await J.page.keyboard.press('Space'); await J.ate(()=>dlg.open); await J.pular();
  assert.ok(await J.ev(()=>temConquista(perfil,'desrespeito')));
});

test('vencer as 8 cabras e concluir sem dano em menos de 2 minutos', async()=>{
  await J.comecarFase(1);
  const r=await J.ev(()=>{ S0.kills=7; inimigos[0].hp=1; inimigos[0].dead=false;
    golpearInimigo(inimigos[0]); time=100; S0.danos=0; S0.saindo=true; concluirFase();
    return ['pastor','ligeiro','firme','pe_na_estrada'].map(id=>temConquista(perfil,id)); });
  assert.deepEqual(r, [true,true,true,true]);
});

test('tela de conquistas e escolha de visual', async()=>{
  await J.page.click('#btnMenuFim'); await J.page.click('#btnConquistas');
  assert.equal(await J.ev(()=>telaAtual), 'telaConquistas');
  assert.match(await J.page.textContent('#contaConquistas'), /^6 de 14/);
  await J.page.click('#btnVoltarConquistas'); await J.page.click('#btnPersonagem');
  await J.page.click('#amostrasChapeu [data-vis="palha"]'); await J.page.click('#amostrasChicote [data-vis="trancado"]');
  await J.page.dispatchEvent('#amostrasChicote [data-vis="dourado"]','click');   // bloqueado: não muda
  assert.deepEqual(await J.ev(()=>visualDe(perfil)), {chapeu:'palha', chicote:'trancado'});
  assert.deepEqual(J.erros, []);
});
