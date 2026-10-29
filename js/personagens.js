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
  rosa:{nome:'Rosa', g:'a', vida:3, vel:78, alcance:22, dano:1, recarga:.34, imuneFogo:true,
    libera:pf=>pf.fim || !!(pf.fases && pf.fases[3] && pf.fases[3].feita),            // vencer a Serra do Fogo
    visual:{cabeca:'veu', chapeu:'#f1ece0', roupa:'#7a5aa0', roupa2:'#9a7ac0', cinto:'#4a3a6a', fivela:'#e9a83b', braco:'#6a4a90', pele:'#b07850', calca:'#4a3a6a', saia:true, terco:'#e9a83b'}},
  // heróis do sertão: cada um tem um poder (tecla Poder) além do chicote; os poderes ficam em js/poderes.js
  calango:{nome:'Homem-Calango', g:'o', vida:3, vel:80, alcance:22, dano:1, recarga:.32, atravessa:new Set(['R']), poder:'fio',
    libera:pf=>!!pf.fim,                                                               // terminar a jornada
    visual:{cabeca:'mascara', chapeu:'#5a6a2a', chapeu2:'#7a8a3a', enfeite:'#c4a43a', olho:'#ffd23a', roupa:'#6b7a32', roupa2:'#b8b46a', cinto:'#3a2a1a', fivela:'#c4a43a', braco:'#5a6a2a', pele:'#5a6a2a', calca:'#4a5424', cauda:'#5a6a2a'}},
  mandacaru:{nome:'Mulher-Mandacaru', g:'a', vida:4, vel:66, alcance:20, dano:1, recarga:.38, poder:'espinhos', espinhosNoCorpo:true,
    libera:pf=>temConquista(pf,'lambada'),                                            // vencer 50 inimigos
    visual:{cabeca:'flor', chapeu:'#3f6a2e', chapeu2:'#5f8f3f', enfeite:'#e85a8a', cabelo:'#2a1a12', roupa:'#3f6a2e', roupa2:'#5f8f3f', cinto:'#2f4a22', fivela:'#e8d9b8', braco:'#3f6a2e', pele:'#a8693f', calca:'#2f4a22', espinho:'#e8d9b8'}},
  carcara:{nome:'Capitão Carcará', g:'o', vida:3, vel:84, alcance:22, dano:1, recarga:.34, poder:'voo',
    libera:pf=>!!(pf.fases && pf.fases[2] && pf.fases[2].feita),                       // atravessar o Velho Chico
    visual:{cabeca:'bico', chapeu:'#5e3a22', chapeu2:'#7a4e2c', enfeite:'#e9a83b', face:'#d8603a', roupa:'#f1e2c2', roupa2:'#d8c8a2', cinto:'#5e3a22', fivela:'#e9a83b', braco:'#5e3a22', pele:'#c68a5a', calca:'#3b281b', asa:'#4a2e1a', asa2:'#7a4e2c'}},
  raio:{nome:'Raio do Sertão', g:'o', vida:2, vel:104, alcance:18, dano:1, recarga:.24, poder:'arrancada',
    libera:pf=>temConquista(pf,'ligeiro'),                                            // fase 1 em menos de 2 minutos
    visual:{cabeca:'chapeu', chapeu:'#2a3a52', chapeu2:'#3a5070', enfeite:'#ffd23a', raio:true, roupa:'#e9a83b', roupa2:'#ffd23a', cinto:'#2a3a52', fivela:'#ffd23a', braco:'#c48a2a', pele:'#8a5a3a', calca:'#2a3a52', lenco:'#c4462c', lencoVoa:true}},
};
// título, tratamento, descrição e condição de liberar vêm do idioma atual (js/idiomas.js)
for(const [id,ch] of Object.entries(PERSONAGENS)){
  ch.id=id;
  for(const k of ['titulo','trato','desc','liberar']) Object.defineProperty(ch,k,{get:()=>t(`pers.${id}.${k}`)});
}
const PERS_ORDEM=['ze','luzia','tiao','rosa','calango','mandacaru','carcara','raio'];
const FAMILIA=['ze','luzia','tiao','rosa'];        // a conquista "Família" é jogar com os quatro primeiros
const liberado=(id,pf)=>!PERSONAGENS[id].libera || !!(pf && PERSONAGENS[id].libera(pf));

// pontos de 1 a 5 para as barrinhas da tela de escolha
function pontos(ch){
  return {vida:ch.vida+1, velocidade:Math.round((ch.vel-50)/8), forca:ch.dano*2+1, alcance:ch.alcance-19, ritmo:Math.round((.5-ch.recarga)*20)};
}

// x,y = pés; d = direção; f = quadro da passada; whip(hx,hy) desenha o chicote
function drawHeroi(ch,x,y,d,f,whip,v=ch.visual){
  const hx=x+d.x*4, hy=y-7+d.y*2;
  if(!v.semSombra) shadow(x,y,10);
  if(d.y<0 && whip) whip(hx,hy);
  if(v.cabeca==='tranca' && d.y<0){ S(v.cabelo,x-1,y-10,2,5); S(v.lenco,x-1,y-5,2,1); }
  if(v.asa){                                                 // capa de penas do Carcará: abre quando ele voa
    if(v.asasAbertas){ S(v.asa,x-11,y-12,7,3); S(v.asa,x+4,y-12,7,3); S(v.asa2,x-9,y-10,5,2); S(v.asa2,x+4,y-10,5,2); S(v.asa,x-13,y-11,2,2); S(v.asa,x+11,y-11,2,2); }
    else if(d.y<=0){ S(v.asa,x-5,y-11,10,9); S(v.asa2,x-4,y-10,2,7); }
  }
  if(v.cauda && d.y<=0) S(v.cauda,d.x>0?x-6:d.x<0?x+4:x-1,y-4,d.x?2:2,d.x?1:3);   // rabo do Calango
  if(v.lencoVoa && d.x) { S(v.lenco,d.x>0?x-7:x+4,y-11,3,1); S(v.lenco,d.x>0?x-9:x+7,y-10,2,1); }
  S(v.calca,x-3,y-4,2,f?3:4); S(v.calca,x+1,y-4,2,f?4:3);
  S(v.roupa,x-4,y-10,8,7); S(v.roupa2,x-3,y-9,2,5);
  if(v.saia) S(v.roupa,x-5,y-5,10,3);
  if(v.avental && d.y>=0){ S(v.avental,x-3,y-9,6,6); S(v.avental,x-3,y-10,1,1); S(v.avental,x+2,y-10,1,1); }
  const cy=v.saia?y-7:y-4; S(v.cinto,x-4,cy,8,1); S(v.fivela,x-1,cy,2,1);
  S(v.braco,x-5,y-9,1,5); S(v.braco,x+4,y-9,1,5); S(v.pele,x-5,y-4,1,1); S(v.pele,x+4,y-4,1,1);
  if(v.lenco) S(v.lenco,x-3,y-10,6,1);
  if(v.espinho){ for(const [ex,ey] of [[-5,-9],[4,-8],[-5,-6],[4,-5],[-1,-10],[2,-7]]) S(v.espinho,x+ex,y+ey,1,1); }
  if(v.terco && d.y>=0){ S(v.terco,x-2,y-10,1,1); S(v.terco,x-1,y-9,1,1); S(v.terco,x,y-8,1,2); S('#f1ece0',x,y-6,1,1); }
  S(v.pele,x-3,y-14,6,4);
  if(v.cabeca==='chapeu'){
    S(v.chapeu,x-6,y-14,12,2); S(v.chapeu2,x-4,y-17,8,3); S(v.enfeite,x-2,y-16,1,1); S(v.enfeite,x+1,y-16,1,1);
    if(v.estrela && d.y>=0){ S(v.enfeite,x-1,y-17,2,3); S(v.enfeite,x-2,y-16,4,1); }
    if(v.raio && d.y>=0){ S(v.enfeite,x,y-17,1,1); S(v.enfeite,x-1,y-16,2,1); S(v.enfeite,x-1,y-15,1,1); }   // raio no chapéu
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
  } else if(v.cabeca==='mascara'){                         // máscara de couro do Calango, com olhos de lente
    S(v.chapeu,x-3,y-15,6,5); S(v.chapeu2,x-2,y-16,4,1); S(v.enfeite,x-1,y-17,2,1);
    if(d.y>0){ S(v.olho,x-3,y-13,2,2); S(v.olho,x+1,y-13,2,2); S('#2a1a10',x-2,y-12,1,1); S('#2a1a10',x+2,y-12,1,1); }
    else if(d.y===0){ const ox=d.x<0?x-3:x+1; S(v.olho,ox,y-13,2,2); S('#2a1a10',d.x<0?ox:ox+1,y-12,1,1); }
    else S(v.chapeu2,x-2,y-14,4,3);
  } else if(v.cabeca==='flor'){                            // capacete de mandacaru com flor
    S(v.cabelo,x-4,y-13,1,4); S(v.cabelo,x+3,y-13,1,4);
    S(v.chapeu,x-4,y-16,8,3); S(v.chapeu2,x-3,y-16,2,2);
    S(v.espinho||'#e8d9b8',x-4,y-17,1,1); S(v.espinho||'#e8d9b8',x+3,y-17,1,1); S(v.espinho||'#e8d9b8',x,y-18,1,1);
    S(v.enfeite,x+1,y-18,2,2); S('#ffd23a',x+1,y-18,1,1);
    if(d.y<0) S(v.cabelo,x-3,y-13,6,3);
  } else if(v.cabeca==='bico'){                            // capuz de carcará: cara vermelha e bico amarelo
    S(v.chapeu,x-4,y-16,8,3); S(v.chapeu,x-4,y-13,1,3); S(v.chapeu,x+3,y-13,1,3); S(v.chapeu2,x-2,y-17,4,1);
    if(d.y<0) S(v.chapeu,x-3,y-13,6,3);
    else { S(v.face,x-3,y-13,6,2); if(d.y>0) S(v.enfeite,x-1,y-14,2,2); else S(v.enfeite,d.x<0?x-5:x+3,y-13,2,1); }
  } else if(v.cabeca==='veu'){
    S(v.chapeu,x-4,y-16,8,2);
    if(d.y<0) S(v.chapeu,x-4,y-14,8,5);
    else { S(v.chapeu,x-4,y-14,1,6); S(v.chapeu,x+3,y-14,1,6); }
  }
  if(v.cabeca!=='mascara'){                                // a máscara do Calango já tem os olhos dela
    if(d.y>0){ S('#2a1a10',x-2,y-12,1,1); S('#2a1a10',x+1,y-12,1,1); }
    else if(d.y===0){ S('#2a1a10',d.x<0?x-2:x+1,y-12,1,1); }
  }
  if(v.barba && d.y>=0){
    if(d.y>0){ S(v.barba,x-3,y-11,6,2); S(v.barba,x-2,y-9,4,1); }
    else S(v.barba,d.x<0?x-3:x-1,y-11,4,2);
  }
  if(d.y>=0 && whip) whip(hx,hy);
}

// avatar dos menus: um canvas 24x24 ampliado pelo CSS
function desenharAvatar(cnv,id,t,andando,sombra,chapeu){
  const g=cnv.getContext('2d'); g.imageSmoothingEnabled=false;
  g.clearRect(0,0,cnv.width,cnv.height);
  const giro=[{x:0,y:1},{x:1,y:0},{x:0,y:-1},{x:-1,y:0}], d=andando?giro[Math.floor(t/1.2)%4]:{x:0,y:1};
  noContexto(g,()=>{ tint=sombra?'#3a2a20':null; drawHeroi(PERSONAGENS[id],12,21,d,andando?Math.floor(t*7)%2:0,null,visualComChapeu(PERSONAGENS[id],chapeu)); tint=null; });
}
