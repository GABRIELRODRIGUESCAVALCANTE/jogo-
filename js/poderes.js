'use strict';
/* ---------- PODERES DOS HERÓIS ----------
  Os heróis do sertão têm um poder na tecla Poder (R/V/Shift, Y no controle, botão no celular):
  · Homem-Calango — fio de caroá: prende o primeiro inimigo da frente por uns segundos, ou puxa um item de longe.
    Além disso, gruda em pedra como lagartixa: anda por cima das pedras (atravessa, em js/personagens.js).
  · Mulher-Mandacaru — rajada de espinhos em volta. A armadura também fere quem encosta nela.
  · Capitão Carcará — voo baixo: passa por cima de água rasa, lama e brasa sem atrasar nem queimar, os bichos do
    chão não o alcançam, e no fim mergulha ferindo quem estiver embaixo.
  · Raio do Sertão — arrancada: dispara para a frente sem levar dano e fere tudo o que atravessa.
  Os chefes seguem as mesmas regras de sempre: só sentem o golpe na hora certa. */
const PODERES={
  fio:      {recarga:1.1, usar:lancarFio},
  espinhos: {recarga:3,   usar:rajadaDeEspinhos},
  voo:      {recarga:4,   usar(){ p.voo=1.6; sfx.whip(); burst(p.x,p.y,'#c9b07a',8,40); }},
  arrancada:{recarga:1.4, usar(){ p.dash=.26; p.dashDir={...p.dir}; p.dashId=(p.dashId||0)+1; sfx.bote(); }},
};
let poderT=0, fioVisto=null;     // recarga do poder; o fio aparece na tela por um instante

function atualizarPoder(dt){
  poderT=Math.max(0,poderT-dt);
  if(just.has('especial') && heroi.poder && poderT<=0){ PODERES[heroi.poder].usar(); poderT=PODERES[heroi.poder].recarga; }
  if(p.voo>0){ p.voo-=dt; if(p.voo<=0) mergulho(); }
  if(p.dash>0){
    p.dash-=dt;
    if(Math.random()<.6) parts.push({x:p.x+(Math.random()-.5)*6,y:p.y-4-Math.random()*8,vx:-p.dashDir.x*40,vy:-p.dashDir.y*40,t:.2,col:'#ffd23a',g:0});
    if(chefe && chefe.active && !chefe.dead && chefe.dashHit!==p.dashId && overlap(hurtP(),CHEFES[chefe.tipo].caixa(chefe))){ chefe.dashHit=p.dashId; acertarChefe(chefe,1); }
  }
  // itens puxados pelo fio vêm voando até o jogador
  for(const it of items) if(it.puxado){ const dx=p.x-it.x, dy=p.y-it.y, d=Math.hypot(dx,dy)||1, v=Math.min(d,260*dt); it.x+=dx/d*v; it.y+=dy/d*v; }
  if(fioVisto && (fioVisto.t-=dt)<=0) fioVisto=null;
  atualizarBotaoPoder();
}
// a arrancada empurra o jogador na direção em que estava olhando, bem mais rápido
const velPoder=()=>p.dash>0 ? 3.2 : 1;

function lancarFio(){
  const d=p.dir, x0=p.x+d.x*6, y0=p.y-6+d.y*2; let x=x0, y=y0;
  sfx.whip();
  for(let i=0;i<30;i++){
    x+=d.x*4; y+=d.y*4;
    if(tiroBate(x,y+6)) break;
    const ponta={x,y,w:5,h:5};
    const c=inimigos.find(c=>!c.dead && overlap(ponta,INIM[c.tipo].caixa(c)));
    if(c){ c.preso=2.6; c.wx=c.wy=0; burst(c.x,c.y-6,'#f1e2c2',8,30); sfx.clink(); break; }
    if(chefe && chefe.active && !chefe.dead && overlap(ponta,CHEFES[chefe.tipo].caixa(chefe))){ CHEFES[chefe.tipo].resiste(chefe); break; }   // chefe arrebenta o fio
    const it=items.find(it=>!it.puxado && Math.hypot(it.x-x,it.y-y)<10);
    if(it){ it.puxado=true; sfx.pick(); break; }
  }
  fioVisto={x0,y0,x1:x,y1:y,t:.18};
}
function rajadaDeEspinhos(){
  for(let i=0;i<10;i++){ const a=i/10*Math.PI*2; pedras.push({tipo:'espinho', x:p.x, y:p.y-6, vx:Math.cos(a)*190, vy:Math.sin(a)*190, t:.34}); }
  sfx.whip(); burst(p.x,p.y-6,'#5f8f3f',10,50); shake=Math.max(shake,.08);
}
function mergulho(){
  sfx.crash(); shake=Math.max(shake,.15); burst(p.x,p.y,'#c9b07a',14,70);
  const area={x:p.x,y:p.y-4,w:44,h:36};
  for(const c of inimigos) if(!c.dead && overlap(area,INIM[c.tipo].caixa(c))) ferirInimigo(c,1);
  if(chefe && chefe.active && !chefe.dead && overlap(area,CHEFES[chefe.tipo].caixa(chefe))) acertarChefe(chefe,1);
}
// encostar num inimigo: a arrancada fere quem atravessa; a armadura de espinhos fere quem encosta
function contatoComInimigo(c,dt){
  c.espinhoT=Math.max(0,(c.espinhoT||0)-dt);
  if(p.dash>0){ if(c.dashHit!==p.dashId){ c.dashHit=p.dashId; ferirInimigo(c,1); } return; }
  if(c.preso>0) return;                                     // preso no fio não morde
  if(heroi.espinhosNoCorpo && c.espinhoT<=0){ c.espinhoT=1; ferirInimigo(c,1); }
  if(!c.dead) hurt(1,c.x,c.y);
}
function drawPoderes(){
  for(const c of inimigos) if(!c.dead && c.preso>0){            // fio enrolado no bicho preso
    const x=Math.round(c.x), y=Math.round(c.y);
    S('#f1e2c2',x-6,y-8,12,1); S('#f1e2c2',x-5,y-4,10,1); S('#f1e2c2',x-1,y-11,1,10);
  }
  if(fioVisto){ const {x0,y0,x1,y1}=fioVisto, n=Math.max(1,Math.hypot(x1-x0,y1-y0)/2);
    for(let i=0;i<=n;i++) S('#f1e2c2',x0+(x1-x0)*i/n,y0+(y1-y0)*i/n,1,1); }
}
function atualizarBotaoPoder(){
  const b=$('btnPoder'); if(!b) return;
  b.hidden=!heroi || !heroi.poder;
  if(!b.hidden){ const txt=t('poder.'+heroi.poder); if(b.textContent!==txt) b.textContent=txt; b.classList.toggle('recarga',poderT>0); }
}
