'use strict';
/* ---------- ARMAS ----------
  Além do chicote:
  · Baladeira: o barqueiro Bené dá na fase 2. Atira pedrinhas de longe (1 de dano), com as mesmas regras dos chefes.
  · Tição: na Noite de São João, quem tem o tição da Fulozinha pode jogar até 3; o tição queima no chão e assusta
    o Lobisomem como uma fogueira. Recarrega encostando numa fogueira acesa.
  · Gibão de couro: o Vô Chico dá na fase 1. Segura o primeiro golpe de cada luta com chefe.
  Baladeira e gibão ficam no jogador (perfil.armas); os tições valem só na partida. */
const TICOES_MAX=3;
let pedras=[];          // o que o jogador atirou: {tipo:'pedra'|'ticao', x, y, vx, vy, t, chao}
const temArma=(pf,id)=>!!(pf && pf.armas && pf.armas[id]);
function ganharArma(id){
  if(temArma(perfil,id)) return;
  perfil.armas=Object.assign({},perfil.armas,{[id]:true}); salvarPerfis();
  sfx.libera(); toast(t('arma.ganhou',{arma:t('arma.'+id)}),3);
}
// jogadores que já passaram das fases antes das armas existirem ganham o que teriam ganhado
function armasDeQuemJaJogou(pf){
  const feita=id=>!!(pf.fases && pf.fases[id] && pf.fases[id].feita);
  if(feita(1) && !temArma(pf,'gibao')) pf.armas=Object.assign({},pf.armas,{gibao:true});
  if(feita(2) && !temArma(pf,'baladeira')) pf.armas=Object.assign({},pf.armas,{baladeira:true});
}

// o que sai ao apertar Arremessar: na noite, com tição na mão, o tição; senão, a pedra da baladeira
function armaDeArremesso(){
  if(!S0) return null;
  if(S0.ticao && fase.noite && (S0.ticoes??TICOES_MAX)>0) return 'ticao';
  if(temArma(perfil,'baladeira')) return 'pedra';
  return null;
}
let recargaTiro=0;
function arremessar(){
  const tipo=armaDeArremesso(); if(!tipo || recargaTiro>0) return;
  const d=p.dir, x=p.x+d.x*6, y=p.y-6+d.y*4;
  if(tipo==='pedra'){ pedras.push({tipo, x, y, vx:d.x*230, vy:d.y*230, t:.6}); recargaTiro=.5; sfx.whip(); }
  else {
    S0.ticoes=(S0.ticoes??TICOES_MAX)-1; recargaTiro=.8;
    pedras.push({tipo, x, y, vx:d.x*150, vy:d.y*150, t:.5, voo:.5}); sfx.fogo(); updateHud();
  }
}
// tições caídos no chão queimando: o Lobisomem foge deles como de uma fogueira
const fogosNoChao=()=>fogueirasAcesas().concat(pedras.filter(q=>q.tipo==='ticao' && q.chao));

function atualizarArmas(dt,hp){
  recargaTiro=Math.max(0,recargaTiro-dt);
  if(just.has('tiro')) arremessar();
  // perto de fogueira acesa, o tição volta a ter carga
  if(S0.ticao && fase.noite && (S0.ticoes??TICOES_MAX)<TICOES_MAX && fogueirasAcesas().some(f=>Math.hypot(f.x-p.x,f.y-p.y)<30)){
    S0.ticoes=TICOES_MAX; sfx.acender(); toast(t('arma.recarregou',{n:TICOES_MAX})); updateHud();
  }
  for(const q of pedras){
    q.t-=dt;
    if(q.tipo==='pedra' && q.t<=0){ burst(q.x,q.y,'#9a8c80',3,20); continue; }   // perdeu a força e caiu
    if(q.tipo==='ticao' && q.chao){ if(Math.random()<dt*14) parts.push({x:q.x+(Math.random()-.5)*6,y:q.y-6,vx:(Math.random()-.5)*8,vy:-18,t:.45,col:Math.random()<.5?'#ffd23a':'#ff8a1e',g:-8}); continue; }
    const nx=q.x+q.vx*dt, ny=q.y+q.vy*dt;
    if(tiroBate(nx,ny+6)){ if(q.tipo==='ticao') pousar(q); else { q.t=0; burst(q.x,q.y,'#9a8c80',4,30); } continue; }
    q.x=nx; q.y=ny;
    if(q.tipo==='ticao'){ q.voo-=dt; if(q.voo<=0) pousar(q); continue; }
    // pedra: acerta o primeiro inimigo ou chefe no caminho
    const caixa={x:q.x,y:q.y,w:5,h:5};
    const alvo=inimigos.find(c=>!c.dead && overlap(caixa,INIM[c.tipo].caixa(c)));
    if(alvo){ q.t=0; acertarComPedra(alvo); continue; }
    if(chefe && chefe.active && !chefe.dead && overlap(caixa,CHEFES[chefe.tipo].caixa(chefe))){ q.t=0; acertarChefe(chefe,1); }
  }
  pedras=pedras.filter(q=>q.t>0);
}
function pousar(q){ q.chao=true; q.t=5; q.vx=q.vy=0; q.y+=4; burst(q.x,q.y-4,'#ffd23a',8,40); sfx.acender(); }
function acertarComPedra(c){
  c.hp-=1; c.flash=.15; sfx.hit(); burst(c.x,c.y-4,'#9a8c80',5,40);
  if(c.hp<=0){
    c.dead=true; S0.kills++; S0.dead.push(c.i); aoVencerInimigo(); contarCriatura('inimigo',c.tipo);
    burst(c.x,c.y-4,'#3d3532',12,60);
  }
}
function drawArmas(){
  for(const q of pedras){
    const x=Math.round(q.x), y=Math.round(q.y);
    if(q.tipo==='pedra'){ S('#5b4f45',x-1,y-1,3,3); S('#9d8e7c',x-1,y-1,1,1); continue; }
    const alto=q.chao?0:Math.round(Math.sin(Math.max(0,q.voo)/.5*Math.PI)*8);   // arco do arremesso
    if(q.chao){ shadow(x,y+3,8); S('#4a2d18',x-4,y,8,2); }
    S('#6b4423',x-1,y-4-alto,2,5); const f=Math.floor(time*12)%2;
    S('#e8401a',x-2,y-7-alto,4,3); S(f?'#ffd23a':'#ff8a1e',x-1,y-8-alto-f,2,2);
  }
}
// luz dos tições na noite (js/jogo.js, desenharNoite)
const luzesDasArmas=()=>pedras.filter(q=>q.tipo==='ticao').map(q=>[q.x,q.y-6,q.chao?52:26,.9]);

// gibão de couro: segura o primeiro golpe de cada luta com chefe
function gibaoSegura(fx,fy){
  if(!temArma(perfil,'gibao') || S0.gibaoUsado || !chefe || !chefe.active || chefe.dead) return false;
  S0.gibaoUsado=true; p.inv=dif().invul;
  const dx=p.x-fx, dy=p.y-fy, d=Math.hypot(dx,dy)||1; p.kx=dx/d*140; p.ky=dy/d*140;
  sfx.clink(); burst(p.x,p.y-8,'#8a5a2e',10,50); shake=Math.max(shake,.12);
  toast(t('arma.gibaoSegurou')); updateHud();
  return true;
}
// o que aparece na bolsa do HUD
function bolsaDasArmas(){
  const out=[];
  if(S0.ticao && fase.noite) out.push(t('arma.ticoes',{n:S0.ticoes??TICOES_MAX, t:TICOES_MAX}));
  if(temArma(perfil,'gibao') && chefe && chefe.active && !chefe.dead) out.push(t(S0.gibaoUsado?'arma.gibaoRasgado':'arma.gibaoInteiro'));
  return out;
}
