'use strict';
/* ---------- NPCs ---------- */
const NPC_TAM={avo:[10,8], caipora:[14,8], barqueiro:[10,8], moca:[10,8], boi:[18,8]};
const npcNovo=(type,x,y)=>({type, x, y, w:NPC_TAM[type][0], h:NPC_TAM[type][1], face:1, cool:0, lastSwing:-1});

function drawCaipora(n){
  const x=Math.round(n.x), y=Math.round(n.y+n.h/2), F=flip(x,y,n.face), b=Math.round(Math.sin(time*3)*0.8);
  shadow(x,y,14);
  F('#33251b',-6,-2,2,2); F('#33251b',3,-2,2,2);
  F('#4a3628',-7,-7,13,6); F('#5e4636',-6,-7,10,2); F('#2a1c14',-4,-8,7,1);
  F('#4a3628',5,-8,4,5); F('#7a5a48',8,-6,2,2); F('#f1e2c2',8,-4,1,1); F('#1a0e08',6,-7,1,1);
  const R=(c,ox,oy,w,h)=>F(c,ox,oy+b,w,h);
  R('#5d8a3a',-3,-10,7,3); R('#a8693f',-2,-14,5,5); R('#6b4a2b',4,-19,1,12);
  R('#a8693f',-2,-18,5,4); R('#1a0e08',1,-17,1,1);
  const hc=['#e0552a','#f07a2e','#c93a1e'];
  for(let i=0;i<7;i++){ const hgt=2+Math.floor((Math.sin(time*8+i*1.7)+1)*1.3); R(hc[i%3],-3+i,-18-hgt,1,hgt); }
  R('#e0552a',-3,-19,7,2); R('#e0552a',-3,-17,1,3);
}
function drawAvo(n){
  const x=Math.round(n.x), y=Math.round(n.y+n.h/2);
  shadow(x,y,10);
  S('#5a4a3a',x-3,y-4,2,4); S('#5a4a3a',x+1,y-4,2,4);
  S('#c9b48a',x-4,y-10,8,7); S('#a8946a',x-4,y-4,8,1);
  S('#6b4a2b',x+5,y-9,1,9); S('#c68a5a',x+4,y-8,2,1);
  S('#b98055',x-3,y-14,6,4); S('#f1ece0',x-3,y-11,6,3); S('#f1ece0',x-2,y-8,4,1);
  S('#2a1a10',x-2,y-13,1,1); S('#2a1a10',x+1,y-13,1,1);
  S('#7a6a55',x-6,y-15,12,2); S('#8a7a62',x-4,y-18,8,3);
}
function drawBarqueiro(n){
  const x=Math.round(n.x), y=Math.round(n.y+n.h/2), F=flip(x,y,n.face);
  shadow(x,y,10);
  F('#7a5a3a',6,-21,1,21); F('#5a3a22',6,-22,1,1);
  S('#2e4a6a',x-3,y-4,2,4); S('#2e4a6a',x+1,y-4,2,4);
  S('#e8e0d0',x-4,y-10,8,7); S('#a8a090',x-4,y-8,8,1); S('#a8a090',x-4,y-6,8,1);
  S('#8a5a3a',x-5,y-9,1,5); F('#8a5a3a',4,-9,2,1); F('#8a5a3a',5,-10,1,2);
  S('#8a5a3a',x-3,y-14,6,4); S('#2a1a10',x-2,y-13,1,1); S('#2a1a10',x+1,y-13,1,1); S('#e8e0d0',x-2,y-11,4,1);
  S('#d8b86a',x-6,y-15,12,2); S('#c8a85a',x-4,y-17,8,2); S('#8a3a22',x-4,y-15,8,1);
}
function drawMoca(n){
  const x=Math.round(n.x), y=Math.round(n.y+n.h/2);
  shadow(x,y,10);
  S('#c2405a',x-5,y-4,10,3); S('#c2405a',x-4,y-10,8,7); S('#e06a80',x-3,y-9,2,4);
  S('#2a1a12',x-4,y-16,8,3); S('#2a1a12',x-4,y-14,1,7); S('#2a1a12',x+3,y-14,1,7);
  S('#b07850',x-3,y-14,6,4); S('#2a1a10',x-2,y-12,1,1); S('#2a1a10',x+1,y-12,1,1);
  S('#e9a83b',x+2,y-16,2,1);
}
function drawBoi(n){
  const x=Math.round(n.x), y=Math.round(n.y+n.h/2), F=flip(x,y,n.face), b=Math.floor(time*2)%2;
  shadow(x,y,20);
  F('#d8cfc0',-9,-4,2,4); F('#d8cfc0',-5,-4,2,4); F('#d8cfc0',2,-4,2,4); F('#d8cfc0',5,-4,2,4);
  F('#efe6d6',-10,-13,18,9); F('#2a2220',-7,-12,4,3); F('#2a2220',0,-10,3,3); F('#2a2220',-3,-7,2,2);
  F('#efe6d6',-12,-12,2,1); F('#2a2220',-13,-11,1,4);
  F('#c4462c',6,-17,1,5); F('#3a78a0',5,-16,1,5); F('#e9a83b',4,-15,1,5);
  F('#efe6d6',7,-16+b,6,7); F('#e0b0a0',11,-12+b,3,3); F('#2a1a10',10,-14+b,1,1);
  F('#d8cbb0',7,-18+b,1,2); F('#d8cbb0',12,-18+b,1,2);
  F('#ffd23a',9,-16+b,1,3); F('#ffd23a',8,-15+b,3,1);
}
const NPC_DRAW={avo:drawAvo, caipora:drawCaipora, barqueiro:drawBarqueiro, moca:drawMoca, boi:drawBoi};
const NPC_BALAO={avo:22, caipora:28, barqueiro:24, moca:22, boi:24};

/* ---------- INIMIGOS ---------- */
function moverInimigo(c,dx,dy){
  const z=c.zona; let hit=false;
  if(dx){ const nx=c.x+dx; if(nx<z.x0||nx>z.x1||(!c.voa && boxHits(nx,c.y,c.w,c.h))) hit=true; else c.x=nx; }
  if(dy){ const ny=c.y+dy; if(ny<z.y0||ny>z.y1||(!c.voa && boxHits(c.x,ny,c.w,c.h))) hit=true; else c.y=ny; }
  return hit;
}
function vagar(c,dt,vel){
  c.t-=dt;
  if(c.t<=0){ c.t=1+Math.random()*2; if(Math.random()<.35){ c.wx=0; c.wy=0; } else { const a=Math.random()*Math.PI*2; c.wx=Math.cos(a)*vel; c.wy=Math.sin(a)*vel; } }
}
const INIM={
  cabra:{w:10, h:6, hp:2, caixa:c=>({x:c.x,y:c.y-3,w:14,h:10}),
    novo(c){ c.t=Math.random()*2; c.wx=c.wy=0; c.puff=Math.random()*2; },
    update(c,dt){
      c.puff-=dt;
      const dx=p.x-c.x, dy=p.y-c.y, d=Math.hypot(dx,dy)||1, k=velTerreno(c);
      c.chase=d<92;
      if(c.chase && c.puff<=0){ c.puff=1.2+Math.random(); for(let i=0;i<4;i++) parts.push({x:c.x+c.face*9,y:c.y-7,vx:c.face*(30+Math.random()*30),vy:-5+Math.random()*10,t:.35,col:i%2?'#ffb43a':'#e8401a'}); }
      if(c.chase) return [dx/d*44*k, dy/d*44*k];
      vagar(c,dt,18); return [c.wx*k, c.wy*k];
    },
    bateu(c){ c.wx=-c.wx; c.wy=-c.wy; },
    draw:drawCabra},
  jacare:{w:16, h:6, hp:3, caixa:c=>({x:c.x,y:c.y-2,w:20,h:8}),
    novo(c){ c.estado='anda'; c.t=Math.random()*2; c.cd=1; c.wx=c.wy=0; },
    update(c,dt){
      c.cd=Math.max(0,c.cd-dt);
      const dx=p.x-c.x, dy=p.y-c.y, d=Math.hypot(dx,dy)||1, k=velTerreno(c);
      if(c.estado==='mira'){ c.t-=dt; c.face=dx>=0?1:-1; if(c.t<=0){ c.estado='bote'; c.t=.32; c.bx=dx/d*155; c.by=dy/d*155; sfx.bote(); } return [0,0]; }
      if(c.estado==='bote'){ c.t-=dt; if(c.t<=0){ c.estado='anda'; c.cd=1.5; } return [c.bx,c.by]; }
      if(d<58 && c.cd<=0){ c.estado='mira'; c.t=.45; return [0,0]; }
      if(d<120) return [dx/d*16*k, dy/d*16*k];
      vagar(c,dt,10); return [c.wx*k, c.wy*k];
    },
    bateu(c){ if(c.estado==='bote'){ c.estado='anda'; c.cd=1.5; } else { c.wx=-c.wx; c.wy=-c.wy; } },
    draw:drawJacare},
  morcego:{w:8, h:6, hp:1, voa:true, caixa:c=>({x:c.x,y:c.y-9,w:12,h:8}),
    novo(c){ c.hx=c.x; c.hy=c.y; c.vx=c.vy=0; },
    update(c,dt){
      const dx=p.x-c.x, dy=p.y-c.y, d=Math.hypot(dx,dy)||1;
      let ax, ay;
      if(d<100){ ax=dx/d*58+Math.cos(c.anim*5)*40; ay=dy/d*58+Math.sin(c.anim*7)*40; }
      else { ax=(c.hx+Math.cos(c.anim*1.3)*24-c.x)*2; ay=(c.hy+Math.sin(c.anim*1.9)*14-c.y)*2; }
      const k=Math.min(1,dt*3); c.vx+=(ax-c.vx)*k; c.vy+=(ay-c.vy)*k;
      return [c.vx, c.vy];
    },
    draw:drawMorcego},
};
function criarInimigo(tipo,tx,ty,z,i){
  const k=INIM[tipo], q=nearestFree(tx,ty);
  const c={i, tipo, x:q.x, y:q.y, w:k.w, h:k.h, hp:k.hp, voa:!!k.voa, kx:0, ky:0, face:i%2?1:-1, flash:0, anim:Math.random()*5, lastSwing:-1, dead:false, moving:false,
    zona:{x0:z[0]*T+8, y0:z[1]*T+8, x1:z[2]*T+8, y1:z[3]*T+8}};
  k.novo(c); return c;
}
function atualizarInimigo(c,dt){
  const k=INIM[c.tipo];
  c.flash=Math.max(0,c.flash-dt); c.anim+=dt;
  let [vx,vy]=k.update(c,dt);
  vx+=c.kx; vy+=c.ky; const dm=Math.min(1,dt*8); c.kx-=c.kx*dm; c.ky-=c.ky*dm;
  if(Math.abs(vx)>3) c.face=Math.sign(vx);
  c.moving=Math.hypot(vx,vy)>3;
  if(moverInimigo(c,vx*dt,vy*dt) && k.bateu) k.bateu(c);
}
function drawCabra(c){
  const x=Math.round(c.x), y=Math.round(c.y+c.h/2), bob=c.moving?Math.abs(Math.sin(c.anim*12))*1.5:0;
  shadow(x,y,12);
  tint = c.flash>0 ? '#ffffff' : null;
  const F=flip(x,y-bob,c.face), lf=c.moving?Math.floor(c.anim*10)%2:0;
  F('#2a2422',-5,-3,1,3-lf); F('#2a2422',-2,-3,1,2+lf); F('#2a2422',2,-3,1,3-lf); F('#2a2422',4,-3,1,2+lf);
  F('#3d3532',-6,-9,11,6); F('#57504b',-5,-9,8,2); F('#3d3532',-7,-9,1,2);
  F('#3d3532',4,-12,5,5); F('#2a2422',8,-10,2,3); F('#57504b',7,-7,1,2);
  F('#d8cbb0',4,-14,1,2); F('#d8cbb0',3,-15,1,1); F('#d8cbb0',2,-15,1,2); F('#d8cbb0',6,-14,1,2); F('#d8cbb0',5,-15,1,1);
  F(c.chase?'#ffd23a':'#ff5a2a',6,-11,1,1);
  tint=null;
}
function drawJacare(c){
  const x=Math.round(c.x), y=Math.round(c.y+c.h/2), F=flip(x,y,c.face), boca=c.estado!=='anda', lf=c.moving?Math.floor(c.anim*8)%2:0;
  shadow(x,y,22);
  tint = c.flash>0 ? '#ffffff' : (c.estado==='mira' && Math.floor(c.anim*20)%2 ? '#c8d070' : null);
  F('#33421c',-6,-2,2,2-lf); F('#33421c',-1,-2,2,1+lf); F('#33421c',4,-2,2,2-lf);
  F('#4a5a2a',-12,-4,5,2); F('#4a5a2a',-15,-3,3,1);
  F('#4a5a2a',-8,-6,14,4); F('#3a4820',-7,-7,12,1);
  for(let i=-6;i<5;i+=3) F('#2a3616',i,-8,1,1);
  F('#c8b860',-6,-3,11,1);
  F('#4a5a2a',6,-5,7,2); F('#ffd23a',7,-7,1,1); F('#3a4820',6,-6,3,1);
  if(boca){ F('#4a5a2a',6,-10,7,2); F('#c4462c',7,-8,6,2); F('#f1e2c2',8,-8,1,1); F('#f1e2c2',11,-8,1,1); F('#f1e2c2',9,-7,1,1); }
  else F('#4a5a2a',6,-7,7,2);
  tint=null;
}
function drawMorcego(c){
  const x=Math.round(c.x), y=Math.round(c.y+c.h/2), by=y-12+Math.round(Math.sin(c.anim*3)*2), up=Math.floor(c.anim*12)%2;
  shadow(x,y,6);
  tint = c.flash>0 ? '#ffffff' : null;
  S('#3a2a3a',x-2,by-2,4,4); S('#3a2a3a',x-2,by-3,1,1); S('#3a2a3a',x+1,by-3,1,1);
  S('#ff5a2a',x-1,by-1,1,1); S('#ff5a2a',x+1,by-1,1,1);
  if(up){ S('#5a3a5a',x-7,by-4,5,2); S('#5a3a5a',x+2,by-4,5,2); S('#5a3a5a',x-8,by-5,2,1); S('#5a3a5a',x+6,by-5,2,1); }
  else { S('#5a3a5a',x-7,by,5,2); S('#5a3a5a',x+2,by,5,2); S('#5a3a5a',x-8,by+2,2,1); S('#5a3a5a',x+6,by+2,2,1); }
  tint=null;
}

/* ---------- CHEFES ---------- */
// Mula sem Cabeça: investe, bate na pedra, fica tonta; na fúria solta anéis de fogo
function atualizaMula(m,dt,hp,wb){
  m.anim+=dt; m.flash=Math.max(0,m.flash-dt);
  if(!m.active||m.dead) return;
  const ARENA_Y=11*T+6;
  if(m.state==='idle'){
    m.t-=dt; m.dir=p.x>m.x?1:-1;
    const dx=p.x-m.x, dy=p.y-m.y, d=Math.hypot(dx,dy)||1;
    moveEnt(m,dx/d*22*dt,dy/d*22*dt); if(m.y>ARENA_Y) m.y=ARENA_Y;
    if(m.t<=0){ m.state='wind'; m.t=m.furia?0.42:0.55; }
  } else if(m.state==='wind'){
    m.t-=dt; m.dir=p.x>m.x?1:-1;
    if(m.t<=0){ const dx=p.x-m.x, dy=p.y-m.y, d=Math.hypot(dx,dy)||1, spd=170+(6-m.hp)*14; m.vx=dx/d*spd; m.vy=dy/d*spd; m.state='charge'; m.t=1.6; m.fireT=0; }
  } else if(m.state==='charge'){
    m.t-=dt; m.fireT-=dt; m.dir=m.vx>=0?1:-1;
    if(m.fireT<=0){ m.fireT=0.05; fires.push({x:m.x-m.dir*8,y:m.y+2,t:2.4,s:Math.random()*6}); }
    let hit=moveEnt(m,m.vx*dt,m.vy*dt);
    if(m.y>ARENA_Y){ m.y=ARENA_Y; hit=true; }
    if(hit){ m.state='stun'; m.t=2.2; shake=.35; sfx.crash(); burst(m.x+m.dir*10,m.y-6,'#7c6c5c',10,60); }
    else if(m.t<=0){ m.state='idle'; m.t=0.9; }
  } else if(m.state==='stun'){
    m.t-=dt; if(m.t<=0){ m.state='idle'; m.t=0.9; if(m.furia) anelDeFogo(m); }
  }
  const cx=CHEFES.mula.caixa(m);
  if(m.state!=='stun' && overlap(hp,cx)) hurt(1,m.x,m.y);
  if(wb && m.lastSwing!==p.swing && overlap(wb,cx)){
    m.lastSwing=p.swing;
    if(m.state==='stun'){
      m.hp=Math.max(0,m.hp-heroi.dano); m.flash=.2; sfx.hit(); shake=Math.max(shake,.1); freeze=.08; burst(m.x,m.y-8,'#ffd23a',6,50); updateHud();
      if(m.hp<=0) fase.vencerChefe();
      else if(!m.furia && m.hp<=3){ m.furia=true; toast(t('toast.mulaFuria'),3.4); }
    }
    else { sfx.clink(); burst(m.x,m.y-8,'#9aa0a8',4,40); }
  }
}
function anelDeFogo(m){
  const n=m.hp<=1?12:8, a0=Math.random()*Math.PI;
  for(let i=0;i<n;i++){ const a=a0+i*Math.PI*2/n; balls.push({tipo:'fogo',x:m.x,y:m.y-6,vx:Math.cos(a)*68,vy:Math.sin(a)*68,t:4}); }
  sfx.fogo(); shake=Math.max(shake,.12);
}
function drawMula(m){
  const x=Math.round(m.x), y=Math.round(m.y+m.h/2), F=flip(x,y,m.dir);
  shadow(x,y,26);
  const run=m.state==='charge', lf=run?Math.floor(m.anim*16)%2:Math.floor(m.anim*3)%2*(m.state==='wind'?1:0);
  const aviso=m.state==='wind' || (m.state==='stun' && m.furia && m.t<.6);  // investida ou anel de fogo chegando
  if(m.flash>0) tint='#ffffff'; else if(aviso && Math.floor(m.anim*20)%2) tint='#ff7a50';
  F('#3a2618',-10,-5,2,5-lf); F('#3a2618',-6,-5,2,4+lf); F('#3a2618',4,-5,2,5-lf); F('#3a2618',8,-5,2,4+lf);
  F('#5b3a24',-11,-14,21,9); F('#73492d',-10,-14,17,2); F('#4a2e1c',-9,-7,17,2);
  F('#8a2a1e',-4,-15,7,4); F('#e9a83b',-4,-11,7,1);
  F('#1e140e',-13,-13,2,1); F('#1e140e',-14,-12,1,5);
  F('#5b3a24',9,-17,4,7); F('#9aa0a8',11,-12,2,2); F('#c8ccd2',11,-12,1,1);
  tint=null;
  if(m.state!=='stun'){
    for(let i=0;i<6;i++){ const h=4+(m.furia?3:0)+Math.floor((Math.sin(m.anim*14+i*2.1)+1)*3); F(i%2?'#ff8a1e':'#ffd23a',8+(i%5),-17-h,1+(i===2?1:0),h); }
    F('#e8401a',8,-19,6,2);
  } else {
    F('#6a6058',9,-19,4,2);
    for(let k=0;k<3;k++){ const a=m.anim*5+k*2.09; S('#ffd23a',x+Math.cos(a)*10-1,y-26+Math.sin(a)*3,2,2); }
  }
}

// Caboclo d'água: nada escondido no poço, sobe perto de quem está na margem e atira lama
function pocos(z){
  const out=[];
  for(let ty=z[1];ty<=z[3];ty++) for(let tx=z[0];tx<=z[2];tx++){
    if(tileAt(tx,ty)!=='W') continue;
    if([[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>!SOLID.has(tileAt(tx+a,ty+b)))) out.push({x:tx*T+8,y:ty*T+8});
  }
  return out;
}
function escolherPoco(c){
  const lista=c.spots.filter(s=>s.x!==c.x||s.y!==c.y).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
  return lista[Math.floor(Math.random()*Math.min(3,lista.length))]||c.spots[0];
}
function atualizaCaboclo(c,dt,hp,wb){
  c.anim+=dt; c.flash=Math.max(0,c.flash-dt);
  if(!c.active||c.dead) return;
  if(c.estado==='fundo'){
    if(!c.alvo) c.alvo=escolherPoco(c);
    const dx=c.alvo.x-c.x, dy=c.alvo.y-c.y, d=Math.hypot(dx,dy), v=90*dt;
    if(d>v){ c.x+=dx/d*v; c.y+=dy/d*v; } else { c.x=c.alvo.x; c.y=c.alvo.y; }
    c.t-=dt;
    if(c.t<=0 && d<=v){ c.estado='sobe'; c.t=.45; sfx.agua(); burst(c.x,c.y,'#cfe7f2',6,30); }
  } else if(c.estado==='sobe'){
    c.t-=dt; if(c.t<=0){ c.estado='fora'; c.t=c.hp<=2?2.2:1.9; c.tiros=0; }
  } else if(c.estado==='fora'){
    c.t-=dt; c.face=p.x>c.x?1:-1;
    const quando=c.hp<=2?[1.8,1.2,.6]:[1.4,.7];
    if(c.tiros<quando.length && c.t<quando[c.tiros]){ c.tiros++; c.braco=.25;
      const dx=p.x-c.x, dy=p.y-5-(c.y-10), d=Math.hypot(dx,dy)||1;
      balls.push({tipo:'lama',x:c.x,y:c.y-10,vx:dx/d*80,vy:dy/d*80,t:3}); sfx.lama(); }
    c.braco=Math.max(0,(c.braco||0)-dt);
    if(c.t<=0){ c.estado='desce'; c.t=.3; }
  } else if(c.estado==='desce'){
    c.t-=dt; if(c.t<=0){ c.estado='fundo'; c.t=.9+Math.random()*.8; c.alvo=null; }
  }
  const cx=CHEFES.caboclo.caixa(c);
  if(c.estado!=='fora') return;
  if(overlap(hp,cx)) hurt(1,c.x,c.y);
  if(wb && c.lastSwing!==p.swing && overlap(wb,cx)){
    c.lastSwing=p.swing; c.hp=Math.max(0,c.hp-heroi.dano); c.flash=.2; sfx.hit(); freeze=.08; shake=Math.max(shake,.1);
    burst(c.x,c.y-12,'#cfe7f2',8,50); updateHud();
    if(c.hp<=0) fase.vencerChefe(); else { c.estado='desce'; c.t=.25; }
  }
}
function drawCaboclo(c){
  const x=Math.round(c.x), y=Math.round(c.y+4);
  if(c.estado==='fundo'){
    const r=3+Math.floor((c.anim*5)%4);
    S('rgba(20,40,30,.35)',x-5,y-4,10,5);
    S('#8cc4d8',x-r,y-3,r*2,1); S('#8cc4d8',x-r-2,y-2,2,1); S('#8cc4d8',x+r,y-2,2,1); S('#8cc4d8',x-r,y-1,r*2,1);
    return;
  }
  const k=c.estado==='sobe'?1-c.t/.45:c.estado==='desce'?c.t/.3:1, oy=Math.round(18*(1-k)), F=flip(x,y+oy,c.face);
  dc.save(); dc.beginPath(); dc.rect(x-16,y-40,32,40); dc.clip();
  if(c.flash>0) tint='#ffffff';
  F('#3e5a3a',-5,-10,10,10); F('#4e6e48',-4,-9,3,8); F('#5a8a3a',-3,-5,2,1); F('#5a8a3a',2,-7,2,1);
  F('#3e5a3a',-4,-17,8,7); F('#1e2a1a',-5,-18,10,3); F('#1e2a1a',-5,-15,2,7); F('#1e2a1a',3,-15,2,7);
  F('#f1e2c2',-3,-14,2,1); F('#f1e2c2',1,-14,2,1); F('#c4462c',-2,-14,1,1); F('#c4462c',2,-14,1,1); F('#1a0e08',-2,-12,4,1);
  F('#3e5a3a',-7,-9,2,6);
  if(c.braco>0) F('#3e5a3a',5,-19,2,8); else F('#3e5a3a',5,-9,2,6);
  tint=null; dc.restore();
  S('#cfe7f2',x-7,y,14,1); S('#8cc4d8',x-9,y+1,18,1);
}
const CHEFES={
  mula:{get nome(){ return t('chefe.mula'); },
    criar:()=>({tipo:'mula', x:24*T+8, y:5*T+8, w:22, h:10, hp:6, max:6, state:'idle', t:1.5, dir:-1, vx:0, vy:0, fireT:0, flash:0, anim:0, active:false, dead:false, lastSwing:-1, furia:false}),
    caixa:m=>({x:m.x,y:m.y-5,w:24,h:14}), update:atualizaMula, draw:drawMula, visivel:m=>!m.dead},
  caboclo:{get nome(){ return t('chefe.caboclo'); },
    criar:def=>{ const spots=pocos(def.zona), s=spots[0]; return {tipo:'caboclo', x:s.x, y:s.y, w:14, h:8, hp:4, max:4, estado:'fundo', t:1, alvo:null, spots, active:false, dead:false, lastSwing:-1, flash:0, anim:0, tiros:0, braco:0, face:1}; },
    caixa:c=>({x:c.x,y:c.y-8,w:16,h:18}), update:atualizaCaboclo, draw:drawCaboclo, visivel:c=>c.active&&!c.dead},
};
const criarChefe=def=>CHEFES[def.tipo].criar(def);

/* ---------- ITENS, FOGO E TIROS ---------- */
function drawItem(it){
  const x=Math.round(it.x), y=Math.round(it.y+3), b=Math.round(Math.sin(time*4+x)*1);
  shadow(x,y,9);
  if(it.type==='fumo'){ S('#5a3418',x-5,y-7+b,10,6); S('#7d4a24',x-5,y-6+b,10,1); S('#7d4a24',x-5,y-4+b,10,1); S('#3d220f',x-6,y-6+b,1,4); S('#3d220f',x+5,y-6+b,1,4);
    if(Math.floor(time*3)%3===0) S('#fff1d0',x+3,y-10+b,1,1); }
  else if(it.type==='cordel'){ S('#2a1a12',x-4,y-10+b,8,9); S('#f1e2c2',x-3,y-9+b,6,7); S('#c4462c',x-2,y-8+b,4,3); S('#2a1a12',x-1,y-7+b,2,1); S('#8a7a62',x-2,y-4+b,4,1); S('#8a7a62',x-2,y-3+b,3,1);
    if(Math.floor(time*2+x)%4===0) S('#fff1d0',x+4,y-11+b,1,1); }
  else if(it.type==='tabua'){ S('#5e3a1e',x-7,y-6+b,14,4); S('#9a6a3a',x-7,y-7+b,14,3); S('#b8834a',x-5,y-7+b,4,1); S('#5e3a1e',x-1,y-6+b,1,2); S('#3a2416',x+4,y-6+b,1,1);
    if(Math.floor(time*2+x)%4===0) S('#fff1d0',x+6,y-10+b,1,1); }
  else { S('#9c5a24',x-4,y-6+b,8,5); S('#c27a3a',x-3,y-6+b,6,1); S('#6e3c14',x-4,y-2+b,8,1); }
}
function drawFire(f){
  const a=Math.min(1,f.t/0.6), h=Math.max(1,Math.round((3+Math.sin(time*20+f.s)*2)*a+1));
  const x=Math.round(f.x), y=Math.round(f.y+3);
  S('#e8401a',x-3,y-h,6,h); S('#ff8a1e',x-2,y-h-1,4,h); S('#ffd23a',x-1,y-h,2,Math.max(1,h-2));
}
function drawBall(b){
  const x=Math.round(b.x), y=Math.round(b.y), f=Math.floor(time*20+x)%2;
  shadow(x,y+7,4);
  if(b.tipo==='lama'){ S('#3e2c1a',x-3,y-2,6,4); S('#3e2c1a',x-2,y-3,4,6); S('#5a4228',x-2,y-2,4,4); S('#86663f',x-1,y-2,2,1); return; }
  S('#e8401a',x-3,y-2,6,4); S('#e8401a',x-2,y-3,4,6); S(f?'#ffd23a':'#ff8a1e',x-2,y-2,4,4); S('#fff1d0',x-1,y-1,2,2);
}
