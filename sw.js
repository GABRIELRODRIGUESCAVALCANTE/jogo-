// Service worker do Estrela do Sertão: o jogo funciona sem internet.
// Arquivos do próprio site: rede primeiro (sempre a versão mais nova), cache como reserva.
// Fontes do Google: cache primeiro, atualizando em segundo plano.
const CACHE = 'estrela-app';
const FONTES = 'estrela-fontes';
const ARQUIVOS = [
  './', 'index.html', 'manifest.webmanifest', 'css/jogo.css',
  'js/base.js', 'js/idiomas.js', 'js/audio.js', 'js/personagens.js', 'js/terreno.js', 'js/entidades.js', 'js/fases.js', 'js/jogo.js', 'js/conquistas.js', 'js/ranking.js', 'js/telas.js',
  'icones/icone-192.png', 'icones/icone-512.png', 'icones/icone-maskable-512.png', 'icones/icone-180.png', 'icones/favicon-32.png',
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ARQUIVOS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys()
    .then(nomes=>Promise.all(nomes.filter(n=>n!==CACHE && n!==FONTES).map(n=>caches.delete(n))))
    .then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method!=='GET') return;
  const url = new URL(req.url);
  if(url.origin===self.location.origin) e.respondWith(redePrimeiro(req));
  else if(/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) e.respondWith(cachePrimeiro(req));
});

async function redePrimeiro(req){
  const cache = await caches.open(CACHE);
  try{
    const resp = await fetch(req);
    if(resp.ok) cache.put(req, resp.clone());
    return resp;
  }catch(err){
    const salvo = await cache.match(req, { ignoreSearch:true });
    if(salvo) return salvo;
    if(req.mode==='navigate') return cache.match('index.html');
    throw err;
  }
}
async function cachePrimeiro(req){
  const cache = await caches.open(FONTES);
  const salvo = await cache.match(req);
  const rede = fetch(req).then(resp=>{ if(resp.ok || resp.type==='opaque') cache.put(req, resp.clone()); return resp; });
  if(salvo){ rede.catch(()=>{}); return salvo; }
  return rede;
}
