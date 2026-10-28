// Editor de mapas (editor.html): pinta, enche, põe marcadores, confere caminhos e exporta código que vira a mesma fase.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { preparar } = require('./ajuda');

let A, P, erros=[];
before(async()=>{
  A=await preparar();
  const ctx=await A.browser.newContext({ viewport:{ width:1300, height:950 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r=>r.abort());
  P=await ctx.newPage();
  P.on('pageerror',e=>erros.push(e.message));
  P.on('console',m=>{ if(m.type()==='error' && !/fonts|ERR_FAILED/.test(m.text())) erros.push(m.text()); });
  await P.goto(A.url+'editor.html');
  await P.waitForFunction(()=>typeof ed!=='undefined' && ed);
});
after(async()=>{ await A.fim(); });

// clica no meio de um tile do mapa
async function clicaTile(x,y,opcoes={}){
  await P.evaluate(()=>scrollTo(0,0));
  const b=await P.locator('#mapaEd').boundingBox(), [w,h]=await P.evaluate(()=>[MW,MH]);
  await P.mouse.click(b.x+(x+.5)/w*b.width, b.y+(y+.5)/h*b.height, opcoes);
}
const exportado=()=>P.evaluate(()=>new Function(`return {${$('saida').value}}`)());

test('abre a fase 1 e o código exportado reproduz o mapa', async()=>{
  assert.equal(await P.textContent('#verificacao'), 'Tudo alcançável a partir do início.');
  const f=await exportado();
  assert.deepEqual(f.mapa, await P.evaluate(()=>FASES[0].mapa));
  assert.deepEqual(f.npcs, await P.evaluate(()=>FASES[0].npcs));
  assert.deepEqual(f.spawn, [23,20]);
  assert.deepEqual(erros, []);
});

test('pincel, balde e desfazer', async()=>{
  await P.click('#paleta [data-tile="W"]');
  await clicaTile(30,10);
  assert.equal((await exportado()).mapa[10][30], 'W');
  await P.click('#paleta [data-tile="b"]'); await P.click('#ferramentas [data-f="balde"]');
  await clicaTile(22,10);                                    // enche a lagoa da fase 1 de brasa
  const m=(await exportado()).mapa;
  assert.equal(m[10][22], 'b'); assert.equal(m[8][22], 'b'); assert.equal(m[10][30], 'W', 'só a mancha que foi clicada');
  await P.keyboard.press('Control+z');
  assert.equal((await exportado()).mapa[10][22], 'W');
  await P.click('#btnDesfazer');
  assert.equal((await exportado()).mapa[10][30], '.');
  assert.deepEqual(erros, []);
});

test('marcadores e a verificação de caminho', async()=>{
  await P.click('#ferramentas [data-f="marcador"]');
  await P.selectOption('#selMarcador', { label:'Personagem: avo' });
  await clicaTile(30,1);                                     // dentro do paredão: sem caminho
  assert.match(await P.textContent('#verificacao'), /avo em \(30, 1\) não tem caminho/);
  await clicaTile(30,1,{ button:'right' });                  // botão direito tira
  assert.equal(await P.textContent('#verificacao'), 'Tudo alcançável a partir do início.');
  await P.selectOption('#selMarcador', { label:'Item: cordel' });
  await clicaTile(30,12);
  const f=await exportado();
  assert.deepEqual(f.itens.at(-1), ['cordel',30,12,'c4'], 'o cordel ganha o próximo id livre');
  await P.selectOption('#selMarcador', { label:'Inimigo: cabra' });
  await clicaTile(30,14);
  assert.deepEqual((await exportado()).inimigos.at(-1), ['cabra',30,14,'caatinga'], 'o inimigo entra na zona onde caiu');
  assert.deepEqual(erros, []);
});

test('mapa em branco e troca de tamanho', async()=>{
  await P.selectOption('#selFase','novo'); await P.click('#btnCarregar');
  await P.fill('#largura','30'); await P.fill('#altura','20'); await P.click('#btnTamanho');
  const f=await exportado();
  assert.equal(f.mapa.length, 20); assert.ok(f.mapa.every(r=>r.length===30));
  // o rascunho sobrevive a recarregar a página
  await P.reload(); await P.waitForFunction(()=>typeof ed!=='undefined' && ed);
  assert.equal((await exportado()).mapa[0].length, 30);
  assert.deepEqual(erros, []);
});
