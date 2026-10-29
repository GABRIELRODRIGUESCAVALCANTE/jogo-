// Heróis do sertão: Homem-Calango, Mulher-Mandacaru, Capitão Carcará e Raio do Sertão, com poderes e liberação.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { preparar, abrir, sleep } = require('./ajuda');

let A, J;
before(async()=>{ A=await preparar(); J=await abrir(A.browser,A.url); await J.criarJogador('Ana','ze'); });
after(async()=>{ await A.fim(); });
// troca de herói direto, como se tivesse escolhido na tela de personagens
const virar=id=>J.ev(id=>{ perfil.personagem=id; heroi=PERSONAGENS[id]; salvarPerfis(); }, id);
// aperta Poder e espera o jogo usar (o poder entra em recarga)
const poder=async()=>{ await J.page.keyboard.press('KeyR'); await J.ate(()=>poderT>0); };

test('os heróis aparecem trancados e são liberados pelas conquistas', async()=>{
  await J.ev(()=>abrirPersonagens());
  assert.equal(await J.page.locator('#listaPersonagens .pers').count(), 8);
  for(const id of ['calango','mandacaru','carcara','raio'])
    assert.equal(await J.page.getAttribute(`#listaPersonagens [data-id="${id}"]`,'aria-disabled'), 'true', id);
  const livres = await J.ev(()=>{
    const pf={fases:{2:{feita:true}}, conquistas:{lambada:1, ligeiro:1}, fim:false};
    const a=['calango','mandacaru','carcara','raio'].filter(id=>liberado(id,pf));
    pf.fim=true; return [a, liberado('calango',pf)];
  });
  assert.deepEqual(livres, [['mandacaru','carcara','raio'], true]);
  assert.match(await J.page.textContent('#listaPersonagens [data-id="raio"]'), /menos de 2 minutos/);
  assert.deepEqual(J.erros, []);
});

test('Homem-Calango anda por cima das pedras e o fio prende inimigos e puxa itens', async()=>{
  await virar('calango');
  await J.comecarFase(1);
  await J.invencivel();
  // uma pedra com chão livre à esquerda: o Calango sobe nela
  const [rx,ry] = await J.ev(()=>{ for(let y=4;y<MH-2;y++) for(let x=16;x<MW-2;x++) if(map[y][x]==='R' && !SOLID.has(map[y][x-1]) && !SOLID.has(map[y][x-2])) return [x,y]; });
  await J.tp(rx-2, ry);
  await J.andarAte('ArrowRight', ([rx])=>p.x>rx*T+4, [rx,ry]);
  assert.equal(await J.ev(()=>map[Math.floor(p.y/T)][Math.floor(p.x/T)]), 'R');
  // fio: um inimigo na frente fica preso
  await J.tp(30,11);
  await J.ev(()=>{ const c=inimigos.find(c=>!c.dead); c.x=p.x+50; c.y=p.y; p.dir={x:1,y:0}; });
  await poder();
  await J.ate(()=>inimigos.some(c=>c.preso>0));               // inimigo preso no fio
  // fio: um item na frente vem voando
  await J.ate(()=>poderT<=0);
  await J.ev(()=>{ for(const c of inimigos) c.dead=true; items.push({type:'cordel', id:'c2', x:p.x-70, y:p.y}); p.dir={x:-1,y:0}; });
  await poder();
  await J.ate(()=>perfil.cordeis.includes('c2'));
  assert.deepEqual(J.erros, []);
});

test('Mulher-Mandacaru solta espinhos e fere quem encosta', async()=>{
  await virar('mandacaru');
  await J.comecarFase(1);
  await J.invencivel();
  await J.ev(()=>{ for(const c of inimigos) c.dead=true; });
  await poder();
  assert.equal(await J.ev(()=>pedras.filter(q=>q.tipo==='espinho').length), 10);
  // uma cabra encosta: ela se fere
  const r = await J.ev(()=>{ const c=inimigos[0]; c.dead=false; c.hp=2; c.x=p.x; c.y=p.y; return c.hp; });
  await J.ate(h=>inimigos[0].hp<h || inimigos[0].dead, r);
  assert.deepEqual(J.erros, []);
});

test('Capitão Carcará voa por cima da brasa sem se queimar e mergulha nos inimigos', async()=>{
  await virar('carcara');
  await J.comecarFase(3);
  // uma brasa longe do alto da serra, onde a Mula começa a falar
  const [bx,by] = await J.ev(()=>{ for(let y=MH-1;y>=16;y--) for(let x=0;x<MW;x++) if(map[y][x]==='b') return [x,y]; });
  await J.tp(bx,by);
  await J.ev(()=>{ p.inv=99; for(const c of inimigos) c.dead=true; });
  await poder();
  const vida = await J.ev(()=>{ p.inv=0; return S0.hp; });
  await sleep(500);
  assert.equal(await J.ev(()=>S0.hp), vida, 'voando, a brasa não queima');
  assert.ok(await J.ev(()=>p.voo>0));
  // no fim do voo, mergulha em quem está embaixo
  await J.ev(()=>{ const c=inimigos[0]; c.dead=false; c.hp=3; c.x=p.x+8; c.y=p.y; c.preso=9; });   // preso, para não voar para longe
  await J.ate(()=>!(p.voo>0));
  assert.ok(await J.ev(()=>inimigos[0].hp<3), 'o mergulho feriu');
  assert.deepEqual(J.erros, []);
});

test('Raio do Sertão arranca atravessando inimigos sem levar dano', async()=>{
  await virar('raio');
  await J.comecarFase(1);
  await J.ev(()=>{ p.x=30*T; p.y=11*T+8; p.inv=0; p.dir={x:1,y:0}; for(const c of inimigos) c.dead=true; const c=inimigos[0]; c.dead=false; c.hp=2; c.x=p.x+24; c.y=p.y; c.wx=c.wy=0; });
  const antes = await J.ev(()=>({ x:p.x, hp:S0.hp }));
  await poder();
  await J.ate(()=>!(p.dash>0));
  const depois = await J.ev(()=>({ x:p.x, hp:S0.hp, cabra:inimigos[0].hp }));
  assert.ok(depois.x-antes.x > 50, `andou ${depois.x-antes.x}px na arrancada`);
  assert.equal(depois.hp, antes.hp, 'sem dano na arrancada');
  assert.ok(depois.cabra<2, 'a cabra atravessada se feriu');
  assert.deepEqual(J.erros, []);
});

test('concluir a fase avisa quando um herói novo é liberado', async()=>{
  await virar('ze');
  await J.comecarFase(1);
  await J.ev(()=>{ perfil.conquistas=Object.assign({},perfil.conquistas,{lambada:1}); });   // Mandacaru já liberada antes
  await J.ev(()=>{ delete perfil.conquistas.ligeiro; time=60; concluirFase(); });          // menos de 2 minutos: libera o Raio
  assert.match(await J.page.textContent('#fimTexto'), /Novo herói liberado: Raio do Sertão!/);
  assert.doesNotMatch(await J.page.textContent('#fimTexto'), /Mandacaru/);
  assert.deepEqual(J.erros, []);
});
