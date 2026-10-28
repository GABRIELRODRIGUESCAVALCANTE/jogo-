// Música que reage à partida, poeira, fagulhas e os olhos do Lobisomem no escuro.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { preparar, abrir, sleep } = require('./ajuda');

let A, J;
before(async()=>{ A=await preparar(); J=await abrir(A.browser,A.url); await J.criarJogador('Ana','luzia'); });
after(async()=>{ await A.fim(); });

test('a música apressa com um coração e ganha percussão perto do perigo', async()=>{
  await J.comecarFase(1);
  await J.invencivel();
  await J.ev(()=>{ for(const c of inimigos) c.dead=true; });
  assert.deepEqual(await J.ev(()=>climaMusica()), { acel:1, tensao:false, chocalho:false });
  await J.ev(()=>{ S0.hp=1; });
  await J.ate(()=>mus.acel>1.08);                          // apressa aos poucos
  await J.ev(()=>{ const c=inimigos[0]; c.dead=false; c.x=p.x+30; c.y=p.y; });
  assert.equal((await J.ev(()=>climaMusica())).tensao, true);
  await J.ev(()=>{ S0.hp=S0.maxHp; for(const c of inimigos) c.dead=true; });
  await J.ate(()=>mus.acel<1.02);
  assert.deepEqual(J.erros, []);
});

test('o chocalho do boi toca quando ele vem andando junto', async()=>{
  await J.comecarFase(4);
  await J.invencivel();
  await J.page.keyboard.down('ArrowDown');
  await J.ate(()=>climaMusica().chocalho);
  await J.page.keyboard.up('ArrowDown');
  await J.ate(()=>!climaMusica().chocalho);
  assert.deepEqual(J.erros, []);
});

test('andar levanta poeira e a brasa solta fagulhas', async()=>{
  await J.comecarFase(1);
  await J.invencivel();
  await J.ev(()=>{ parts=[]; });
  await J.andarAte('ArrowRight',()=>parts.some(q=>q.g<0));  // poeira sobe em vez de cair
  await J.comecarFase(3);
  await J.invencivel();
  // leva o jogador para perto de um campo de brasa e espera as fagulhas
  const perto = await J.ev(()=>{ for(let y=0;y<MH;y++) for(let x=0;x<MW;x++) if(map[y][x]==='b') return [x,y]; });
  await J.tp(perto[0], perto[1]+2);
  await J.ate(()=>parts.some(q=>q.treme));
  assert.deepEqual(J.erros, []);
});

test('os olhos do Lobisomem brilham no escuro', async()=>{
  await J.comecarFase(4);
  const cor = await J.ev(()=>{
    running=false;
    chefe.active=false; chefe.estado='ronda'; chefe.face=1; chefe.x=p.x+60; chefe.y=p.y; time=0;   // sin(0) < .55: olhos abertos
    render();
    const cx=Math.round(clamp(p.x-VW/2,0,MW*T-VW)), cy=Math.round(clamp(p.y-VH/2,0,MH*T-VH));
    const x=Math.round(chefe.x)-cx, y=Math.round(chefe.y+chefe.h/2)-cy-21;
    return [...ctx.getImageData(x,y,1,1).data].slice(0,3);
  });
  assert.ok(cor[0]>200 && cor[1]>180, `olho deveria brilhar, cor ${cor}`);
  assert.deepEqual(J.erros, []);
});
