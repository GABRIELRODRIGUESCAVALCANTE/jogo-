'use strict';
/* ---------- ALMANAQUE DO SERTÃO ----------
  Uma página em xilogravura para cada criatura do folclore que aparece no jogo, com a lenda e os encontros do jogador.
  A página se abre quando a criatura aparece na tela pela primeira vez. Textos em js/idiomas.js ('alm.<id>...'). */
const ALMANAQUE=[
  {id:'caipora',   npc:'caipora',   conta:'conversas', fase:1},
  {id:'cabra',     inimigo:'cabra', conta:'vencidos',  fase:1},
  {id:'caboclo',   chefe:'caboclo', conta:'vencidos',  fase:2},
  {id:'mula',      chefe:'mula',    conta:'vencidos',  fase:3},
  {id:'fulozinha', npc:'fulozinha', conta:'conversas', fase:4},
  {id:'rasga',     inimigo:'coruja',conta:'vencidos',  fase:4},
  {id:'batatao',   inimigo:'batatao',conta:'vencidos', fase:4},
  {id:'lobisomem', chefe:'lobisomem',conta:'vencidos', fase:4},
];
const almanaqueDe=pf=>((pf.estat=pf.estat||{inimigos:0}).criaturas=pf.estat.criaturas||{});
function registroCriatura(id){ const c=almanaqueDe(perfil); return c[id]=c[id]||{vista:0, n:0}; }
const entradaPor=(campo,valor)=>ALMANAQUE.find(e=>e[campo]===valor);

// chamados pelo jogo
function verCriatura(e){ const r=registroCriatura(e.id); if(!r.vista){ r.vista=Date.now(); salvarPerfis(); toast(t('alm.nova',{nome:t('alm.'+e.id)}),2.4); } }
function contarCriatura(campo,valor){ const e=entradaPor(campo,valor); if(!e) return; const r=registroCriatura(e.id); if(!r.vista) r.vista=Date.now(); r.n++; salvarPerfis(); }
let olharT=0;
// de tempos em tempos, anota as criaturas que estão na tela
function olharCriaturas(dt){
  if((olharT-=dt)>0) return; olharT=.4;
  const cx=clamp(p.x-VW/2,0,MW*T-VW), cy=clamp(p.y-VH/2,0,MH*T-VH), naTela=o=>o.x>cx-8 && o.x<cx+VW+8 && o.y>cy-8 && o.y<cy+VH+8;
  for(const c of inimigos){ const e=!c.dead && entradaPor('inimigo',c.tipo); if(e && naTela(c)) verCriatura(e); }
  for(const n of npcs){ const e=entradaPor('npc',n.type); if(e && naTela(n)) verCriatura(e); }
  if(chefe && chefe.active && !chefe.dead){ const e=entradaPor('chefe',chefe.tipo); if(e) verCriatura(e); }
}

/* ---------- gravuras ---------- */
function caititu(k,x,y,s,face=1){
  k.save(); k.translate(x,y); k.scale(face*s,s);
  forma(k,[-34,-22,-20,-34,18,-34,34,-24,48,-18,52,-10,34,-6,-30,-4,-38,-12]);
  for(const lx of [-26,-12,16,28]) k.fillRect(lx,-6,6,16);
  k.lineWidth=3; k.beginPath(); for(let i=-26;i<20;i+=6){ k.moveTo(i,-34); k.lineTo(i+3,-42); } k.stroke();   // cerdas
  k.fillStyle=PAPEL; k.beginPath(); k.arc(38,-20,2,0,7); k.fill(); k.fillRect(48,-12,6,2); k.fillStyle=TINTA;
  k.restore();
}
function caiporaFig(k,x,y,s){
  k.save(); k.translate(x,y); k.scale(s,s);
  forma(k,[-10,-30,10,-30,12,0,-12,0]); k.fillRect(-14,-4,6,16); k.fillRect(8,-4,6,16);       // corpo montado
  k.beginPath(); k.arc(0,-38,9,0,7); k.fill();
  k.lineWidth=4; k.beginPath(); k.moveTo(10,-22); k.lineTo(34,-44); k.stroke();              // vara
  k.restore();
}
function cabraFig(k,x,y,s,face=1){
  k.save(); k.translate(x,y); k.scale(face*s,s);
  forma(k,[-30,-28,18,-32,26,-20,22,-2,-26,-2,-34,-14]);
  for(const [lx,a] of [[-24,.2],[-12,-.15],[8,.2],[16,-.2]]){ k.save(); k.translate(lx,-4); k.rotate(a); k.fillRect(-2,0,5,26); k.restore(); }
  forma(k,[16,-32,30,-46,44,-40,40,-28,26,-22]);                                          // cabeça
  forma(k,[34,-30,38,-30,36,-16]);                                                          // barba
  k.lineWidth=5; k.beginPath(); k.moveTo(30,-46); k.bezierCurveTo(18,-66,2,-62,4,-50); k.moveTo(36,-46); k.bezierCurveTo(30,-70,12,-72,12,-58); k.stroke();
  k.lineWidth=3; k.beginPath(); k.moveTo(-32,-24); k.lineTo(-40,-34); k.stroke();
  k.restore();
}
function cabocloFig(k,x,y,s){
  k.save(); k.translate(x,y); k.scale(s,s);
  forma(k,[-20,0,-18,-46,18,-46,20,0]);                                                     // tronco saindo d'água
  forma(k,[-18,-44,-44,-70,-38,-76,-12,-50]); forma(k,[18,-44,40,-80,48,-74,14,-50]);         // braços erguidos
  k.beginPath(); k.arc(0,-58,12,0,7); k.fill();
  k.lineWidth=4; k.beginPath(); for(const dx of [-10,-4,4,10]){ k.moveTo(dx,-66); k.quadraticCurveTo(dx*1.6,-50,dx*1.8,-36); } k.stroke();   // cabelo molhado
  k.fillStyle=PAPEL; k.beginPath(); k.arc(-4,-60,2,0,7); k.arc(5,-60,2,0,7); k.fill(); k.fillStyle=TINTA;
  k.restore();
}
function fulozinhaFig(k,x,y,s){
  k.save(); k.translate(x,y); k.scale(s,s);
  forma(k,[-8,-58,8,-58,14,-20,-14,-20]); k.fillRect(-7,-20,5,20); k.fillRect(2,-20,5,20);
  k.beginPath(); k.arc(0,-66,8,0,7); k.fill();
  k.lineCap='round'; k.lineWidth=5; k.beginPath();                                             // cabelo solto até os pés
  for(const [x0,x1,x2] of [[-6,-16,-24],[-3,-12,-18],[4,14,22],[7,18,28]]){ k.moveTo(x0,-72); k.bezierCurveTo(x1,-50,x1-4,-24,x2,0); }
  k.stroke(); k.beginPath(); k.ellipse(0,-70,10,5,0,Math.PI,0); k.fill();
  k.fillStyle=PAPEL; k.beginPath(); k.arc(-3,-66,1.6,0,7); k.arc(3,-66,1.6,0,7); k.fill(); k.fillStyle=TINTA;
  k.lineWidth=3; k.beginPath(); for(const r of [8,14,20]) k.arc(14,-66,r,-.7,.2); k.stroke();       // assobio
  k.restore();
}
function moita(k,x,y,s){ k.save(); k.translate(x,y); k.scale(s,s); for(const [dx,dy,r] of [[-18,-10,12],[0,-18,15],[18,-10,12],[0,-6,12]]){ k.beginPath(); k.arc(dx,dy,r,0,7); k.fill(); } k.restore(); }
function arvoreSeca(k,x,y,h){
  k.lineCap='round'; k.lineWidth=12; k.beginPath(); k.moveTo(x,y); k.lineTo(x+6,y-h); k.stroke();
  k.lineWidth=6; k.beginPath(); k.moveTo(x+4,y-h*.6); k.lineTo(x-60,y-h*.8); k.moveTo(x+6,y-h*.85); k.lineTo(x+56,y-h*1.05); k.moveTo(x-30,y-h*.7); k.lineTo(x-44,y-h*.95); k.stroke();
}
function coruja(k,x,y,s){
  k.save(); k.translate(x,y); k.scale(s,s);
  k.beginPath(); k.ellipse(0,-24,16,24,0,0,7); k.fill();
  k.fillStyle=PAPEL; k.beginPath(); k.moveTo(0,-30); k.bezierCurveTo(-18,-50,-16,-24,0,-14); k.bezierCurveTo(16,-24,18,-50,0,-30); k.fill();   // cara de coração
  k.fillStyle=TINTA; k.beginPath(); k.arc(-6,-30,3,0,7); k.arc(6,-30,3,0,7); k.fill(); forma(k,[-2,-24,2,-24,0,-19]);
  k.restore();
}
function viajante(k,x,y,s){
  k.save(); k.translate(x,y); k.scale(s,s);
  k.fillRect(-5,-24,4,24); k.fillRect(2,-24,4,24); forma(k,[-8,-50,8,-50,9,-24,-9,-24]);
  k.beginPath(); k.arc(0,-56,6,0,7); k.fill(); k.beginPath(); k.ellipse(0,-61,14,4,0,0,7); k.fill();
  forma(k,[-8,-46,-20,-60,-16,-64,-4,-48]); forma(k,[8,-46,20,-60,16,-64,4,-48]);            // mãos para cima, assustado
  k.restore();
}
function bolaDeFogo(g,x,y,r){
  g.save(); g.fillStyle=VERMELHO;
  g.beginPath(); g.arc(x,y,r,0,7); g.fill();
  for(let i=1;i<6;i++){ g.globalAlpha=1-i*.16; g.beginPath(); g.arc(x+i*r*.9,y-i*r*.35,r*(1-i*.14),0,7); g.fill(); }
  g.restore();
}
const GRAVURAS={
  caipora:{desenho(P){ const {k}=P; estrelas(P,6,40); morros(P,150,30);
      for(const [x,h] of [[40,120],[420,140],[90,90]]){ k.fillRect(x-6,236-h,12,h); k.beginPath(); k.arc(x,236-h,34,0,7); k.fill(); }   // mata
      solo(P,228,2); caititu(k,240,228,1.3); caiporaFig(k,236,196,1.15); },
    vermelho(g){ g.fillStyle=VERMELHO; for(let i=0;i<5;i++){ g.beginPath(); g.moveTo(222+i*7,148); g.lineTo(226+i*7,132-(i%2)*6); g.lineTo(230+i*7,148); g.fill(); } }},   // cabelo de fogo
  cabra:{desenho(P){ const {k}=P; lua(k,90,64,24); estrelas(P,10,70); morros(P,190,20); solo(P,222,2);
      cerca(k,330,222,130,false); mandacaru(k,70,224,80); cabraFig(k,220,218,1.5); },
    vermelho(g){ g.save(); g.translate(296,166); g.rotate(1.35); chamas(g,0,0,.42); g.restore(); g.fillStyle=VERMELHO; g.beginPath(); g.arc(272,160,3,0,7); g.fill(); }},
  caboclo:{desenho(P){ const {k}=P; raios(k,400,58,18,10,12); k.lineWidth=4; k.beginPath(); k.arc(400,58,18,0,7); k.stroke();
      morros(P,140,18); cabocloFig(k,230,176,1.4); rio(P,170,100);
      formaContorno(k,[40,160,150,160,132,180,58,180]); formaContorno(k,[150,160,170,142,180,150,166,162]); },   // canoa virando, com carranca
    vermelho(g){ g.fillStyle=VERMELHO; g.beginPath(); g.arc(172,150,3,0,7); g.fill(); }},
  mula:{desenho(P){ const {k}=P; lua(k,380,64,26); estrelas(P,10,60); serra(P,190); solo(P,226,3); mula(k,230,218,1.5); cerca(k,30,226,110,true); },
    vermelho(g){ chamas(g,296,148,.85); chamas(g,120,190,.35); }},
  fulozinha:{desenho(P){ const {k}=P; estrelas(P,8,50); morros(P,160,26); solo(P,228,2);
      for(const [x,s] of [[70,1.4],[150,1],[350,1.2],[430,1.5]]) moita(k,x,224,s);
      fulozinhaFig(k,250,226,1.6); boi(k,370,226,.5,-1); },
    vermelho(g){ g.fillStyle=VERMELHO; for(const [x,y] of [[60,196],[84,204],[338,196],[436,192],[420,206]]){ g.beginPath(); g.arc(x,y,4,0,7); g.fill(); } }},   // flores
  rasga:{desenho(P){ const {k}=P; lua(k,120,80,40); estrelas(P,12,60); solo(P,236,1.5);
      arvoreSeca(k,300,236,170); coruja(k,350,94,1.2);
      for(const x of [60,180,400]){ forma(k,[x-30,236,x-30,206,x,190,x+30,206,x+30,236]); } },     // casas
    vermelho(g){ g.fillStyle=VERMELHO; for(const x of [52,172,392]) g.fillRect(x,214,10,10); }},      // janelas acesas
  batatao:{desenho(P){ const {k}=P; estrelas(P,22,110);
      forma(k,[0,CH,0,210,120,180,240,206,360,176,CW,200,CW,CH]); solo(P,240,1); viajante(k,140,222,1.2); },
    vermelho(g){ bolaDeFogo(g,330,110,22); }},
  lobisomem:{desenho(P){ const {k}=P; lua(k,360,70,34); estrelas(P,16,90);
      forma(k,[0,CH,0,200,100,170,200,190,CW,CH]); solo(P,238,1.5); lobisomem(k,120,176,1); cerca(k,280,238,170,false); },
    vermelho(g){ g.fillStyle=VERMELHO; g.beginPath(); g.arc(117,64,2.5,0,7); g.arc(125,64,2.5,0,7); g.fill(); }},
};

/* ---------- tela ---------- */
function abrirAlmanaque(){
  const box=$('listaAlmanaque'); box.textContent='';
  const reg=almanaqueDe(perfil); let n=0;
  for(const e of ALMANAQUE){
    const r=reg[e.id], tem=!!(r && r.vista); if(tem) n++;
    const card=el('article','pagina'+(tem?'':' oculta')), cv=el('canvas'); cv.width=CW; cv.height=CH;
    if(tem){ desenharCena(e.id,cv,GRAVURAS[e.id]); cv.setAttribute('role','img'); cv.setAttribute('aria-label',t('alm.aria',{nome:t('alm.'+e.id)})); }
    else { desenharCena(e.id,cv,{desenho({k}){ k.font='120px Rye, Georgia, serif'; k.textAlign='center'; k.fillText('?',CW/2,CH/2+42); }}); cv.setAttribute('aria-hidden','true'); }
    const txt=el('div','pagina-txt');
    if(tem){
      txt.append(el('h3','',t('alm.'+e.id)), el('p','',t('alm.'+e.id+'.d')), el('p','contagem',t('alm.'+e.conta,{n:r.n||0})));
    } else txt.append(el('h3','',t('alm.oculta')), el('p','',t('alm.dica',{n:e.fase})));
    card.append(cv,txt); box.append(card);
  }
  $('contaAlmanaque').textContent=t('alm.conta',{n,t:ALMANAQUE.length});
  mostrar('telaAlmanaque');
}
$('btnAlmanaque').addEventListener('click',()=>{ sfx.pagina(); abrirAlmanaque(); });
$('btnVoltarAlmanaque').addEventListener('click',abrirMenu);
