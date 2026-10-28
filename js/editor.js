'use strict';
/* ---------- EDITOR DE MAPAS (editor.html) ----------
  Usa o mesmo desenho de terreno do jogo (js/terreno.js) e os mapas de js/fases.js como ponto de partida.
  Ferramentas: pincel, balde, marcador e apagar. O resultado sai como texto pronto para colar numa fase. */
const K_EDITOR='estrela-do-sertao:editor';
const $=id=>document.getElementById(id);
function el(tag,cls,txt){ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; }

const TILES=[
  ['.','areia'],[',','areia com capim'],['C','cacto'],['R','pedra'],['T','árvore'],['M','chão da mata'],['B','moita'],
  ['H','casa'],['D','porta'],['E','espinheiro (abre na fase)'],['W','água funda'],['w','água rasa'],['l','lama'],['j','junco'],
  ['P','carnaúba'],['=','ponte'],['Q','ponte quebrada (conserta na fase)'],['g','grama da vereda'],['r','rocha'],['k','cascalho'],
  ['b','brasa (queima)'],['F','fenda de fogo'],['#','paredão'],['x','chão da arena'],['d','duna'],['v','restinga'],['Y','coqueiro'],
  ['G','fogueira de pedra'],['Z','cerca'],['O','porteira (abre na fase)'],
];
// marcadores: o que vira npcs, itens e inimigos da fase
const MARCADORES=[
  {grupo:'inicio', tipo:'spawn', nome:'Início do jogador', cor:'#ffd23a', letra:'★'},
  ...['avo','caipora','barqueiro','fulozinha','boi','fogueira','sanfoneiro','moca'].map(tipo=>({grupo:'npcs', tipo, nome:`Personagem: ${tipo}`, cor:'#5a8ac0', letra:tipo[0].toUpperCase()})),
  ...['fumo','tabua','rapadura','cordel'].map(tipo=>({grupo:'itens', tipo, nome:`Item: ${tipo}`, cor:'#4c8038', letra:tipo[0]})),
  ...['cabra','jacare','morcego','coruja','batatao'].map(tipo=>({grupo:'inimigos', tipo, nome:`Inimigo: ${tipo}`, cor:'#c4462c', letra:tipo[0]})),
];
// passagens que a própria fase abre contam como abertas na verificação de caminho
const ABRE_NA_FASE={E:',', Q:'=', O:'.'};

let ed=null;                       // {mapa:[[c]], spawn:[x,y], npcs, itens, inimigos, zonas, origem}
let ferramenta='pincel', tileSel='.', marcadorSel=MARCADORES[1], historico=[], hover=null, grade=true;
const cvEd=$('mapaEd'), gEd=cvEd.getContext('2d'), fundoCv=document.createElement('canvas'), fundoG=fundoCv.getContext('2d');

/* ---------- carregar e guardar ---------- */
function deFase(f){
  return { origem:f.id, mapa:f.mapa.map(r=>r.split('')), spawn:[...f.spawn],
    npcs:f.npcs.map(n=>n.slice()), itens:f.itens.map(i=>i.slice()), inimigos:f.inimigos.map(i=>i.slice()), zonas:JSON.parse(JSON.stringify(f.zonas||{})) };
}
function mapaVazio(w,h){
  const mapa=[]; for(let y=0;y<h;y++){ const r=[]; for(let x=0;x<w;x++) r.push(x===0||y===0||x===w-1||y===h-1?'R':'.'); mapa.push(r); }
  return { origem:null, mapa, spawn:[Math.floor(w/2),Math.floor(h/2)], npcs:[], itens:[], inimigos:[], zonas:{mapa:[1,1,w-2,h-2]} };
}
function guardar(){ try{ localStorage.setItem(K_EDITOR,JSON.stringify(ed)); }catch(e){} }
function lerRascunho(){ try{ const d=JSON.parse(localStorage.getItem(K_EDITOR)); return d && Array.isArray(d.mapa) && d.mapa.length ? d : null; }catch(e){ return null; } }
function abrirMapa(dados){
  ed=dados; historico=[]; MH=ed.mapa.length; MW=ed.mapa[0].length; map=ed.mapa;
  $('largura').value=MW; $('altura').value=MH;
  cvEd.width=fundoCv.width=MW*T; cvEd.height=fundoCv.height=MH*T;
  for(let y=0;y<MH;y++) for(let x=0;x<MW;x++) drawTile(fundoG,tileAt,map[y][x],x,y);
  atualizar();
}

/* ---------- desenho ---------- */
function redesenharTiles(lista){
  const feitos=new Set();
  for(const [x,y] of lista) for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
    const tx=x+dx, ty=y+dy, k=tx+','+ty;
    if(tx<0||ty<0||tx>=MW||ty>=MH||feitos.has(k)) continue;
    feitos.add(k); drawTile(fundoG,tileAt,map[ty][tx],tx,ty);
  }
}
function marcadoresNoMapa(){
  const out=[{grupo:'inicio', tipo:'spawn', x:ed.spawn[0], y:ed.spawn[1]}];
  for(const g of ['npcs','itens','inimigos']) ed[g].forEach((m,i)=>out.push({grupo:g, i, tipo:m[0], x:m[1], y:m[2]}));
  return out;
}
function desenhar(problemas=new Set()){
  gEd.imageSmoothingEnabled=false; gEd.drawImage(fundoCv,0,0);
  if(grade){ gEd.fillStyle='rgba(0,0,0,.18)'; for(let x=0;x<=MW;x++) gEd.fillRect(x*T,0,1,MH*T); for(let y=0;y<=MH;y++) gEd.fillRect(0,y*T,MW*T,1); }
  gEd.font='bold 11px system-ui, sans-serif'; gEd.textAlign='center'; gEd.textBaseline='middle';
  for(const m of marcadoresNoMapa()){
    const def=MARCADORES.find(d=>d.grupo===m.grupo && d.tipo===m.tipo)||{cor:'#999', letra:'?'}, cx=m.x*T+8, cy=m.y*T+8;
    gEd.fillStyle='rgba(0,0,0,.55)'; gEd.beginPath(); gEd.arc(cx+1,cy+1,7,0,7); gEd.fill();
    gEd.fillStyle=def.cor; gEd.beginPath(); gEd.arc(cx,cy,7,0,7); gEd.fill();
    if(problemas.has(m.x+','+m.y)){ gEd.strokeStyle='#ff3a2a'; gEd.lineWidth=2; gEd.beginPath(); gEd.arc(cx,cy,10,0,7); gEd.stroke(); }
    gEd.fillStyle='#fff'; gEd.fillText(def.letra,cx,cy+1);
  }
  if(hover){ gEd.strokeStyle='#ffd23a'; gEd.lineWidth=2; gEd.strokeRect(hover[0]*T+1,hover[1]*T+1,T-2,T-2); }
}

/* ---------- verificação e código ---------- */
function verificar(){
  const livre=(x,y)=>{ if(x<0||y<0||x>=MW||y>=MH) return false; const c=map[y][x]; return !SOLID.has(ABRE_NA_FASE[c]||c); };
  const visto=new Set(), fila=[ed.spawn.slice()], probs=[], ruins=new Set();
  if(livre(...ed.spawn)){ visto.add(ed.spawn+''); while(fila.length){ const [x,y]=fila.shift(); for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+a, ny=y+b, k=nx+','+ny; if(!visto.has(k) && livre(nx,ny)){ visto.add(k); fila.push([nx,ny]); } } } }
  else probs.push('O início do jogador está em chão sólido.');
  const alcanca=(x,y)=>visto.has(x+','+y) || [[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>visto.has((x+a)+','+(y+b)));
  for(const m of marcadoresNoMapa()){
    if(m.grupo==='inicio') continue;
    const solidoOk=m.tipo==='fogueira';               // fogueira é sólida: basta ter chão do lado
    if(!(solidoOk ? alcanca(m.x,m.y) : visto.has(m.x+','+m.y))){ probs.push(`${m.tipo} em (${m.x}, ${m.y}) não tem caminho a pé desde o início.`); ruins.add(m.x+','+m.y); }
    if(m.grupo==='inimigos'){
      const z=ed.zonas[ed.inimigos[m.i][3]];
      if(!z || m.x<z[0]||m.x>z[2]||m.y<z[1]||m.y>z[3]){ probs.push(`${m.tipo} em (${m.x}, ${m.y}) está fora da zona "${ed.inimigos[m.i][3]}".`); ruins.add(m.x+','+m.y); }
    }
  }
  const box=$('verificacao'); box.textContent='';
  if(probs.length){ const ul=el('ul','problemas'); for(const p of probs) ul.append(el('li','',p)); box.append(ul); }
  else box.append(el('p','ok','Tudo alcançável a partir do início.'));
  return ruins;
}
function codigo(){
  const js=v=>JSON.stringify(v).replace(/"/g,"'");
  const lista=a=>'['+a.map(js).join(',')+']';
  return `  // ${ed.origem?`a partir da fase ${ed.origem}`:'mapa novo'}: ${MW}×${MH}\n`
    +`  mapa:[\n${map.map(r=>`    ${js(r.join(''))},`).join('\n')}\n  ],\n`
    +`  spawn:${js(ed.spawn)},\n  npcs:${lista(ed.npcs)},\n  zonas:${js(ed.zonas).replace(/'(\w+)':/g,'$1:')},\n`
    +`  inimigos:${lista(ed.inimigos)},\n  itens:${lista(ed.itens)},\n`;
}
function atualizar(){ desenhar(verificar()); $('saida').value=codigo(); guardar(); }

/* ---------- edição ---------- */
function lembrar(){ historico.push(JSON.stringify(ed)); if(historico.length>60) historico.shift(); }
function desfazer(){ const d=historico.pop(); if(!d) return; const h=historico; abrirMapa(JSON.parse(d)); historico=h; }
function pintar(x,y){ if(map[y][x]===tileSel) return; map[y][x]=tileSel; redesenharTiles([[x,y]]); }
function balde(x,y){
  const de=map[y][x]; if(de===tileSel) return;
  const fila=[[x,y]], mudou=[]; map[y][x]=tileSel;
  while(fila.length){ const [cx,cy]=fila.pop(); mudou.push([cx,cy]);
    for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=cx+a, ny=cy+b; if(nx>=0&&ny>=0&&nx<MW&&ny<MH&&map[ny][nx]===de){ map[ny][nx]=tileSel; fila.push([nx,ny]); } } }
  redesenharTiles(mudou);
}
function tirarMarcador(x,y){
  for(const g of ['npcs','itens','inimigos']){ const i=ed[g].findIndex(m=>m[1]===x && m[2]===y); if(i>=0){ ed[g].splice(i,1); return true; } }
  return false;
}
function porMarcador(x,y){
  const m=marcadorSel;
  if(m.grupo==='inicio'){ ed.spawn=[x,y]; return; }
  tirarMarcador(x,y);
  if(m.grupo==='inimigos'){
    const zona=Object.entries(ed.zonas).find(([,z])=>x>=z[0]&&x<=z[2]&&y>=z[1]&&y<=z[3]);
    ed.inimigos.push([m.tipo,x,y,zona?zona[0]:Object.keys(ed.zonas)[0]||'mapa']);
  } else if(m.tipo==='cordel'){
    const usados=new Set(ed.itens.filter(i=>i[0]==='cordel').map(i=>i[3]));
    let n=1; while(usados.has('c'+n)) n++;
    ed.itens.push(['cordel',x,y,'c'+n]);
  } else ed[m.grupo].push([m.tipo,x,y]);
}
function tileDoEvento(e){
  const r=cvEd.getBoundingClientRect(), x=Math.floor((e.clientX-r.left)/r.width*MW), y=Math.floor((e.clientY-r.top)/r.height*MH);
  return x>=0&&y>=0&&x<MW&&y<MH ? [x,y] : null;
}
let arrastando=false;
function aplicar(e,inicio){
  const t=tileDoEvento(e); if(!t) return;
  const [x,y]=t, apagar=e.button===2 || ferramenta==='apagar';
  if(inicio) lembrar();
  if(apagar){ if(inicio) tirarMarcador(x,y); }
  else if(ferramenta==='pincel') pintar(x,y);
  else if(ferramenta==='balde'){ if(inicio) balde(x,y); }
  else if(ferramenta==='marcador'){ if(inicio) porMarcador(x,y); }
  atualizar();
}
cvEd.addEventListener('pointerdown',e=>{ e.preventDefault(); arrastando=true; cvEd.setPointerCapture(e.pointerId); aplicar(e,true); });
cvEd.addEventListener('pointermove',e=>{
  const t=tileDoEvento(e); hover=t;
  if(t){ const [x,y]=t, nome=(TILES.find(d=>d[0]===map[y][x])||[,'?'])[1]; $('info').innerHTML=''; $('info').append(Object.assign(el('span'),{innerHTML:`Tile <b>(${x}, ${y})</b>`}), el('span','',`${map[y][x]} · ${nome}`)); }
  if(arrastando && ferramenta==='pincel' && e.button!==2) aplicar(e,false); else desenhar(verificar());
});
cvEd.addEventListener('pointerup',()=>{ arrastando=false; });
cvEd.addEventListener('pointerleave',()=>{ hover=null; desenhar(verificar()); });
cvEd.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{ if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='z'){ e.preventDefault(); desfazer(); } });

/* ---------- painel ---------- */
function montarPainel(){
  const sel=$('selFase');
  for(const f of FASES) sel.append(Object.assign(el('option','',`Fase ${f.id} · ${f.nome}`),{value:f.id}));
  sel.append(Object.assign(el('option','','Mapa em branco'),{value:'novo'}));
  $('btnCarregar').addEventListener('click',()=>{ const v=sel.value; abrirMapa(v==='novo'?mapaVazio(48,36):deFase(FASES[v-1])); });
  $('btnTamanho').addEventListener('click',()=>{
    const w=clamp(+$('largura').value||MW,20,64), h=clamp(+$('altura').value||MH,14,64);
    lembrar(); const novo=[]; for(let y=0;y<h;y++){ const r=[]; for(let x=0;x<w;x++) r.push((map[y]&&map[y][x])||'.'); novo.push(r); }
    const d=Object.assign({},ed,{mapa:novo}); for(const g of ['npcs','itens','inimigos']) d[g]=d[g].filter(m=>m[1]<w&&m[2]<h);
    const h0=historico; abrirMapa(d); historico=h0;
  });
  const fer=$('ferramentas');
  for(const [id,nome] of [['pincel','Pincel'],['balde','Balde'],['marcador','Marcador'],['apagar','Apagar']]){
    const b=el('button','aba',nome); b.type='button'; b.dataset.f=id; b.setAttribute('aria-pressed',String(id===ferramenta));
    b.addEventListener('click',()=>{ ferramenta=id; for(const o of fer.children) o.setAttribute('aria-pressed',String(o===b)); });
    fer.append(b);
  }
  const pal=$('paleta');
  for(const [c,nome] of TILES){
    const b=el('button'); b.type='button'; b.dataset.tile=c; b.title=`${c} · ${nome}`; b.setAttribute('aria-label',nome); b.setAttribute('aria-pressed',String(c===tileSel));
    const amostra=el('canvas'); amostra.width=amostra.height=T; drawTile(amostra.getContext('2d'),()=>c,c,0,0);
    b.append(amostra);
    b.addEventListener('click',()=>{ tileSel=c; if(ferramenta!=='balde') ferramenta='pincel'; for(const o of pal.children) o.setAttribute('aria-pressed',String(o===b)); for(const o of fer.children) o.setAttribute('aria-pressed',String(o.dataset.f===ferramenta)); $('nomeTile').textContent=`${c} · ${nome}`; });
    pal.append(b);
  }
  $('nomeTile').textContent='. · areia';
  const sm=$('selMarcador');
  MARCADORES.forEach((m,i)=>sm.append(Object.assign(el('option','',m.nome),{value:i})));
  sm.value='1';
  sm.addEventListener('change',()=>{ marcadorSel=MARCADORES[sm.value]; ferramenta='marcador'; for(const o of fer.children) o.setAttribute('aria-pressed',String(o.dataset.f==='marcador')); });
  $('btnDesfazer').addEventListener('click',desfazer);
  $('chkGrade').addEventListener('change',()=>{ grade=$('chkGrade').checked; desenhar(verificar()); });
  $('btnCopiar').addEventListener('click',async()=>{
    const txt=$('saida'); txt.select();
    try{ await navigator.clipboard.writeText(txt.value); }catch(e){ document.execCommand && document.execCommand('copy'); }
    $('copiado').textContent='Copiado. Cole dentro de uma fase em js/fases.js.';
  });
}

idioma='pt';                                        // o editor é uma ferramenta em português
montarPainel();
abrirMapa(lerRascunho() || deFase(FASES[0]));
