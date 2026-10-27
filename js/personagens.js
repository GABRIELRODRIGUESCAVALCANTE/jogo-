'use strict';
/* ---------- PERSONAGENS ---------- */
// vida em corações, velocidade em px/s, alcance do chicote em px, dano por lambada, recarga em segundos
const PERSONAGENS={
  ze:{nome:'Zé', g:'o', vida:3, vel:74, alcance:24, dano:1, recarga:.36,
    visual:{cabeca:'chapeu', chapeu:'#6b4423', chapeu2:'#7d5029', enfeite:'#e2b45e', roupa:'#8a5a2e', roupa2:'#a8733d', cinto:'#5e3a1c', fivela:'#e2b45e', braco:'#7a4e27', pele:'#c68a5a', calca:'#3b281b'}},
  luzia:{nome:'Luzia', g:'a', vida:3, vel:90, alcance:20, dano:1, recarga:.26,
    visual:{cabeca:'tranca', chapeu:'#7a3a1e', chapeu2:'#93502a', enfeite:'#c4462c', cabelo:'#2a1a12', lenco:'#c4462c', roupa:'#3a6a98', roupa2:'#5a8ac0', cinto:'#2a3a52', fivela:'#e2b45e', braco:'#2e5680', pele:'#a8693f', calca:'#3b281b'}},
  tiao:{nome:'Tião', g:'o', vida:4, vel:62, alcance:24, dano:2, recarga:.42,
    visual:{cabeca:'bandana', chapeu:'#c4462c', cabelo:'#2a1a12', barba:'#3a2416', roupa:'#c9b48a', roupa2:'#ddc89e', avental:'#5a4030', cinto:'#3a2a1e', fivela:'#9aa0a8', braco:'#8a5a3a', pele:'#8a5a3a', calca:'#3a3028'}},
  rosa:{nome:'Rosa', g:'a', vida:3, vel:78, alcance:22, dano:1, recarga:.34, imuneFogo:true, trava:true,
    visual:{cabeca:'veu', chapeu:'#f1ece0', roupa:'#7a5aa0', roupa2:'#9a7ac0', cinto:'#4a3a6a', fivela:'#e9a83b', braco:'#6a4a90', pele:'#b07850', calca:'#4a3a6a', saia:true, terco:'#e9a83b'}},
};
// título, tratamento, descrição e condição de liberar vêm do idioma atual (js/idiomas.js)
for(const [id,ch] of Object.entries(PERSONAGENS)){
  ch.id=id;
  for(const k of ['titulo','trato','desc','liberar']) Object.defineProperty(ch,k,{get:()=>t(`pers.${id}.${k}`)});
}
const PERS_ORDEM=['ze','luzia','tiao','rosa'];
const liberado=(id,pf)=>!PERSONAGENS[id].trava || !!(pf && pf.fim);

// pontos de 1 a 5 para as barrinhas da tela de escolha
function pontos(ch){
  return {vida:ch.vida+1, velocidade:Math.round((ch.vel-50)/8), forca:ch.dano*2+1, alcance:ch.alcance-19, ritmo:Math.round((.5-ch.recarga)*20)};
}

// x,y = pés; d = direção; f = quadro da passada; whip(hx,hy) desenha o chicote
function drawHeroi(ch,x,y,d,f,whip){
  const v=ch.visual, hx=x+d.x*4, hy=y-7+d.y*2;
  shadow(x,y,10);
  if(d.y<0 && whip) whip(hx,hy);
  if(v.cabeca==='tranca' && d.y<0){ S(v.cabelo,x-1,y-10,2,5); S(v.lenco,x-1,y-5,2,1); }
  S(v.calca,x-3,y-4,2,f?3:4); S(v.calca,x+1,y-4,2,f?4:3);
  S(v.roupa,x-4,y-10,8,7); S(v.roupa2,x-3,y-9,2,5);
  if(v.saia) S(v.roupa,x-5,y-5,10,3);
  if(v.avental && d.y>=0){ S(v.avental,x-3,y-9,6,6); S(v.avental,x-3,y-10,1,1); S(v.avental,x+2,y-10,1,1); }
  const cy=v.saia?y-7:y-4; S(v.cinto,x-4,cy,8,1); S(v.fivela,x-1,cy,2,1);
  S(v.braco,x-5,y-9,1,5); S(v.braco,x+4,y-9,1,5); S(v.pele,x-5,y-4,1,1); S(v.pele,x+4,y-4,1,1);
  if(v.lenco) S(v.lenco,x-3,y-10,6,1);
  if(v.terco && d.y>=0){ S(v.terco,x-2,y-10,1,1); S(v.terco,x-1,y-9,1,1); S(v.terco,x,y-8,1,2); S('#f1ece0',x,y-6,1,1); }
  S(v.pele,x-3,y-14,6,4);
  if(v.cabeca==='chapeu'){
    S(v.chapeu,x-6,y-14,12,2); S(v.chapeu2,x-4,y-17,8,3); S(v.enfeite,x-2,y-16,1,1); S(v.enfeite,x+1,y-16,1,1);
    if(d.y<0) S(v.chapeu,x-3,y-12,6,2);
  } else if(v.cabeca==='tranca'){
    S(v.cabelo,x-3,y-14,6,1);
    if(d.y<0) S(v.cabelo,x-3,y-13,6,3);
    else if(d.y>0){ S(v.cabelo,x+3,y-12,1,4); S(v.lenco,x+3,y-8,1,1); }
    else { const bx=d.x>0?x-4:x+3; S(v.cabelo,bx,y-12,1,5); S(v.lenco,bx,y-7,1,1); }
    S(v.chapeu,x-5,y-14,10,2); S(v.chapeu2,x-3,y-17,6,3); S(v.enfeite,x-3,y-15,6,1);
  } else if(v.cabeca==='bandana'){
    if(d.y<0) S(v.cabelo,x-3,y-13,6,3);
    S(v.chapeu,x-4,y-16,8,2); S(v.chapeu,x-3,y-17,6,1);
    const nx=d.x<0?x+3:x-5; if(d.y===0) { S(v.chapeu,nx,y-15,2,1); S(v.chapeu,d.x<0?nx+1:nx,y-14,1,2); }
  } else if(v.cabeca==='veu'){
    S(v.chapeu,x-4,y-16,8,2);
    if(d.y<0) S(v.chapeu,x-4,y-14,8,5);
    else { S(v.chapeu,x-4,y-14,1,6); S(v.chapeu,x+3,y-14,1,6); }
  }
  if(d.y>0){ S('#2a1a10',x-2,y-12,1,1); S('#2a1a10',x+1,y-12,1,1); }
  else if(d.y===0){ S('#2a1a10',d.x<0?x-2:x+1,y-12,1,1); }
  if(v.barba && d.y>=0){
    if(d.y>0){ S(v.barba,x-3,y-11,6,2); S(v.barba,x-2,y-9,4,1); }
    else S(v.barba,d.x<0?x-3:x-1,y-11,4,2);
  }
  if(d.y>=0 && whip) whip(hx,hy);
}

// avatar dos menus: um canvas 24x24 ampliado pelo CSS
function desenharAvatar(cnv,id,t,andando,sombra){
  const g=cnv.getContext('2d'); g.imageSmoothingEnabled=false;
  g.clearRect(0,0,cnv.width,cnv.height);
  const giro=[{x:0,y:1},{x:1,y:0},{x:0,y:-1},{x:-1,y:0}], d=andando?giro[Math.floor(t/1.2)%4]:{x:0,y:1};
  noContexto(g,()=>{ tint=sombra?'#3a2a20':null; drawHeroi(PERSONAGENS[id],12,21,d,andando?Math.floor(t*7)%2:0,null); tint=null; });
}
