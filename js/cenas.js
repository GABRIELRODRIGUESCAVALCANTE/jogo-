'use strict';
/* ---------- CENAS DE CORDEL ----------
  Ilustrações em estilo xilogravura desenhadas no canvas: tinta preta sobre papel, detalhes em vermelho
  e marcas de goiva brancas riscadas por cima da tinta. Mostradas antes de cada fase e no final. */
const CW=480, CH=270, PAPEL='#efe3c8', TINTA='#1c140f', VERMELHO='#b23a22';
const cenaCv=document.createElement('canvas'); cenaCv.width=CW; cenaCv.height=CH;
const camada=document.createElement('canvas'); camada.width=CW; camada.height=CH;

function desenharCena(id, alvo, def=CENAS[id]){
  const g=alvo.getContext('2d'), k=camada.getContext('2d');
  let semente=[...id].reduce((s,c)=>s*31+c.charCodeAt(0),7)>>>0;
  const rnd=()=>((semente=(semente*1103515245+12345)>>>0)/4294967296);
  // papel com fibras
  g.fillStyle=PAPEL; g.fillRect(0,0,CW,CH);
  for(let i=0;i<500;i++){ g.fillStyle=rnd()<.5?'rgba(120,90,50,.08)':'rgba(255,255,255,.25)'; g.fillRect(rnd()*CW,rnd()*CH,1+rnd()*3,1); }
  k.clearRect(0,0,CW,CH); k.fillStyle=TINTA; k.strokeStyle=TINTA; k.lineCap='round'; k.lineJoin='round';
  const P={k,rnd};
  def.desenho(P);
  // goiva: riscos brancos só onde há tinta
  k.globalCompositeOperation='source-atop'; k.strokeStyle=PAPEL; k.lineWidth=1.3;
  for(let i=0;i<900;i++){ const x=rnd()*CW, y=rnd()*CH, l=3+rnd()*7, a=(rnd()-.5)*.6; k.beginPath(); k.moveTo(x,y); k.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l); k.stroke(); }
  k.globalCompositeOperation='source-over';
  g.drawImage(camada,0,0);
  if(def.vermelho) def.vermelho(g,rnd);
  // moldura de cordel
  g.strokeStyle=TINTA; g.lineWidth=10; g.strokeRect(5,5,CW-10,CH-10); g.lineWidth=2; g.strokeRect(16,16,CW-32,CH-32);
  for(const [x,y] of [[16,16],[CW-16,16],[16,CH-16],[CW-16,CH-16]]){ g.fillStyle=TINTA; g.beginPath(); g.arc(x,y,6,0,7); g.fill(); g.fillStyle=PAPEL; g.beginPath(); g.arc(x,y,2.5,0,7); g.fill(); }
}

/* ---------- peças da xilogravura ---------- */
function forma(k,pts){ k.beginPath(); k.moveTo(pts[0],pts[1]); for(let i=2;i<pts.length;i+=2) k.lineTo(pts[i],pts[i+1]); k.closePath(); k.fill(); }
function solo({k,rnd},y,ondas=3){
  k.beginPath(); k.moveTo(0,CH); k.lineTo(0,y);
  for(let x=0;x<=CW;x+=12) k.lineTo(x,y+Math.sin(x/CW*Math.PI*ondas)*10+rnd()*3);
  k.lineTo(CW,CH); k.closePath(); k.fill();
}
// fundo hachurado (linhas horizontais) para não se misturar com as figuras pretas da frente
function hachura(k,caminho,espaco=6){
  k.save(); caminho(); k.clip(); k.lineWidth=2;
  for(let y=0;y<CH;y+=espaco){ k.beginPath(); k.moveTo(0,y); k.lineTo(CW,y+3); k.stroke(); }
  k.restore(); caminho(); k.lineWidth=4; k.stroke();
}
function morros({k,rnd},y,alt){
  const topo=[]; for(let x=0;x<=CW;x+=20) topo.push([x,y-Math.abs(Math.sin(x/90+1))*alt-rnd()*8]);
  hachura(k,()=>{ k.beginPath(); k.moveTo(0,CH); for(const [x,yy] of topo) k.lineTo(x,yy); k.lineTo(CW,CH); k.closePath(); });
}
function formaContorno(k,pts){ k.beginPath(); k.moveTo(pts[0],pts[1]); for(let i=2;i<pts.length;i+=2) k.lineTo(pts[i],pts[i+1]); k.closePath(); k.save(); k.strokeStyle=PAPEL; k.lineWidth=6; k.stroke(); k.restore(); k.fill(); }
function raios(k,x,y,r,n,comp){
  k.lineWidth=3;
  for(let i=0;i<n;i++){ const a=i/n*Math.PI*2; k.beginPath(); k.moveTo(x+Math.cos(a)*(r+4),y+Math.sin(a)*(r+4)); k.lineTo(x+Math.cos(a)*(r+comp),y+Math.sin(a)*(r+comp)); k.stroke(); }
}
function lua(k,x,y,r){ k.lineWidth=4; k.beginPath(); k.arc(x,y,r,0,7); k.stroke(); raios(k,x,y,r,16,12); k.beginPath(); k.arc(x-r*.3,y-r*.2,r*.18,0,7); k.fill(); k.beginPath(); k.arc(x+r*.25,y+r*.3,r*.12,0,7); k.fill(); }
function estrelas({k,rnd},n,yMax){ k.lineWidth=2; for(let i=0;i<n;i++){ const x=30+rnd()*(CW-60), y=25+rnd()*yMax, s=2+rnd()*3; k.beginPath(); k.moveTo(x-s,y); k.lineTo(x+s,y); k.moveTo(x,y-s); k.lineTo(x,y+s); k.stroke(); } }
function mandacaru(k,x,y,h){
  k.fillRect(x-7,y-h,14,h); k.beginPath(); k.arc(x,y-h,7,Math.PI,0); k.fill();
  k.fillRect(x-24,y-h*.6,17,9); k.fillRect(x-24,y-h*.9,9,h*.35); k.beginPath(); k.arc(x-19.5,y-h*.9,4.5,Math.PI,0); k.fill();
  k.fillRect(x+7,y-h*.45,15,9); k.fillRect(x+13,y-h*.8,9,h*.4); k.beginPath(); k.arc(x+17.5,y-h*.8,4.5,Math.PI,0); k.fill();
}
function boi(k,x,y,s,face=1,pulo=0){
  k.save(); k.translate(x,y-pulo); k.scale(face*s,s);
  forma(k,[-34,-30,22,-34,30,-20,26,0,-30,0,-38,-14]);                     // corpo
  for(const [lx,a] of [[-28,.15],[-16,-.1],[10,.12],[20,-.15]]){ k.save(); k.translate(lx,-2); k.rotate(a); k.fillRect(-3,0,6,24); k.restore(); }
  forma(k,[22,-34,40,-46,52,-40,50,-26,36,-18]);                           // cabeça
  k.lineWidth=4; k.beginPath(); k.moveTo(40,-46); k.quadraticCurveTo(38,-62,28,-64); k.moveTo(48,-44); k.quadraticCurveTo(58,-58,66,-56); k.stroke();
  k.beginPath(); k.moveTo(-36,-24); k.quadraticCurveTo(-52,-18,-48,0); k.stroke();
  k.fillStyle=PAPEL; forma(k,[42,-42,44,-37,49,-37,45,-34,47,-29,42,-32,37,-29,39,-34,35,-37,40,-37]);   // estrela na testa
  k.fillStyle=TINTA; k.restore();
}
function vaqueiro(k,x,y,s,face=1){
  k.save(); k.translate(x,y); k.scale(face*s,s);
  k.fillRect(-6,-26,5,26); k.fillRect(2,-26,5,26); forma(k,[-10,-58,10,-58,12,-26,-12,-26]);
  k.beginPath(); k.arc(0,-66,8,0,7); k.fill();
  k.beginPath(); k.ellipse(0,-72,20,5,0,0,7); k.fill(); forma(k,[-10,-74,10,-74,6,-86,-6,-86]);
  k.lineWidth=4; k.beginPath(); k.moveTo(10,-50); k.lineTo(26,-44); k.stroke();
  k.lineWidth=2; k.beginPath(); k.moveTo(26,-44); k.bezierCurveTo(50,-70,60,-30,82,-52); k.stroke();
  k.restore();
}
function cerca(k,x,y,w,quebrada){
  k.lineWidth=5;
  for(let i=0;i<=w;i+=26){ k.beginPath(); k.moveTo(x+i,y); k.lineTo(x+i+(quebrada&&i>w/2?8:0),y-34); k.stroke(); }
  k.lineWidth=4; k.beginPath(); k.moveTo(x,y-26); k.lineTo(x+w/2,y-26); k.moveTo(x,y-12); k.lineTo(x+w/2+6,y-14);
  if(quebrada){ k.moveTo(x+w/2+20,y-30); k.lineTo(x+w,y-20); } else { k.moveTo(x+w/2,y-26); k.lineTo(x+w,y-26); }
  k.stroke();
}
function rio({k},y,h){
  k.fillRect(0,y,CW,h);
  k.strokeStyle=PAPEL; k.lineWidth=2;
  for(let j=6;j<h;j+=9){ k.beginPath(); for(let x=0;x<=CW;x+=8) k.lineTo(x,y+j+Math.sin(x/14+j)*2.5); k.stroke(); }
  k.strokeStyle=TINTA;
}
function fogueira(k,x,y,s){
  k.save(); k.translate(x,y); k.scale(s,s); k.lineWidth=6;
  k.beginPath(); k.moveTo(-26,0); k.lineTo(18,-14); k.moveTo(26,0); k.lineTo(-18,-14); k.moveTo(-10,2); k.lineTo(0,-30); k.moveTo(10,2); k.lineTo(0,-30); k.stroke();
  k.restore();
}
function chamas(g,x,y,s){
  g.save(); g.translate(x,y); g.scale(s,s); g.fillStyle=VERMELHO;
  g.beginPath(); g.moveTo(-20,-10); g.quadraticCurveTo(-26,-40,-6,-62); g.quadraticCurveTo(-8,-40,4,-34); g.quadraticCurveTo(4,-60,18,-74); g.quadraticCurveTo(14,-46,24,-30); g.quadraticCurveTo(26,-16,18,-10); g.closePath(); g.fill();
  g.restore();
}
function bandeirinhas(g,y,cor){
  g.strokeStyle=TINTA; g.lineWidth=2; g.beginPath(); g.moveTo(20,y); g.quadraticCurveTo(CW/2,y+40,CW-20,y); g.stroke();
  for(let i=1;i<18;i++){ const tt=i/18, x=20+(CW-40)*tt, yy=y+40*2*tt*(1-tt); g.fillStyle=i%2?cor:TINTA; g.beginPath(); g.moveTo(x-8,yy); g.lineTo(x+8,yy); g.lineTo(x,yy+16); g.closePath(); g.fill(); }
}
function mula(k,x,y,s){
  k.save(); k.translate(x,y); k.scale(s,s);
  forma(k,[-40,-34,20,-38,34,-28,30,-4,-34,-4,-42,-18]);
  for(const [lx,a] of [[-34,.5],[-20,-.3],[14,.45],[26,-.4]]){ k.save(); k.translate(lx,-6); k.rotate(a); k.fillRect(-3,0,6,26); k.restore(); }
  forma(k,[22,-36,40,-52,48,-46,34,-28]);                                 // pescoço sem cabeça
  k.lineWidth=4; k.beginPath(); k.moveTo(-40,-28); k.quadraticCurveTo(-60,-30,-62,-10); k.stroke();
  k.restore();
}
function lobisomem(k,x,y,s){
  k.save(); k.translate(x,y); k.scale(s,s);
  k.fillRect(-12,-40,10,40); k.fillRect(4,-40,10,40);
  forma(k,[-18,-96,18,-96,22,-40,-20,-40]);
  forma(k,[14,-92,30,-120,26,-90]); forma(k,[-14,-92,-34,-118,-22,-88]);   // braços erguidos
  forma(k,[-10,-96,10,-96,16,-120,8,-136,4,-124,-4,-124,-8,-136,-16,-120]);  // cabeça uivando
  k.fillStyle=PAPEL; k.beginPath(); k.arc(-3,-112,2,0,7); k.arc(5,-112,2,0,7); k.fill(); k.fillStyle=TINTA;
  k.restore();
}
function serra({k,rnd},y){
  const picos=[[0,y],[60,y-60],[120,y-20],[200,y-110],[270,y-40],[340,y-90],[420,y-30],[CW,y-60]].map(([px,py])=>[px,py-rnd()*8]);
  hachura(k,()=>{ k.beginPath(); k.moveTo(0,CH); for(const [px,py] of picos) k.lineTo(px,py); k.lineTo(CW,CH); k.closePath(); },5);
}
function sanfoneiro(k,x,y,s){
  k.save(); k.translate(x,y); k.scale(s,s);
  k.fillRect(-7,-26,5,26); k.fillRect(3,-26,5,26); forma(k,[-11,-58,11,-58,12,-26,-12,-26]);
  k.beginPath(); k.arc(0,-66,8,0,7); k.fill(); k.beginPath(); k.ellipse(0,-72,19,5,0,0,7); k.fill(); forma(k,[-9,-74,9,-74,6,-84,-6,-84]);
  k.fillStyle=PAPEL; for(let i=0;i<5;i++) k.fillRect(-16+i*7,-50,3,18); k.fillStyle=TINTA;
  k.lineWidth=3; k.strokeRect(-20,-52,40,22);
  k.restore();
}

/* ---------- as cenas ---------- */
const CENAS={
  1:{desenho(P){ const {k}=P; lua(k,380,70,30); estrelas(P,14,80); morros(P,200,40); solo(P,215,2);
      cerca(k,40,214,140,true); mandacaru(k,430,226,90); boi(k,270,214,1.25,1,6); },
     vermelho(g){ chamas(g,436,128,.18); }},
  2:{desenho(P){ const {k}=P; raios(k,90,64,22,12,14); k.lineWidth=4; k.beginPath(); k.arc(90,64,22,0,7); k.stroke();
      morros(P,140,22); rio(P,150,76);
      for(const pts of [[300,100,312,100,312,176,300,176],[380,100,392,100,392,176,380,176],[296,96,342,96,342,106,296,106],[358,96,396,96,396,106,358,106]]) formaContorno(k,pts);   // ponte quebrada
      formaContorno(k,[120,190,260,190,240,214,140,214]); formaContorno(k,[186,146,190,146,190,190,186,190]); formaContorno(k,[192,150,234,182,192,182]);  // barco com vela
      formaContorno(k,[256,186,276,168,292,176,282,190]);                                   // carranca na proa
      solo(P,236,2); },
     vermelho(g){ g.fillStyle=VERMELHO; g.beginPath(); g.arc(90,64,10,0,7); g.fill(); g.beginPath(); g.arc(281,176,3,0,7); g.fill(); }},
  3:{desenho(P){ const {k}=P; estrelas(P,8,60); serra(P,200); solo(P,228,4); mula(k,240,220,1.35); },
     vermelho(g){ chamas(g,295,166,.75); chamas(g,170,126,.5); chamas(g,350,118,.4); }},
  4:{desenho(P){ const {k}=P; lua(k,110,70,34); estrelas(P,18,90);
      forma(k,[230,CH,300,176,360,172,430,190,CH*2,CH]); solo(P,236,1.5);               // duna onde o Lobisomem uiva
      lobisomem(k,330,176,.95); fogueira(k,110,240,1); boi(k,200,236,.8,-1); },
     vermelho(g){ chamas(g,110,234,.75); }},
  final:{desenho(P){ const {k}=P; estrelas(P,10,50); solo(P,220,2); fogueira(k,240,236,1.3);
      boi(k,110,232,.9,1,10); sanfoneiro(k,380,236,1.1); vaqueiro(k,320,236,.95,-1); },
     vermelho(g){ bandeirinhas(g,40,VERMELHO); chamas(g,240,228,1.2); }},
};

/* ---------- tela da cena ---------- */
let depoisDaCena=null, cenaAtual=null;
function mostrarCena(id, depois){
  if(prefs.cenas===false){ depois(); return; }
  depoisDaCena=depois; cenaAtual=String(id);
  desenharCena(cenaAtual, $('cenaTela')); textoCena(cenaAtual);
  mostrar('telaCena'); $('btnCenaSeguir').focus();
}
function textoCena(id){
  $('cenaTitulo').textContent=t(`cena.${id}.t`);
  const v=$('cenaVerso'); v.textContent='';
  for(const linha of t(`cena.${id}`)) v.append(el('span','',linha));
}
$('btnCenaSeguir').addEventListener('click',()=>{ const d=depoisDaCena; depoisDaCena=null; cenaAtual=null; if(d) d(); });
