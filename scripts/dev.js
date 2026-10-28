// Servidor de desenvolvimento: `npm run dev`.
// Serve o jogo em http://localhost:5173 e recarrega a página sozinho quando um arquivo muda.
// Se DATABASE_URL estiver definida, sobe também a API das contas online (pasta servidor/) e liga o jogo nela.
//   PORT=8080 npm run dev                          outra porta
//   DATABASE_URL=postgres://... npm run dev        jogo + API + PostgreSQL
//   npm run dev -- --host                          aceita conexões da rede (para testar no celular)
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const RAIZ = path.join(__dirname, '..');
const PORTA = process.env.PORT !== undefined ? Number(process.env.PORT) : 5173;
const NA_REDE = process.argv.includes('--host');
const PORTA_API = Number(process.env.PORTA_API) || 8787;
const TIPOS = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.webmanifest':'application/manifest+json', '.png':'image/png', '.gif':'image/gif',
  '.svg':'image/svg+xml', '.ico':'image/x-icon', '.md':'text/plain; charset=utf-8' };
const IGNORAR = /(^|[\\/])(node_modules|\.git|test-results)([\\/]|$)/;

// recarregar: a página escuta /__recarregar e se recarrega quando chega um aviso
const ouvintes = new Set();
const SCRIPT_RECARGA = `<script>(()=>{ const ev=new EventSource('/__recarregar'); ev.onmessage=()=>location.reload(); })();</script>`;
let avisoRelogio = null;
function avisarMudanca(arquivo){
  clearTimeout(avisoRelogio);
  avisoRelogio = setTimeout(()=>{ console.log(`  mudou: ${arquivo}`); for(const r of ouvintes) r.write('data: recarregar\n\n'); }, 80);
}
try{
  fs.watch(RAIZ, { recursive:true }, (_, arquivo)=>{ if(arquivo && !IGNORAR.test(arquivo)) avisarMudanca(arquivo); });
}catch(e){ console.warn('Aviso: este sistema não avisa mudanças de arquivo; recarregue a página à mão.'); }

// API das contas online, se houver banco
let api = null;
if(process.env.DATABASE_URL){
  if(!fs.existsSync(path.join(RAIZ,'servidor','node_modules','pg'))){
    console.warn('Para subir a API, instale as dependências dela antes:  npm install --prefix servidor');
  } else {
    api = spawn(process.execPath, ['servidor.js'], { cwd:path.join(RAIZ,'servidor'), stdio:'inherit',
      env:{ ...process.env, PORT:String(PORTA_API), ORIGENS:process.env.ORIGENS || '*' } });
    api.on('exit', c=>{ if(c) console.warn(`A API parou (código ${c}).`); api=null; });
  }
}
const configDev = () => `window.ESTRELA_CONFIG = window.ESTRELA_CONFIG || { api:${api?`location.protocol+'//'+location.hostname+':${PORTA_API}'`:"''"} };\n`;

const srv = http.createServer((req, res)=>{
  const url = new URL(req.url, 'http://x');
  if(url.pathname==='/__recarregar'){
    res.writeHead(200, { 'Content-Type':'text/event-stream', 'Cache-Control':'no-store', Connection:'keep-alive' });
    res.write(': ok\n\n'); ouvintes.add(res); req.on('close', ()=>ouvintes.delete(res));
    return;
  }
  // com a API ligada, o jogo aponta para ela sem precisar mexer em js/config.js
  if(url.pathname==='/js/config.js' && api){ res.writeHead(200, { 'Content-Type':TIPOS['.js'], 'Cache-Control':'no-store' }); return res.end(configDev()); }
  let arquivo = decodeURIComponent(url.pathname);
  if(arquivo.endsWith('/')) arquivo += 'index.html';
  const alvo = path.join(RAIZ, arquivo);
  if(!alvo.startsWith(RAIZ) || IGNORAR.test(path.relative(RAIZ, alvo))){ res.writeHead(403); return res.end(); }
  fs.readFile(alvo, (erro, dados)=>{
    if(erro){ res.writeHead(404, { 'Content-Type':'text/plain; charset=utf-8' }); return res.end('não encontrado'); }
    const tipo = TIPOS[path.extname(alvo)] || 'application/octet-stream';
    if(tipo.startsWith('text/html')) dados = Buffer.from(dados.toString().replace('</body>', SCRIPT_RECARGA+'\n</body>'));
    res.writeHead(200, { 'Content-Type':tipo, 'Cache-Control':'no-store' });
    res.end(dados);
  });
});

srv.listen(PORTA, NA_REDE ? '0.0.0.0' : '127.0.0.1', ()=>{
  const porta = srv.address().port;
  console.log(`\n  Estrela do Sertão rodando em http://localhost:${porta}/`);
  console.log(`  Editor de mapas:            http://localhost:${porta}/editor.html`);
  if(NA_REDE) for(const lista of Object.values(os.networkInterfaces())) for(const n of lista||[])
    if(n.family==='IPv4' && !n.internal) console.log(`  Na rede (celular):          http://${n.address}:${porta}/`);
  if(api) console.log(`  API das contas online:      http://localhost:${PORTA_API}/api/saude`);
  else console.log('  Contas online desligadas (defina DATABASE_URL para ligar).');
  console.log('  A página recarrega sozinha quando um arquivo muda. Ctrl+C para parar.\n');
});
for(const sinal of ['SIGINT','SIGTERM']) process.on(sinal, ()=>{ if(api) api.kill(); srv.close(); process.exit(0); });
