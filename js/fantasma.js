'use strict';
/* ---------- FANTASMA DO MELHOR TEMPO ----------
  Durante a partida, a posição do jogador é anotada a cada 0,1 s do relógio do jogo. Quando a fase termina com
  recorde, o caminho vira o fantasma daquela fase e dificuldade; na próxima tentativa, uma silhueta clara corre
  junto, no mesmo ritmo do recorde. Fica só neste aparelho. Desliga nas Opções. */
const K_FANTASMA='estrela-do-sertao:fantasma:', PASSO_FANTASMA=.1;
const chaveFantasma=(pf,fid,d)=>`${K_FANTASMA}${pf.id}:${fid}:${d}`;
let fantasma=null;      // {tempo, personagem, chapeu, pts:[x,y,código,...]} do recorde que está correndo junto

// código: direção (0 baixo, 1 direita, 2 cima, 3 esquerda) + 4 se está andando
const DIRS_F=[{x:0,y:1},{x:1,y:0},{x:0,y:-1},{x:-1,y:0}];
const codigoDir=d=>d.y>0?0:d.x>0?1:d.y<0?2:3;

function anotarRastro(){
  const r=S0.rastro||(S0.rastro=[]), i=Math.floor(time/PASSO_FANTASMA);
  while(r.length/3<=i) r.push(Math.round(p.x), Math.round(p.y), codigoDir(p.dir)+(p.moving?4:0));
}
function prepararFantasma(){
  fantasma=null;
  if(prefs.fantasma===false || !perfil) return;
  const f=store.get(chaveFantasma(perfil,fase.id,perfil.dificuldade||'normal'));
  if(f && Array.isArray(f.pts) && f.pts.length>=3 && f.tempo>0) fantasma=f;
}
function guardarFantasma(d){
  if(!S0.rastro || S0.rastro.length<3) return;
  store.set(chaveFantasma(perfil,fase.id,d),{tempo:time, personagem:perfil.personagem, chapeu:visualDe(perfil).chapeu, pts:S0.rastro});
}
function apagarFantasmas(id){
  for(const f of FASES) for(const d of Object.keys(DIFICULDADES)) store.del(`${K_FANTASMA}${id}:${f.id}:${d}`);
}
// posição do fantasma agora, entre dois pontos anotados
function posFantasma(){
  if(!fantasma || !S0 || S0.won) return null;
  const pts=fantasma.pts, n=pts.length/3, u=time/PASSO_FANTASMA, i=Math.floor(u);
  if(i>=n-1) return null;                                     // o recorde já chegou
  const a=i*3, b=a+3, k=u-i;
  return {x:pts[a]+(pts[b]-pts[a])*k, y:pts[a+1]+(pts[b+1]-pts[a+1])*k, d:DIRS_F[pts[a+2]&3], anda:pts[a+2]>=4};
}
function drawFantasma(g){
  const ch=PERSONAGENS[fantasma.personagem]||heroi;
  dc.save(); dc.globalAlpha=.38; tint='#d8ecf4';
  drawHeroi(ch,Math.round(g.x),Math.round(g.y+4),g.d,g.anda?Math.floor(time*9)%2:0,null,visualComChapeu(ch,fantasma.chapeu));
  tint=null; dc.restore();
}
