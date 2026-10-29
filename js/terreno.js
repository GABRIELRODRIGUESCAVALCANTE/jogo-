'use strict';
/* ---------- TERRENO ----------
  .  areia            ,  areia com capim     C  cacto*          R  pedra*         T  árvore*
  M  chão da mata     B  moita*              H  casa*           D  porta*         E  espinheiro*
  W  água funda*      w  água rasa (lenta)   l  lama (lenta)    j  junco          P  carnaúba*
  =  ponte            Q  ponte quebrada*     g  grama da vereda
  r  rocha            k  cascalho            b  brasa (queima)  F  fenda de fogo*
  #  paredão*         x  chão da arena
  d  duna (lenta)     v  restinga          Y  coqueiro*       G  fogueira*      Z  cerca*      O  porteira*
                                                                        (* não dá para atravessar) */
let map=[], MW=48, MH=36;
const SOLID=new Set(['C','R','T','W','H','D','B','#','E','P','F','Q','Y','G','Z','O']);
const AGUA=new Set(['W','w','Q','=']);
const VEL_TERRENO={w:.55,l:.6,j:.85,d:.85};

function tileAt(tx,ty){ return (tx<0||ty<0||tx>=MW||ty>=MH) ? '#' : map[ty][tx]; }
// passa: tiles que esta entidade atravessa (o Homem-Calango anda por cima das pedras)
function solidAt(px,py,passa){ const c=tileAt(Math.floor(px/T), Math.floor(py/T)); return SOLID.has(c) && !(passa && passa.has(c)); }
// tiros voam por cima da água
function tiroBate(px,py){ const c=tileAt(Math.floor(px/T), Math.floor(py/T)); return SOLID.has(c) && c!=='W' && c!=='Q'; }
function boxHits(x,y,w,h,passa){
  const x0=x-w/2, y0=y-h/2, x1=x+w/2-0.01, y1=y+h/2-0.01;
  const sx=Math.max(1,Math.ceil(w/14)), sy=Math.max(1,Math.ceil(h/14));
  for(let i=0;i<=sx;i++) for(let j=0;j<=sy;j++){
    if (solidAt(x0+(x1-x0)*i/sx, y0+(y1-y0)*j/sy, passa)) return true;
  }
  return false;
}
function moveEnt(e,dx,dy,passa){
  let hit=false;
  if(dx){ if(!boxHits(e.x+dx,e.y,e.w,e.h,passa)) e.x+=dx; else hit=true; }
  if(dy){ if(!boxHits(e.x,e.y+dy,e.w,e.h,passa)) e.y+=dy; else hit=true; }
  return hit;
}
function nearestFree(tx,ty){
  for(let r=0;r<8;r++) for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){
    const c=tileAt(tx+dx,ty+dy);
    if(!SOLID.has(c)) return {x:(tx+dx)*T+8, y:(ty+dy)*T+8};
  }
  return {x:tx*T+8,y:ty*T+8};
}
const chao=e=>tileAt(Math.floor(e.x/T), Math.floor((e.y+e.h/2-1)/T));   // piso sob os pés
const velTerreno=e=>VEL_TERRENO[chao(e)]||1;
function trocarTiles(de,para){ for(let ty=0;ty<MH;ty++) for(let tx=0;tx<MW;tx++) if(map[ty][tx]===de) map[ty][tx]=para; drawMap(); }

/* ---------- DESENHO DO MAPA ---------- */
const mapCv = document.createElement('canvas');
const mg = mapCv.getContext('2d');
function drawTile(g,at,c,tx,ty){
  const px=tx*T, py=ty*T;
  const r=(col,x,y,w,h)=>{ g.fillStyle=col; g.fillRect(px+x,py+y,w,h); };
  const pts=(a,b,n,s=0)=>{ for(let i=0;i<n;i++) r(i%2?a:b,(hh(tx,ty,i+s)*15)|0,(hh(tx,ty,i+s+9)*15)|0,1+(i===0),1); };
  const sand=()=>{ r('#d6a058',0,0,16,16); pts('#c48d48','#e6b874',6); };
  const mata=()=>{ r('#5f6b34',0,0,16,16); pts('#4e5a2a','#76833f',6); };
  const grama=()=>{ r('#7a9a46',0,0,16,16); for(let i=0;i<7;i++) r(i%2?'#68883a':'#90b252',(hh(tx,ty,i)*15)|0,(hh(tx,ty,i+9)*14)|0,1,1+(i%3===0)); };
  const rocha=()=>{ r('#7a5a4a',0,0,16,16); pts('#5e4436','#94705c',6); r('#634a3c',(hh(tx,ty,21)*10)|0,(hh(tx,ty,22)*14)|0,4,1); };
  const fundo=()=>{ r('#3a78a0',0,0,16,16);
    const borda=(nx,ny,x,y,w,h)=>{ const n=at(nx,ny); if(!AGUA.has(n)) r('#c9b07a',x,y,w,h); };
    borda(tx,ty-1,0,0,16,2); borda(tx-1,ty,0,0,2,16); borda(tx+1,ty,14,0,2,16);
    if(!AGUA.has(at(tx,ty+1))) r('#2d5f80',0,14,16,2);
    r('#5c9fc4',(hh(tx,ty,1)*8+3)|0,(hh(tx,ty,2)*9+4)|0,4,1); r('#5c9fc4',(hh(tx,ty,3)*8+3)|0,(hh(tx,ty,4)*9+4)|0,3,1); };
  switch(c){
    case '.': sand(); break;
    case ',': sand(); for(let k=0;k<2;k++){ const x=(hh(tx,ty,20+k)*11+2)|0, y=(hh(tx,ty,30+k)*8+5)|0; r('#a38a3a',x,y,1,3); r('#a38a3a',x+2,y+1,1,2); r('#c2a648',x+1,y-1,1,4);} break;
    case 'C': sand(); r('rgba(80,40,10,.25)',4,14,9,2); r('#3f6a2e',6,2,4,13); r('#5f8f3f',7,3,1,11);
      r('#3f6a2e',3,8,3,2); r('#3f6a2e',3,4,2,5); r('#5f8f3f',3,4,1,4);
      r('#3f6a2e',10,6,3,2); r('#3f6a2e',11,2,2,5); r('#5f8f3f',11,2,1,4);
      if(hh(tx,ty,3)>0.72) r('#e85a8a',7,1,2,1); break;
    case 'R': { const b=at(tx,ty+1); if(b==='r'||b==='k'||b==='b'||b==='x') rocha(); else sand(); }
      r('rgba(80,40,10,.25)',2,13,13,2); r('#7c6c5c',2,6,12,8); r('#7c6c5c',4,4,8,2); r('#9d8e7c',4,5,5,2); r('#9d8e7c',3,7,3,2); r('#5b4f45',3,12,11,2); break;
    case 'T': sand(); r('rgba(60,40,10,.3)',2,12,13,3); r('#6b4a2b',7,9,3,6); r('#2f5a28',2,2,12,8); r('#2f5a28',1,4,14,5); r('#2f5a28',4,1,8,1); r('#4c8038',4,3,4,2); r('#4c8038',9,5,3,2); r('#4c8038',3,6,2,1); break;
    case 'W': fundo(); break;
    case 'w': r('#5f9fbf',0,0,16,16); r('#8a9a78',(hh(tx,ty,6)*12)|0,(hh(tx,ty,7)*12)|0,3,2);
      for(let i=0;i<3;i++) r('#8cc4d8',(hh(tx,ty,i)*12)|0,(hh(tx,ty,i+5)*14)|0,4,1);
      if(!AGUA.has(at(tx,ty-1))) r('#cfe7f2',0,0,16,1);
      if(!AGUA.has(at(tx-1,ty))) r('#cfe7f2',0,0,1,16);
      if(!AGUA.has(at(tx+1,ty))) r('#cfe7f2',15,0,1,16); break;
    case 'Q': fundo(); r('#4a2d18',1,2,2,7); r('#4a2d18',13,7,2,7); r('#8a5a32',5,10,6,2); r('#6e4424',5,12,6,1); break;
    case '=': r('#2d5f80',0,0,16,16);
      for(let y=0;y<16;y+=4){ r('#9a6a3a',0,y,16,3); r('#5e3a1e',0,y+3,16,1); r('#b8834a',(hh(tx,ty,y)*12)|0,y,3,1); }
      if(at(tx-1,ty)!=='=' && at(tx-1,ty)!=='Q') r('#5a3a22',0,0,2,16);
      if(at(tx+1,ty)!=='=' && at(tx+1,ty)!=='Q') r('#5a3a22',14,0,2,16); break;
    case 'l': r('#6e5232',0,0,16,16); for(let i=0;i<4;i++){ const x=(hh(tx,ty,i)*12)|0, y=(hh(tx,ty,i+4)*13)|0; r('#5a4228',x,y,4,2); r('#86663f',x+1,y,2,1); } break;
    case 'j': { const lm=AGUA.has(at(tx,ty-1))||AGUA.has(at(tx,ty+1)); if(lm) r('#6e5232',0,0,16,16); else grama(); }
      for(let k=0;k<5;k++){ const x=(hh(tx,ty,k)*13+1)|0, h=5+((hh(tx,ty,k+7)*7)|0); r('#4e6a2a',x,15-h,1,h); r('#9ab85a',x+1,16-h,1,h-2); if(k%2) r('#6a3e1e',x,13-h,1,3); } break;
    case 'P': grama(); r('rgba(40,50,10,.3)',3,13,10,2); r('#7a5a3a',7,5,2,10); r('#5e4428',7,8,2,1); r('#5e4428',7,11,2,1);
      r('#3e6a2e',1,4,4,2); r('#3e6a2e',11,4,4,2); r('#4f7a3a',2,2,12,3); r('#4f7a3a',4,0,8,2); r('#6a9a48',3,2,4,1); r('#6a9a48',9,1,4,1); r('#6a9a48',6,0,3,1); break;
    case 'g': grama(); if(hh(tx,ty,5)>.86){ const x=(hh(tx,ty,6)*12+2)|0, y=(hh(tx,ty,7)*12+2)|0; r('#e9d35a',x,y,1,1); r('#e9d35a',x+3,y+2,1,1); } break;
    case 'r': rocha(); break;
    case 'k': rocha(); for(let i=0;i<5;i++) r(i%2?'#a08870':'#4e3a2e',(hh(tx,ty,i+40)*14)|0,(hh(tx,ty,i+50)*14)|0,2,1); break;
    case 'b': r('#3a1e14',0,0,16,16); r('#4a2418',(hh(tx,ty,1)*8)|0,(hh(tx,ty,2)*8)|0,8,6);
      for(let i=0;i<8;i++) r(i%3?'#7a2a14':'#c4462c',(hh(tx,ty,i+60)*15)|0,(hh(tx,ty,i+70)*15)|0,1+(i%2),1); break;
    case 'F': if([at(tx-1,ty),at(tx+1,ty),at(tx,ty-1),at(tx,ty+1)].includes('b')){ r('#3a1e14',0,0,16,16); r('#7a2a14',(hh(tx,ty,1)*14)|0,(hh(tx,ty,2)*14)|0,1,1); } else rocha();
      r('#2a1410',5,1,6,14); r('#2a1410',3,4,10,8); r('#e8401a',6,3,4,10); r('#ff8a1e',7,4,2,8); r('rgba(232,64,26,.22)',1,0,14,16); break;
    case 'H':
      if(at(tx,ty-1)!=='H'){ r('#8a3a22',0,0,16,16); for(let y=1;y<16;y+=4) r('#b0502f',0,y,16,2); for(let x=1;x<16;x+=5) r('#6e2c19',x,0,1,16); r('#5a2414',0,15,16,1); }
      else { r('#b5784a',0,0,16,16); r('#9a5f35',0,5,16,1); r('#9a5f35',0,11,16,1); r('#9a5f35',(hh(tx,ty,1)*14)|0,0,1,5); r('#9a5f35',(hh(tx,ty,2)*14)|0,6,1,5); r('#c98d5c',(hh(tx,ty,3)*12)|0,2,3,1);
        if(at(tx,ty+1)==='H' && (at(tx-1,ty)!=='H'||at(tx+1,ty)!=='H')){ r('#3a2416',4,4,8,6); r('#7a4a28',3,3,10,1); r('#7a4a28',3,10,10,1); r('#7a4a28',7,4,1,6); }
        if(at(tx,ty+1)!=='H' && at(tx,ty+1)!=='D') r('rgba(60,30,10,.35)',0,14,16,2); }
      break;
    case 'D': r('#b5784a',0,0,16,16); r('#9a5f35',0,5,16,1); r('#4a2d18',3,2,10,14); r('#6b4423',4,3,8,13); r('#4a2d18',8,3,1,13); r('#e0b060',10,9,1,1); break;
    case 'M': mata(); if(hh(tx,ty,7)>0.6){ r('#3f5a26',(hh(tx,ty,8)*12)|0,(hh(tx,ty,9)*12)|0,3,2); } break;
    case 'B': mata(); r('#21401e',2,13,12,2); r('#2c5226',1,3,14,11); r('#2c5226',3,1,10,14); r('#3f7434',2,3,8,5); r('#3f7434',8,7,5,4); r('#5b8f45',4,4,3,2); r('#5b8f45',9,8,2,1); if(hh(tx,ty,5)>0.75) r('#d8443a',10,4,1,1); break;
    case 'E': sand(); r('rgba(70,40,15,.3)',0,12,16,4);
      for(let i=0;i<15;i++){ r('#5e4a36',i,2+((i*7+tx*3)%11),2,1); r('#4a3826',i,6+((i*5+ty)%8),1,1); r('#7d6a50',i,1+((i*3+tx)%13),1,1); }
      for(let k=0;k<6;k++) r('#e8d9b8',(hh(tx,ty,k+40)*15)|0,(hh(tx,ty,k+50)*14)|0,1,1);
      break;
    case '#': r('#6e3622',0,0,16,16); r('#8a4a2e',0,(hh(tx,ty,1)*4+2)|0,16,2); r('#4f2617',0,(hh(tx,ty,2)*4+9)|0,16,1); r('#94523a',(hh(tx,ty,3)*12)|0,(hh(tx,ty,4)*12)|0,3,2);
      if(at(tx,ty+1)!=='#') { r('#3c1c10',0,13,16,3); r('#5a2a18',0,12,16,1); }
      break;
    case 'd': r('#e2c286',0,0,16,16); for(let k=0;k<3;k++){ const y=((hh(tx,ty,k)*4)|0)+k*5+1; for(let x=0;x<16;x+=2) r('#cfa868',x,y+((x+tx*16)>>2&1),2,1); } pts('#f0d8a0','#c89a5c',3,60); break;
    case 'v': { const b=at(tx,ty+1); if(b==='.'||b===',') sand(); else r('#e2c286',0,0,16,16); }
      for(let k=0;k<3;k++){ const x=(hh(tx,ty,k+80)*11)|0, y=(hh(tx,ty,k+90)*10+3)|0; r('#4e6a2a',x,y+2,6,3); r('#6f8f3a',x+1,y+1,4,2); r('#93b04e',x+2,y,2,1); } break;
    case 'Y': r('#e2c286',0,0,16,16); r('rgba(60,40,10,.3)',3,13,10,2); r('#8a6a42',8,5,2,10); r('#6e5232',8,7,2,1); r('#6e5232',8,10,2,1);
      r('#2f6a2e',1,3,7,2); r('#2f6a2e',9,3,7,2); r('#3f8a3a',3,1,10,3); r('#2f6a2e',0,5,3,2); r('#2f6a2e',13,5,3,2); r('#5aa848',5,1,3,1); r('#5aa848',10,2,3,1);
      r('#6b4a2b',7,5,2,2); r('#6b4a2b',9,5,2,2); break;
    case 'G': { const b=at(tx,ty+1); if(b==='.'||b===',') sand(); else r('#e2c286',0,0,16,16); }
      r('rgba(60,30,10,.35)',2,12,12,3); for(const [x,y] of [[2,11],[5,13],[9,13],[12,11],[3,8],[12,8]]) r('#7c6c5c',x,y,3,2); r('#3a2416',5,9,6,4); break;
    case 'Z': sand(); r('rgba(60,30,10,.3)',0,13,16,2); r('#6b4423',1,3,2,11); r('#6b4423',13,3,2,11); r('#8a5a32',0,5,16,2); r('#8a5a32',0,10,16,2); r('#5a3a1e',0,7,16,1); break;
    case 'O': sand(); r('rgba(60,30,10,.3)',0,13,16,2); r('#5a3a1e',0,3,2,11); r('#5a3a1e',14,3,2,11);
      for(let x=2;x<14;x+=3) r('#9a6a3a',x,4,2,9); r('#b8834a',2,6,12,2); r('#b8834a',2,10,12,1); r('#3a2416',7,7,2,2); break;
    case 'x': r('#4b2a1d',0,0,16,16); pts('#3a2016','#6b3a24',6); if(hh(tx,ty,33)>0.85) r('#c4462c',(hh(tx,ty,34)*14)|0,(hh(tx,ty,35)*14)|0,1,1); break;
    default: sand();
  }
}
function drawMap(){
  mapCv.width=MW*T; mapCv.height=MH*T;
  for(let ty=0;ty<MH;ty++) for(let tx=0;tx<MW;tx++){ drawTile(mg,tileAt,map[ty][tx],tx,ty); if(contraste) padraoContraste(mg,map[ty][tx],tx,ty); }
}
// alto contraste: listras nas brasas, pontinhos no chão que deixa lento, borda nas fendas de fogo
function padraoContraste(g,c,tx,ty){
  const r=(col,x,y,w,h)=>{ g.fillStyle=col; g.fillRect(tx*T+x,ty*T+y,w,h); };
  if(c==='b') for(let k=0;k<16;k++){ r('#ffe14a',k,k,1,1); r('#ffe14a',(k+8)%16,k,1,1); }
  else if(c==='w'||c==='l'||c==='j'){ const col=c==='w'?'rgba(255,255,255,.7)':'rgba(255,214,140,.75)'; for(let y=2;y<16;y+=5) for(let x=(y%2?1:3);x<16;x+=5) r(col,x,y,2,2); }
  else if(c==='F'){ r('#ffe14a',0,0,16,1); r('#ffe14a',0,15,16,1); r('#ffe14a',0,0,1,16); r('#ffe14a',15,0,1,16); }
}
// miniatura do mapa de uma fase, 4 px por tile, para a tela de fases
function miniatura(f,cnv){
  const rows=f.mapa, w=rows[0].length, h=rows.length, at=(x,y)=>(x<0||y<0||x>=w||y>=h)?'#':rows[y][x];
  const big=document.createElement('canvas'); big.width=w*T; big.height=h*T;
  const g=big.getContext('2d');
  for(let ty=0;ty<h;ty++) for(let tx=0;tx<w;tx++) drawTile(g,at,rows[ty][tx],tx,ty);
  cnv.width=w*4; cnv.height=h*4;
  const m=cnv.getContext('2d'); m.imageSmoothingEnabled=true; m.imageSmoothingQuality='high'; m.drawImage(big,0,0,cnv.width,cnv.height);
  if(f.noite){ m.fillStyle='rgba(10,14,50,.5)'; m.fillRect(0,0,cnv.width,cnv.height); }
}
// brilho da água, brasas e fendas: desenhado a cada quadro sobre o mapa já pronto
function animarTerreno(cx,cy,tempo){
  const t0=Math.floor(cx/T), t1=Math.ceil((cx+VW)/T), u0=Math.floor(cy/T), u1=Math.ceil((cy+VH)/T), tick=Math.floor(tempo*2), tq=Math.floor(tempo*7);
  for(let ty=u0;ty<u1;ty++) for(let tx=t0;tx<t1;tx++){
    const c=tileAt(tx,ty), x=tx*T, y=ty*T;
    if((c==='W'||c==='Q') && hh(tx,ty,tick)>0.7) S('#cfe7f2',x+(hh(tx,ty,tick+1)*10+3|0),y+(hh(tx,ty,tick+2)*10+3|0),2,1);
    else if(c==='w' && hh(tx,ty,tick+5)>0.72) S('#e4f2f8',x+(hh(tx,ty,tick+6)*12+2|0),y+(hh(tx,ty,tick+7)*12+2|0),3,1);
    else if(c==='b'){ for(let k=0;k<2;k++) if(hh(tx,ty,tq+k*31)>.55) S(k?'#ffd23a':'#ff8a1e',x+(hh(tx,ty,tq+k+3)*14|0),y+(hh(tx,ty,tq+k+11)*14|0),1,1); }
    else if(c==='F'){ const h=2+(hh(tx,ty,tq)*5|0); S('#ff8a1e',x+6,y+4-h,3,h); S('#ffd23a',x+7,y+5-h,1,h-1); }
  }
}
