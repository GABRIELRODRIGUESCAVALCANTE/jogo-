// Utilitários dos testes: servidor estático, navegador e atalhos para controlar o jogo.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, devices } = require('playwright');

const RAIZ = path.join(__dirname, '..');
const TIPOS = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.json':'application/json', '.webmanifest':'application/manifest+json', '.png':'image/png', '.svg':'image/svg+xml', '.md':'text/plain; charset=utf-8' };

function servidor(){
  return new Promise(resolve=>{
    const srv = http.createServer((req,res)=>{
      let arq = decodeURIComponent(new URL(req.url,'http://x').pathname);
      if(arq.endsWith('/')) arq += 'index.html';
      const alvo = path.join(RAIZ, arq);
      if(!alvo.startsWith(RAIZ)) { res.writeHead(403); return res.end(); }
      fs.readFile(alvo,(err,dados)=>{
        if(err){ res.writeHead(404); return res.end('não encontrado'); }
        res.writeHead(200,{'Content-Type':TIPOS[path.extname(alvo)]||'application/octet-stream'}); res.end(dados);
      });
    });
    srv.listen(0,'127.0.0.1',()=>resolve({ url:`http://127.0.0.1:${srv.address().port}/`, fechar:()=>srv.close() }));
  });
}

const sleep = ms => new Promise(r=>setTimeout(r,ms));

// abre o jogo num contexto novo (armazenamento limpo); celular=true emula um iPhone com toque
async function abrir(ctxBrowser, url, { celular=false, antes, locale='pt-BR', cenas=false } = {}){
  const ctx = await ctxBrowser.newContext({ ...(celular ? devices['iPhone 13'] : { viewport:{ width:1100, height:900 } }), locale });
  const page = await ctx.newPage();
  const erros = [];
  page.on('pageerror', e=>erros.push(e.message));
  const deFonte=m=>/fonts\.(googleapis|gstatic)/.test(`${(m.location()||{}).url||''} ${m.text()}`);
  page.on('console', m=>{ if(m.type()==='error' && !deFonte(m)) erros.push(m.text()); });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r=>r.abort());   // testes não dependem da internet
  if(!cenas) await page.addInitScript(()=>{   // a maioria dos testes pula as cenas de cordel (vale também depois de recarregar)
    const k='estrela-do-sertao:prefs'; try{ const p=JSON.parse(localStorage.getItem(k)||'{}'); p.cenas=false; localStorage.setItem(k,JSON.stringify(p)); }catch(e){}
  });
  if(antes) await page.addInitScript(antes);
  await page.goto(url);
  await page.waitForFunction(()=>typeof telaAtual!=='undefined');
  const J = {
    page, ctx, erros,
    ev: (f,a)=>page.evaluate(f,a),
    ate: (f,a)=>page.waitForFunction(f,a,{timeout:5000}),   // espera a condição ficar verdadeira
    async pular(){ for(let i=0;i<80;i++){ if(!(await page.evaluate(()=>dlg.open))) return; await page.keyboard.press('KeyE'); await sleep(20); } throw new Error('diálogo não fechou'); },
    tp: (x,y)=>page.evaluate(([x,y])=>{ p.x=x*16+8; p.y=y*16+8; },[x,y]),
    invencivel: ()=>page.evaluate(()=>{ p.inv=999; }),
    async falar(x,y){ await J.tp(x,y); await sleep(40); await page.keyboard.press('KeyE'); await sleep(40); await J.pular(); },
    async andar(tecla,ms){ await page.keyboard.down(tecla); await sleep(ms); await page.keyboard.up(tecla); },
    async andarAte(tecla,cond,arg){ await page.keyboard.down(tecla); try{ await page.waitForFunction(cond,arg,{timeout:8000}); } finally{ await page.keyboard.up(tecla); } },
    async criarJogador(nome, pers='ze'){
      if(!(await page.isVisible('#telaNovo'))){ await page.evaluate(()=>{ if(telaAtual!=='telaPerfis') abrirPerfis(); }); await page.click('#btnNovoPerfil'); }
      await page.fill('#nomeNovo', nome);
      await page.click(`#escolhaNovo [data-id="${pers}"]`);
      await page.click('#formNovo button[type=submit]');
      await page.waitForFunction(()=>telaAtual==='telaMenu');
    },
    async comecarFase(id){
      await page.evaluate(id=>jogarFase(id), id);
      await page.waitForFunction(()=>!document.getElementById('ovTitulo').hidden);
      await page.click('#btnComecarFase'); await sleep(60); await J.pular();
    },
    async fechar(){ await ctx.close(); },
  };
  return J;
}

async function preparar(){
  const srv = await servidor();
  const browser = await chromium.launch();
  return { url:srv.url, browser, async fim(){ await browser.close(); srv.fechar(); } };
}

module.exports = { preparar, abrir, sleep };
