// Joga a campanha inteira com o Tião: fases, chefes, final e a liberação da Rosa.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { preparar, abrir, sleep } = require('./ajuda');

let A, J;
before(async()=>{ A=await preparar(); J=await abrir(A.browser,A.url); await J.criarJogador('Ana','tiao'); });
after(async()=>{ await A.fim(); });
const st=()=>J.ev(()=>({stage:S0.stage,hp:S0.hp,max:S0.maxHp,fase:fase.id}));

test('fase 1: Caipora, fumo, espinheiro e saída', async()=>{
  await J.comecarFase(1);
  assert.equal((await st()).max, 4, 'Tião começa com 4 corações');
  await J.tp(21,8); await J.ate(()=>dlg.open); await J.pular();
  await J.falar(7,9); assert.equal((await st()).stage, 2);
  await J.invencivel(); await J.tp(43,6); await J.ate(()=>S0.stage===3);
  await J.falar(7,9); await J.ate(()=>S0.stage===4);
  const s=await st(); assert.equal(s.stage,4); assert.equal(s.max,5, 'bênção da Caipora');
  assert.equal(await J.ev(()=>perfil.bonusVida), 1);
  await J.tp(23,3); await J.andarAte('ArrowUp',()=>dlg.open); await J.pular(); await J.ate(()=>!$('ovFim').hidden);
  assert.ok(await J.ev(()=>perfil.fases[1].feita && perfil.cordeis.includes('c1')));
});

test("fase 2: barqueiro, tábuas, Caboclo d'água e ponte", async()=>{
  await J.comecarFase(2);
  await J.falar(21,19); assert.equal((await st()).stage, 2);
  await J.invencivel(); await J.tp(7,13); await J.ate(()=>S0.tabuas===1); await J.tp(3,22); await J.ate(()=>S0.tabuas===2);
  await J.tp(34,23); await J.ate(()=>dlg.open); await J.pular(); await J.ate(()=>chefe.active);
  assert.ok(await J.ev(()=>chefe.active), 'Caboclo ativo');
  for(let k=0;k<6 && !(await J.ev(()=>chefe.dead));k++){
    await J.ev(()=>{ const s=chefe.spots.find(s=>!SOLID.has(tileAt((s.x-8)/16-1,(s.y-8)/16))); Object.assign(chefe,{x:s.x,y:s.y,estado:'fora',t:1.6,tiros:9}); Object.assign(p,{x:s.x-16,y:s.y,dir:{x:1,y:0},inv:999}); });
    await J.page.keyboard.press('Space'); await sleep(560);
  }
  assert.ok(await J.ev(()=>chefe.dead && S0.chefeVencido), 'Caboclo vencido');
  await J.pular();
  await J.ev(()=>{ const t=items.find(i=>i.id==='tc'); p.x=t.x; p.y=t.y; }); await J.ate(()=>S0.stage===3);
  await J.falar(21,19); await J.ate(()=>S0.ponte);
  assert.ok(await J.ev(()=>S0.ponte && map[13][23]==='='), 'ponte consertada');
  await J.tp(23,3); await J.andarAte('ArrowUp',()=>dlg.open); await J.pular(); await J.ate(()=>!$('ovFim').hidden);
});

test('fase 3: brasas, Mula sem Cabeça e Boi Estrela', async()=>{
  await J.comecarFase(3);
  const hp0=(await st()).hp;
  await J.ev(()=>{ p.inv=0; p.x=14*16+8; p.y=20*16+8; }); await J.ate(h=>S0.hp<h, hp0); await J.pular();
  await J.invencivel(); await J.tp(24,10); await J.ate(()=>dlg.open); await J.pular(); await J.ate(()=>chefe.active);
  assert.ok(await J.ev(()=>chefe.active), 'Mula ativa');
  for(let k=0;k<6 && !(await J.ev(()=>chefe.dead));k++){
    await J.ev(()=>{ chefe.state='stun'; chefe.t=.5; Object.assign(p,{inv:999,x:chefe.x-20,y:chefe.y,dir:{x:1,y:0}}); });
    await J.page.keyboard.press('Space'); await sleep(560);
  }
  assert.ok(await J.ev(()=>chefe.dead), 'Mula vencida');
  await J.pular();
  await J.ev(()=>{ const b=npcs.find(n=>n.type==='boi'); p.x=b.x; p.y=b.y+30; }); await J.andarAte('ArrowUp',()=>dlg.open); await J.pular(); await J.ate(()=>!$('ovFim').hidden);
  assert.ok(await J.ev(()=>liberado('rosa',perfil)), 'Rosa liberada');
});

test('Rosa não se queima nas brasas', async()=>{
  await J.ev(()=>{ perfil.personagem='rosa'; heroi=PERSONAGENS.rosa; });
  await J.comecarFase(3);
  const hp=(await st()).hp; await J.ev(()=>{ p.inv=0; p.x=14*16+8; p.y=20*16+8; }); await sleep(300); await J.pular();
  assert.equal((await st()).hp, hp);
  assert.deepEqual(J.erros, []);
});
