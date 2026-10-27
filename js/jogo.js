'use strict';
/* ---------- ESTADO ---------- */
let fase=null, perfil=null, heroi=PERSONAGENS.ze;
let S0=null, p=null, npcs=[], inimigos=[], items=[], fires=[], balls=[], parts=[], chefe=null;
let running=false, paused=false, shake=0, time=0, freeze=0, autoT=3, avisoT=0, passoT=0, toastT=0;

function iniciarFase(id){
  fase=FASES[id-1];
  map=fase.mapa.map(r=>r.split('')); MH=map.length; MW=map[0].length; drawMap();
  const maxHp=heroi.vida+(perfil.bonusVida||0);
  S0=Object.assign({fase:id, stage:1, maxHp, hp:maxHp, kills:0, got:[], dead:[], chefeIntro:false, chefeVencido:false, won:false, saindo:false}, fase.estado());
  const sp=nearestFree(fase.spawn[0],fase.spawn[1]);
  p={x:sp.x, y:sp.y, w:10, h:8, dir:{x:0,y:-1}, anim:0, moving:false, whipT:0, whipCd:0, swing:0, inv:0, kx:0, ky:0, lama:0};
  npcs=fase.npcs.map(([type,tx,ty])=>{ const q=nearestFree(tx,ty); return npcNovo(type,q.x,q.y); });
  inimigos=fase.inimigos.map(([tipo,tx,ty,z],i)=>criarInimigo(tipo,tx,ty,fase.zonas[z],i));
  items=fase.itens.map(([type,tx,ty,id],k)=>Object.assign({type, id:id||'i'+k}, nearestFree(tx,ty)))
    .filter(it=>!(it.type==='cordel' && perfil.cordeis.includes(it.id)));
  chefe=fase.chefe?criarChefe(fase.chefe):null;
  fires=[]; balls=[]; parts=[]; time=0; shake=0; freeze=0; autoT=3; avisoT=0;
  updateHud();
}

/* ---------- PARTIDA SALVA (uma por jogador) ---------- */
function salvarPartida(){
  if(!perfil||!fase||!S0||S0.won||S0.saindo) return;
  let x=p.x, y=p.y; const r=fase.retorno;
  if(r && y<r.acima*T && !S0.chefeVencido){ x=r.x*T+8; y=r.y*T+8; }  // nunca reabre o jogo no meio da luta
  store.set(K_PARTIDA+perfil.id,{v:2, fase:fase.id, S:S0, time, x, y});
}
function partidaSalva(pf){ const d=store.get(K_PARTIDA+pf.id); return d && d.v===2 && FASES[d.fase-1] && d.S ? d : null; }
function carregarPartida(d){
  iniciarFase(d.fase);
  Object.assign(S0,d.S); S0.saindo=false; time=+d.time||0;
  S0.maxHp=heroi.vida+(perfil.bonusVida||0); S0.hp=clamp(Math.round(S0.hp)||1,1,S0.maxHp);
  if(Number.isFinite(d.x) && Number.isFinite(d.y) && !boxHits(d.x,d.y,p.w,p.h)){ p.x=d.x; p.y=d.y; }
  for(const i of S0.dead) if(inimigos[i]) inimigos[i].dead=true;
  items=items.filter(it=>!S0.got.includes(it.id));
  fase.restaurar();
  updateHud();
}

/* ---------- AÇÕES ---------- */
const hurtP=()=>({x:p.x,y:p.y-5,w:9,h:13});
function burst(x,y,col,n=8,sp=50){ for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, s=sp*(0.4+Math.random()); parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-10,t:0.4+Math.random()*0.3,col}); } }
function hurt(n,fx,fy){
  if(p.inv>0||S0.won) return;
  S0.hp-=n; p.inv=1.1; const dx=p.x-fx, dy=p.y-fy, d=Math.hypot(dx,dy)||1;
  p.kx=dx/d*170; p.ky=dy/d*170; shake=Math.max(shake,.15); freeze=Math.max(freeze,.05); sfx.hurt(); updateHud();
  if(prefs.vibrar!==false && navigator.vibrate) navigator.vibrate(70);
  if(S0.hp<=0){ S0.hp=0; updateHud(); desmaiar(); }
}
function respawn(){
  const sp=nearestFree(fase.spawn[0],fase.spawn[1]);
  S0.hp=S0.maxHp; p.x=sp.x; p.y=sp.y; p.inv=1; p.kx=p.ky=0; p.whipT=0; p.lama=0;
  fires=[]; balls=[];
  if(chefe && !chefe.dead){ const keep=chefe.lastSwing; chefe=criarChefe(fase.chefe); chefe.lastSwing=keep; }
  updateHud(); salvarPartida();
}
function golpearInimigo(c){
  c.lastSwing=p.swing; c.hp-=heroi.dano; c.flash=.15;
  const kd=Math.hypot(c.x-p.x,c.y-p.y)||1; c.kx=(c.x-p.x)/kd*160; c.ky=(c.y-p.y)/kd*160;
  sfx.hit(); burst(c.x,c.y-4,'#f1e2c2',5,40); freeze=.045;
  if(c.hp<=0){
    c.dead=true; S0.kills++; S0.dead.push(c.i);
    burst(c.x,c.y-4,'#3d3532',12,60); burst(c.x,c.y-4,'#c4462c',6,40);
    if(Math.random()<.4 && !c.voa) items.push({type:'rapadura',x:c.x,y:c.y});
  }
}
function nearbyNpc(){
  let best=null, bd=26;
  for(const n of npcs){ const d=Math.hypot(n.x-p.x,n.y-p.y); if(d<bd){bd=d;best=n;} }
  return best;
}
function ganharCordel(id){
  if(!perfil.cordeis.includes(id)){ perfil.cordeis.push(id); salvarPerfis(); }
  sfx.pagina(); lerCordel(id);
}
// marcas no chão: respingo na água, lama, faíscas na brasa
function pegadas(piso){
  const cor={w:'#cfe7f2', l:'#5a4228', b:'#ffb43a', j:'#9ab85a'}[piso]; if(!cor) return;
  for(let i=0;i<3;i++) parts.push({x:p.x+(Math.random()-.5)*8, y:p.y+3, vx:(Math.random()-.5)*30, vy:-15-Math.random()*20, t:.3, col:cor});
  if(piso==='w') sfx.agua();
}

/* ---------- ATUALIZAÇÃO ---------- */
function update(dt){
  if(toastT>0){ toastT-=dt; if(toastT<=0) elToast.hidden=true; elToast.classList.toggle('baixo',!!(chefe && chefe.active)); }  // na luta, longe do chefe
  if(!running) return;
  if(dlg.open){
    dlg.shown+=dt*55; renderDlg();
    if(just.has('whip')||just.has('talk')) advance();
    return;
  }
  if(freeze>0){ freeze-=dt; return; }
  time+=dt; shake=Math.max(0,shake-dt); avisoT=Math.max(0,avisoT-dt);
  autoT-=dt; if(autoT<=0){ autoT=3; salvarPartida(); }

  // jogador
  let dx=(segura('right')?1:0)-(segura('left')?1:0), dy=(segura('down')?1:0)-(segura('up')?1:0);
  p.moving = !!(dx||dy);
  if(p.moving){ const l=Math.hypot(dx,dy); dx/=l; dy/=l;
    if(p.whipT<=0){ if(Math.abs(dx)>=Math.abs(dy)) p.dir={x:Math.sign(dx),y:0}; else p.dir={x:0,y:Math.sign(dy)}; }
    p.anim+=dt;
  }
  const piso=chao(p), spd=(p.whipT>0?30:heroi.vel)*(VEL_TERRENO[piso]||1)*(p.lama>0?.6:1);
  moveEnt(p, dx*spd*dt + p.kx*dt, dy*spd*dt + p.ky*dt);
  const damp=Math.min(1,dt*9); p.kx-=p.kx*damp; p.ky-=p.ky*damp;
  p.inv=Math.max(0,p.inv-dt); p.whipCd-=dt; p.lama=Math.max(0,p.lama-dt);
  if(p.whipT>0) p.whipT-=dt;
  if(p.moving){ passoT-=dt; if(passoT<=0){ passoT=.2; pegadas(piso); } }
  if(p.lama>0 && Math.random()<dt*12) parts.push({x:p.x+(Math.random()-.5)*8,y:p.y-6,vx:0,vy:20,t:.3,col:'#5a4228'});
  if(piso==='b' && !heroi.imuneFogo) hurt(1,p.x-p.dir.x*8,p.y-p.dir.y*8);
  if(!running) return;

  if(just.has('whip') && p.whipCd<=0){ p.whipT=0.25; p.whipCd=heroi.recarga; p.swing++; sfx.whip(); }
  if(just.has('talk')){ const n=nearbyNpc(); if(n){ sfx.talk(); fase.falar(n); } }
  if(dlg.open) return;

  // chicote: a caixa de acerto cresce com o alcance do personagem
  let wb=null; const R=heroi.alcance;
  if(p.whipT>0){ const pr=1-p.whipT/0.25; if(pr>0.2 && pr<0.85){ const d=p.dir, hx=p.x+d.x*4, hy=p.y-3+d.y*2; wb={x:hx+d.x*R/2,y:hy+d.y*R/2,w:d.x?R:10,h:d.x?10:R}; } }

  fase.tick(dt);
  if(!running||dlg.open) return;

  const hp=hurtP();
  for(const c of inimigos){
    if(c.dead) continue;
    atualizarInimigo(c,dt);
    const cx=INIM[c.tipo].caixa(c);
    if(overlap(hp,cx)) hurt(1,c.x,c.y);
    if(wb && c.lastSwing!==p.swing && overlap(wb,cx)) golpearInimigo(c);
  }
  for(const n of npcs){
    if(n.type==='caipora'){ n.cool=Math.max(0,n.cool-dt);
      if(wb && n.lastSwing!==p.swing && overlap(wb,{x:n.x,y:n.y-8,w:14,h:18})){ n.lastSwing=p.swing;
        if(n.cool<=0){ n.cool=3; hurt(1,n.x,n.y); say(t('f1.caiporaBateu')); }
      }
    }
    if(n.type!=='avo' && n.type!=='moca') n.face = p.x>n.x?1:-1;
    if(n.type==='boi' && Math.hypot(n.x-p.x,n.y-p.y)<20) fase.falar(n);
  }
  if(chefe) CHEFES[chefe.tipo].update(chefe,dt,hp,wb);

  for(const f of fires){ f.t-=dt; if(f.t>0.3 && !heroi.imuneFogo && overlap(hp,{x:f.x,y:f.y,w:8,h:6})) hurt(1,f.x,f.y); }
  fires=fires.filter(f=>f.t>0);
  for(const b of balls){
    b.t-=dt; b.x+=b.vx*dt; b.y+=b.vy*dt;
    if(Math.random()<dt*25) parts.push({x:b.x,y:b.y,vx:-b.vx*.2,vy:-12,t:.25,col:b.tipo==='lama'?'#5a4228':'#ff8a1e'});
    if(b.t<=0 || tiroBate(b.x,b.y+6)){ b.t=0; burst(b.x,b.y,b.tipo==='lama'?'#5a4228':'#ff8a1e',4,30); }
    else if(overlap(hp,{x:b.x,y:b.y,w:6,h:6})){ b.t=0; if(b.tipo==='lama'){ p.lama=1.4; burst(p.x,p.y-6,'#5a4228',8,40); } hurt(1,b.x,b.y); }
  }
  balls=balls.filter(b=>b.t>0);

  for(const it of items){
    if(it.got || Math.hypot(it.x-p.x,it.y-p.y)>=12) continue;
    if(it.type==='rapadura'){ if(S0.hp>=S0.maxHp) continue; it.got=true; S0.hp++; sfx.pick(); toast(t('toast.rapadura')); }
    else if(it.type==='cordel'){ it.got=true; ganharCordel(it.id); }
    else if(fase.pegar(it)) it.got=true;
    else continue;
    if(it.id) S0.got.push(it.id);
    updateHud(); salvarPartida(); burst(it.x,it.y-4,'#ffd23a',8,40);
  }
  items=items.filter(i=>!i.got);

  for(const q of parts){ q.t-=dt; q.x+=q.vx*dt; q.y+=q.vy*dt; q.vy+=60*dt; }
  parts=parts.filter(q=>q.t>0);
}

/* ---------- DESENHO ---------- */
function drawWhip(hx,hy){
  if(p.whipT<=0) return;
  const d=p.dir, pr=1-p.whipT/0.25, len=3+(heroi.alcance-4)*Math.sin(pr*Math.PI), px=-d.y, py=d.x;
  for(let i=0;i<len;i++){ const w=Math.sin(i*0.45-pr*9)*1.6*(i/len); S('#c9a06a',hx+d.x*i+px*w,hy+d.y*i+py*w,1,1); }
  S('#fff1d0',hx+d.x*len-1,hy+d.y*len-1,2,2);
}
function drawJogador(){
  const x=Math.round(p.x), y=Math.round(p.y+p.h/2);
  if(p.inv>0 && Math.floor(p.inv*18)%2){ shadow(x,y,10); return; }
  drawHeroi(heroi,x,y,p.dir,p.moving?Math.floor(p.anim*9)%2:0,drawWhip);
  if(p.lama>0) S('#5a4228',x-3,y-15,6,2);
}
function drawBubble(n){
  const x=Math.round(n.x), y=Math.round(n.y+n.h/2-(NPC_BALAO[n.type]||22)-Math.abs(Math.sin(time*4))*1.5);
  S('#2a1a12',x-6,y-6,13,8); S('#f1e2c2',x-5,y-5,11,6); S('#f1e2c2',x-1,y+1,2,2);
  S('#2a1a12',x-3,y-3,1,1); S('#2a1a12',x,y-3,1,1); S('#2a1a12',x+3,y-3,1,1);
}
// seta na borda da tela apontando para o próximo objetivo
function drawArrow(cx,cy){
  const a=fase.alvo(); if(!a) return;
  const M=10, TOP=hudB, sx=a.x-cx, sy=a.y-cy;
  if(sx>M && sx<VW-M && sy>TOP && sy<VH-M) return;
  const ox=VW/2, oy=(TOP+VH-M)/2, dx=sx-ox, dy=sy-oy;
  const k=Math.min(dx>0?(VW-M-ox)/dx:dx<0?(M-ox)/dx:Infinity, dy>0?(VH-M-oy)/dy:dy<0?(TOP-oy)/dy:Infinity);
  ctx.save(); ctx.translate(Math.round(ox+dx*k),Math.round(oy+dy*k)); ctx.rotate(Math.atan2(dy,dx)); ctx.translate(calm?0:Math.sin(time*6)*1.5,0);
  ctx.beginPath(); ctx.moveTo(6,0); ctx.lineTo(-4,-5); ctx.lineTo(-2,0); ctx.lineTo(-4,5); ctx.closePath();
  ctx.lineWidth=2; ctx.strokeStyle='#2a1a12'; ctx.stroke(); ctx.fillStyle='#e9a83b'; ctx.fill();
  ctx.restore();
}
const vg=ctx.createRadialGradient(VW/2,VH/2,70,VW/2,VH/2,220);
vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(50,18,0,.38)');
const vgDor=ctx.createRadialGradient(VW/2,VH/2,60,VW/2,VH/2,210);
vgDor.addColorStop(0,'rgba(196,40,20,0)'); vgDor.addColorStop(1,'rgba(196,40,20,.5)');
function render(){
  if(!p||!fase) return;
  let cx=clamp(p.x-VW/2,0,MW*T-VW), cy=clamp(p.y-VH/2,0,MH*T-VH);
  if(shake>0 && !calm){ cx+=(Math.random()-.5)*6*shake/0.35; cy+=(Math.random()-.5)*6*shake/0.35; }
  cx=Math.round(clamp(cx,0,MW*T-VW)); cy=Math.round(clamp(cy,0,MH*T-VH));
  ctx.fillStyle='#000'; ctx.fillRect(0,0,VW,VH);
  ctx.drawImage(mapCv,cx,cy,VW,VH,0,0,VW,VH);
  ctx.save(); ctx.translate(-cx,-cy);
  animarTerreno(cx,cy,time);
  for(const f of fires) drawFire(f);
  if(chefe && chefe.tipo==='mula' && chefe.active && chefe.state==='wind'){  // aviso da investida
    const dx=p.x-chefe.x, dy=p.y-chefe.y, d=Math.hypot(dx,dy)||1;
    for(let i=14;i<Math.min(d,90);i+=6) S('rgba(232,64,26,.6)',chefe.x+dx/d*i-1,chefe.y+dy/d*i-1,2,2);
  }
  const list=[];
  for(const it of items) list.push([it.y,()=>drawItem(it)]);
  const desenha=fn=>contraste?()=>comContorno(fn):fn;
  for(const c of inimigos) if(!c.dead) list.push([c.y,desenha(()=>INIM[c.tipo].draw(c))]);
  for(const n of npcs) list.push([n.y,()=>NPC_DRAW[n.type](n)]);
  if(chefe && CHEFES[chefe.tipo].visivel(chefe)) list.push([chefe.y,desenha(()=>CHEFES[chefe.tipo].draw(chefe))]);
  list.push([p.y,drawJogador]);
  list.sort((a,b)=>a[0]-b[0]); for(const [,fn] of list) fn();
  for(const b of balls) drawBall(b);
  for(const q of parts){ S(q.col,q.x,q.y,q.t>0.25?2:1,q.t>0.25?2:1); }
  if(running && !dlg.open){ const n=nearbyNpc(); if(n) drawBubble(n); }
  ctx.restore();
  if(fase.tom){ ctx.fillStyle=fase.tom(); ctx.fillRect(0,0,VW,VH); }
  ctx.fillStyle=vg; ctx.fillRect(0,0,VW,VH);
  if(S0.hp===1 && !S0.won){ ctx.globalAlpha=calm?.6:.55+.45*Math.sin(time*5); ctx.fillStyle=vgDor; ctx.fillRect(0,0,VW,VH); ctx.globalAlpha=1; }
  if(running && !dlg.open && mostrarSeta) drawArrow(cx,cy);
}
