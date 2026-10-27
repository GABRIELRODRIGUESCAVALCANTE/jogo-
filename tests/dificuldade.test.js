// Dificuldade: corações, velocidade dos inimigos, vida dos chefes e recordes separados.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { preparar, abrir } = require('./ajuda');

let A, J;
before(async()=>{ A=await preparar(); J=await abrir(A.browser,A.url); });
after(async()=>{ await A.fim(); });

test('jogador novo escolhe a dificuldade', async()=>{
  await J.page.fill('#nomeNovo','Tonho');
  await J.page.click('#difNovo [data-dif="facil"]');
  await J.page.click('#formNovo button[type=submit]'); await J.ate(()=>telaAtual==='telaMenu');
  assert.equal(await J.ev(()=>perfil.dificuldade), 'facil');
  await J.comecarFase(1);
  assert.equal(await J.ev(()=>S0.maxHp), 5, 'Zé no Fácil tem 5 corações');
});

test('Difícil: menos corações, chefe mais forte e inimigos mais rápidos', async()=>{
  await J.ev(()=>{ perfil.dificuldade='dificil'; perfil.fases[1]=perfil.fases[2]={feita:true}; });
  await J.comecarFase(3);
  const r=await J.ev(()=>({hp:S0.maxHp, mula:chefe.max, vel:dif().vel}));
  assert.deepEqual(r, {hp:2, mula:8, vel:1.2});
  await J.ev(()=>{ perfil.dificuldade='facil'; });
  await J.comecarFase(3);
  assert.equal(await J.ev(()=>chefe.max), 4);
});

test('recordes ficam separados por dificuldade e perfis antigos contam como Normal', async()=>{
  const r=await J.ev(()=>{
    perfil.fases[1]={feita:true, tempo:200};                       // formato antigo
    const antigo=recorde(perfil,1,'normal');
    perfil.dificuldade='facil'; jogarFase(1); $('btnComecarFase').click(); fecharDialogo(); time=90; concluirFase();
    return {antigo, facil:recorde(perfil,1,'facil'), normal:recorde(perfil,1,'normal'), texto:$('fimRecorde').textContent};
  });
  assert.deepEqual({a:r.antigo, f:r.facil, n:r.normal}, {a:200, f:90, n:200});
  assert.match(r.texto, /Novo recorde no Fácil/);
  await J.page.click('#btnMenuFim');
  assert.ok(await J.page.isVisible('#difMenu [data-dif="facil"][aria-checked="true"]'));
  assert.deepEqual(J.erros, []);
});
