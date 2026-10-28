// Armas além do chicote: gibão de couro (Vô Chico), baladeira (Bené) e tição para arremessar (Noite de São João).
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { preparar, abrir, sleep } = require('./ajuda');

let A, J;
before(async()=>{ A=await preparar(); J=await abrir(A.browser,A.url); await J.criarJogador('Ana','luzia'); });
after(async()=>{ await A.fim(); });
const armas=()=>J.ev(()=>Object.assign({},perfil.armas));

test('o Vô Chico dá o gibão, que segura o primeiro golpe de cada luta', async()=>{
  await J.comecarFase(1);
  assert.deepEqual(await armas(), {});
  await J.falar(21,19);                                     // o Vô Chico fica do lado da casa
  assert.deepEqual(await armas(), { gibao:true });
  // numa luta com chefe, o primeiro golpe não tira coração; o segundo tira
  await J.comecarFase(3);
  const r = await J.ev(()=>{
    chefe.active=true; const antes=S0.hp;
    p.inv=0; hurt(1,p.x+10,p.y); const depois1=S0.hp;
    p.inv=0; hurt(1,p.x+10,p.y); const depois2=S0.hp;
    return { antes, depois1, depois2, usado:S0.gibaoUsado };
  });
  assert.deepEqual(r, { antes:r.antes, depois1:r.antes, depois2:r.antes-1, usado:true });
  assert.match(await J.page.textContent('#bolsa'), /Gibão rasgado/);
  // sem chefe, o gibão não entra
  await J.comecarFase(1);
  assert.equal(await J.ev(()=>{ const a=S0.hp; p.inv=0; hurt(1,p.x+10,p.y); return a-S0.hp; }), 1);
  assert.deepEqual(J.erros, []);
});

test('o Bené dá a baladeira; a pedra acerta de longe e segue as regras do chefe', async()=>{
  await J.comecarFase(2);
  assert.equal(await J.ev(()=>armaDeArremesso()), null);
  await J.falar(21,19);
  assert.equal((await armas()).baladeira, true);
  assert.equal(await J.ev(()=>armaDeArremesso()), 'pedra');
  await J.invencivel();
  // um jacaré à direita, longe do chicote
  const vida = await J.ev(()=>{ const c=inimigos.find(c=>c.tipo==='jacare' && !c.dead); c.x=p.x+60; c.y=p.y; c.estado='parado'; p.dir={x:1,y:0}; return c.hp; });
  await J.page.keyboard.press('KeyQ');
  await J.ate(v=>inimigos.some(c=>c.tipo==='jacare' && c.hp<v), vida);
  // Caboclo: debaixo d'água a pedra só espirra; fora d'água tira vida
  const caboclo = await J.ev(()=>{
    chefe.active=true; chefe.estado='fundo'; const a=chefe.hp;
    acertarChefe(chefe,1); const fundo=chefe.hp;
    chefe.estado='fora'; acertarChefe(chefe,1);
    return [a, fundo, chefe.hp];
  });
  assert.deepEqual(caboclo, [caboclo[0], caboclo[0], caboclo[0]-1]);
  assert.deepEqual(J.erros, []);
});

test('na Noite de São João, o tição jogado no chão assusta o Lobisomem', async()=>{
  await J.comecarFase(4);
  await J.invencivel();
  await J.ev(()=>{ S0.ticao=true; S0.ticoes=TICOES_MAX; p.dir={x:1,y:0}; updateHud(); });
  assert.equal(await J.ev(()=>armaDeArremesso()), 'ticao', 'com tição na mão, arremessa o tição');
  assert.match(await J.page.textContent('#bolsa'), /Tições: 3\/3/);
  await J.page.keyboard.press('KeyQ');
  await J.ate(()=>pedras.some(q=>q.tipo==='ticao' && q.chao));
  assert.equal(await J.ev(()=>S0.ticoes), 2);
  // o Lobisomem chega perto do tição caído e fica com medo
  await J.ev(()=>{ const q=pedras.find(q=>q.chao); chefe.active=true; chefe.estado='ronda'; chefe.cdMedo=0; chefe.x=q.x+20; chefe.y=q.y; });
  await J.ate(()=>chefe.estado==='medo');
  // perto de uma fogueira acesa, os tições voltam
  await J.ev(()=>{ const f=npcs.find(n=>n.type==='fogueira' && n.acesa); p.x=f.x; p.y=f.y+18; });
  await J.ate(()=>S0.ticoes===TICOES_MAX);
  assert.deepEqual(J.erros, []);
});

test('quem já tinha passado das fases ganha as armas, e elas se juntam entre aparelhos', async()=>{
  const r = await J.ev(()=>{ const pf={fases:{1:{feita:true},2:{feita:true}}}; armasDeQuemJaJogou(pf); return pf.armas; });
  assert.deepEqual(r, { gibao:true, baladeira:true });
  const junto = await J.ev(()=>mesclarProgresso({armas:{gibao:true}}, {armas:{baladeira:true}}).armas);
  assert.deepEqual(junto, { gibao:true, baladeira:true });
  // a ação nova aparece nas Opções e na legenda
  await J.ev(()=>abrirMenu());
  await J.page.click('#btnOpcoes');
  assert.match(await J.page.textContent('#listaTeclas'), /Arremessar/);
  assert.deepEqual(J.erros, []);
});
