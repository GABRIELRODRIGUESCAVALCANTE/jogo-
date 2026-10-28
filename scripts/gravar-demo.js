// Grava o GIF do README (docs/demo.gif): joga um trecho de cada fase num Chromium sem janela e monta o GIF com o ffmpeg.
// Uso: node scripts/gravar-demo.js     (precisa do Playwright, do Chromium e do ffmpeg instalados)
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const RAIZ = path.join(__dirname, '..');
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const TIPOS = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.webmanifest':'application/manifest+json' };

(async()=>{
  const srv = http.createServer((q,r)=>{
    let a = decodeURIComponent(new URL(q.url,'http://x').pathname); if(a.endsWith('/')) a += 'index.html';
    const alvo = path.join(RAIZ, a); if(!alvo.startsWith(RAIZ)){ r.writeHead(403); return r.end(); }
    fs.readFile(alvo, (e,d)=>{ if(e){ r.writeHead(404); return r.end(); } r.writeHead(200,{'Content-Type':TIPOS[path.extname(a)]||'application/octet-stream'}); r.end(d); });
  });
  await new Promise(r=>srv.listen(0,'127.0.0.1',r));
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(),'estrela-demo-'));
  const navegador = await chromium.launch();
  const ctx = await navegador.newContext({ viewport:{width:760,height:600}, locale:'pt-BR', recordVideo:{ dir:pasta, size:{width:760,height:600} } });
  const P = await ctx.newPage(), t0 = Date.now(), ev = (f,a)=>P.evaluate(f,a), agora = ()=>(Date.now()-t0)/1000;
  await P.addInitScript(()=>localStorage.setItem('estrela-do-sertao:prefs', JSON.stringify({ cenas:false })));
  await P.goto(`http://127.0.0.1:${srv.address().port}/`);
  await P.waitForFunction(()=>typeof telaAtual!=='undefined');
  await P.fill('#nomeNovo','Luzia'); await P.click('#escolhaNovo [data-id="luzia"]'); await P.click('#formNovo button[type=submit]');
  await ev(()=>{ perfil.fases={1:{feita:true},2:{feita:true},3:{feita:true}}; salvarPerfis(); });

  const trechos = [], cortes = [];   // trechos jogados; cortes: falas no meio de um trecho, que ficam de fora
  const pular = async()=>{ for(let i=0;i<80;i++){ if(!(await ev(()=>dlg.open))) return; await P.keyboard.press('KeyE'); await sleep(20); } };
  const segura = async(teclas,ms)=>{ for(const k of teclas) await P.keyboard.down(k); await sleep(ms); for(const k of teclas) await P.keyboard.up(k); };
  // começa a fase sem dano (é só para filmar), arruma a cena e grava o trecho que a função "joga"
  async function fase(id, arrumar, joga){
    await ev(id=>jogarFase(id), id); await P.waitForSelector('#ovTitulo:not([hidden])');
    await P.click('#btnComecarFase'); await sleep(50); await pular();
    await ev(arrumar); await ev(()=>{ hurt=()=>{}; }); await sleep(120);
    const inicio = agora(); await joga(); trechos.push([inicio, agora()]);
  }
  await fase(1, ()=>{ p.x=12*T; p.y=14*T; }, async()=>{
    await segura(['ArrowLeft'],600); await P.keyboard.press('Space'); await segura(['ArrowUp'],700); await P.keyboard.press('Space'); await segura(['ArrowRight','ArrowUp'],800); });
  await fase(2, ()=>{ p.x=20*T; p.y=22*T; }, async()=>{ await segura(['ArrowLeft'],1000); await segura(['ArrowUp'],900); });
  await fase(3, ()=>{ p.x=24*T+8; p.y=12*T; }, async()=>{
    await segura(['ArrowUp'],450); await P.waitForFunction(()=>dlg.open,null,{timeout:3000}).catch(()=>{});
    const fala = agora(); await pular(); await ev(()=>{ hurt=()=>{}; }); cortes.push([fala, agora()+0.3]);
    for(const k of ['ArrowLeft','ArrowRight','ArrowLeft','ArrowRight']){ await segura([k],450); await P.keyboard.press('Space'); await sleep(250); } });
  await fase(4, ()=>{ for(const n of npcs) if(n.type==='fogueira') n.acesa=true; p.x=24*T; p.y=21*T;
      const boi=npcs.find(n=>n.segue); boi.x=p.x; boi.y=p.y-14; chefe.active=false; chefe.x=p.x+80; chefe.y=p.y+40; },
    async()=>{ await segura(['ArrowRight'],800); await segura(['ArrowDown'],800); await sleep(700); });
  const caixa = await P.locator('#frame').boundingBox();
  await ctx.close(); await navegador.close(); srv.close();

  const partes = [];
  for(let [a,b] of trechos){
    for(const [c0,c1] of cortes) if(c0>a && c1<b){ partes.push([a,c0]); a=c1; }
    partes.push([a,b]);
  }
  const video = fs.readdirSync(pasta).find(f=>f.endsWith('.webm'));
  const sel = partes.map(([a,b])=>`between(t,${a.toFixed(2)},${b.toFixed(2)})`).join('+');
  const crop = [caixa.width,caixa.height,caixa.x,caixa.y].map(Math.round).join(':');
  execFileSync('ffmpeg', ['-v','error','-y','-i',path.join(pasta,video),'-vf',
    `select='${sel}',setpts=N/FRAME_RATE/TB,crop=${crop},fps=12,scale=520:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=80:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle`,
    path.join(RAIZ,'docs','demo.gif')], { stdio:'inherit' });
  fs.rmSync(pasta, { recursive:true, force:true });
  console.log('docs/demo.gif pronto');
})().catch(e=>{ console.error(e); process.exit(1); });
