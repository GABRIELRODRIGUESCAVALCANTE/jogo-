// App instalável: manifesto, ícones, service worker e jogo funcionando sem internet.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { preparar, abrir } = require('./ajuda');

let A;
before(async()=>{ A=await preparar(); });
after(async()=>{ await A.fim(); });

test('manifesto válido e ícones existem', ()=>{
  const m=JSON.parse(fs.readFileSync(path.join(__dirname,'..','manifest.webmanifest'),'utf8'));
  assert.equal(m.display,'standalone');
  assert.ok(m.icons.some(i=>i.sizes==='512x512' && i.purpose==='maskable'));
  for(const i of m.icons) assert.ok(fs.existsSync(path.join(__dirname,'..',i.src)), i.src);
});

test('o service worker guarda todos os arquivos que a página usa', ()=>{
  const raiz=path.join(__dirname,'..'), html=fs.readFileSync(path.join(raiz,'index.html'),'utf8'), sw=fs.readFileSync(path.join(raiz,'sw.js'),'utf8');
  const usados=[...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map(m=>m[1]);
  assert.ok(usados.length>10);
  for(const u of usados){ assert.ok(sw.includes(`'${u}'`), `sw.js não guarda ${u}`); assert.ok(fs.existsSync(path.join(raiz,u)), `${u} não existe`); }
});

test('depois da primeira visita, o jogo abre sem internet', async()=>{
  const J=await abrir(A.browser,A.url);
  await J.page.waitForFunction(()=>navigator.serviceWorker && navigator.serviceWorker.ready.then(()=>true));
  await J.page.reload(); await J.page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await J.ctx.setOffline(true);
  await J.page.reload(); await J.page.waitForFunction(()=>typeof telaAtual!=='undefined');
  await J.criarJogador('Sem Rede'); await J.comecarFase(1);
  assert.equal(await J.ev(()=>fase.id), 1);
  assert.deepEqual(J.erros.filter(e=>!/ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(e)), []);
  await J.ctx.setOffline(false); await J.fechar();
});
