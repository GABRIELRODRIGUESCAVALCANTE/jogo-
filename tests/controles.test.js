// Toque no celular e controle de videogame (simulado).
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { preparar, abrir, sleep } = require('./ajuda');

let A;
before(async()=>{ A=await preparar(); });
after(async()=>{ await A.fim(); });

test('direcional de toque desliza e faz diagonais', async()=>{
  const J=await abrir(A.browser,A.url,{celular:true});
  await J.criarJogador('Maria'); await J.comecarFase(1);
  assert.equal(await J.ev(()=>getComputedStyle($('controles')).display), 'flex');
  const box=await J.page.locator('.dpad').boundingBox(), cx=box.x+box.width/2, cy=box.y+box.height/2;
  const toque=(tipo,x,y)=>J.ev(([tipo,x,y])=>document.querySelector('.dpad').dispatchEvent(new PointerEvent(tipo,{pointerId:7,pointerType:'touch',clientX:x,clientY:y,bubbles:true})),[tipo,x,y]);
  const x0=await J.ev(()=>p.x);
  await toque('pointerdown',cx+60,cy); await sleep(300);
  assert.ok(await J.ev(()=>p.x) > x0, 'andou para a direita');
  await toque('pointermove',cx+60,cy-60); await sleep(50);
  assert.deepEqual(await J.ev(()=>[...document.querySelectorAll('.dpad .on')].map(e=>e.dataset.k).sort()), ['right','up']);
  await toque('pointerup',cx+60,cy-60); await sleep(50);
  assert.equal(await J.page.locator('.dpad .on').count(), 0);
  assert.deepEqual(J.erros, []);
  await J.fechar();
});

test('controle navega nos menus e joga', async()=>{
  const J=await abrir(A.browser,A.url,{antes:()=>{ window.__gp={connected:true,axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false}))}; navigator.getGamepads=()=>[window.__gp]; }});
  await J.criarJogador('Caio');
  const aperta=async i=>{ await J.ev(i=>__gp.buttons[i].pressed=true,i); await sleep(60); await J.ev(i=>__gp.buttons[i].pressed=false,i); await sleep(60); };
  await aperta(15); await aperta(15); await aperta(15);
  assert.equal(await J.ev(()=>document.activeElement.id), 'btnPersonagem');
  await aperta(0); assert.equal(await J.ev(()=>telaAtual), 'telaPersonagem');
  await aperta(1); assert.equal(await J.ev(()=>telaAtual), 'telaMenu');
  await J.page.click('#btnJogar'); await sleep(100); await aperta(0);
  assert.ok(await J.ev(()=>running && dlg.open), 'A começa a fase');
  await J.pular();
  await J.ev(()=>{ __gp.axes=[-1,0]; }); const x0=await J.ev(()=>p.x); await sleep(300); await J.ev(()=>{ __gp.axes=[0,0]; });
  assert.ok(await J.ev(()=>p.x) < x0, 'analógico anda');
  assert.deepEqual(J.erros, []);
  await J.fechar();
});
