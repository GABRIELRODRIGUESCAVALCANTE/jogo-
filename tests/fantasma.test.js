// Fantasma do melhor tempo: grava o caminho do recorde e corre junto na próxima tentativa.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { preparar, abrir, sleep } = require('./ajuda');

let A, J;
before(async()=>{ A=await preparar(); J=await abrir(A.browser,A.url); await J.criarJogador('Ana','luzia'); });
after(async()=>{ await A.fim(); });
const guardado=()=>J.ev(()=>store.get(chaveFantasma(perfil,1,'normal')));

test('o recorde vira fantasma e corre junto na próxima vez', async()=>{
  await J.comecarFase(1);
  await J.invencivel();
  assert.equal(await J.ev(()=>fantasma), null, 'sem recorde, sem fantasma');
  await J.andar('ArrowRight', 700);
  const fim = await J.ev(()=>{ concluirFase(); return { tempo:time, x:p.x }; });
  const f = await guardado();
  assert.ok(f, 'fantasma guardado');
  assert.equal(f.tempo, fim.tempo);
  assert.equal(f.personagem, 'luzia');
  assert.ok(Math.abs(f.pts.length/3 - Math.ceil(fim.tempo/.1)) <= 1, 'um ponto a cada 0,1 s');

  // na próxima tentativa, o fantasma sai do mesmo lugar e anda para a direita como no recorde
  await J.comecarFase(1);
  const inicio = await J.ev(()=>{ const g=posFantasma(); return g && { x:g.x, dist:Math.hypot(g.x-p.x,g.y-p.y) }; });
  assert.ok(inicio && inicio.dist<2, 'começa onde o jogador começa');
  await sleep(450);
  const depois = await J.ev(()=>posFantasma());
  assert.ok(depois.x > inicio.x+8, 'o fantasma anda no ritmo do recorde');
  // depois do tempo do recorde, ele some
  await J.ev(t=>{ time=t+1; }, fim.tempo);
  assert.equal(await J.ev(()=>posFantasma()), null);
  assert.deepEqual(J.erros, []);
});

test('tempo pior não troca o fantasma; dá para desligar; apagar o jogador apaga os fantasmas', async()=>{
  const antes = await guardado();
  await J.comecarFase(1);
  await J.ev(()=>{ time=999; concluirFase(); });
  assert.equal((await guardado()).tempo, antes.tempo);

  await J.ev(()=>{ prefs.fantasma=false; jogarFase(1); });
  assert.equal(await J.ev(()=>fantasma), null);
  await J.ev(()=>{ prefs.fantasma=true; });

  const id = await J.ev(()=>perfil.id);
  await J.ev(id=>apagarPerfil(id), id);
  assert.equal(await J.ev(id=>localStorage.getItem(`estrela-do-sertao:fantasma:${id}:1:normal`), id), null);
  assert.deepEqual(J.erros, []);
});
