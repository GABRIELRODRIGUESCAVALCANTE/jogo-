'use strict';
const $=id=>document.getElementById(id);
function el(tag,cls,txt){ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; }

/* ---------- HUD ---------- */
const elVida=$('vida'), elObj=$('objetivo'), elBolsa=$('bolsa'), elChefe=$('chefe'), elChefeNome=$('chefeNome'), elChefeVida=$('chefeVida'), elToast=$('toast');
const HEART='<svg viewBox="0 0 7 6" aria-hidden="true"><path class="__C__" d="M1 0h2v1h1V0h2v1h1v2h-1v1h-1v1h-1v1h-1V5H2V4H1V3H0V1h1z"/></svg>';
const achados=f=>cordeisDaFase(f).filter(id=>perfil.cordeis.includes(id)).length;
function updateHud(){
  if(!S0) return;
  let h=''; for(let i=0;i<S0.maxHp;i++) h+=HEART.replace('__C__', i<S0.hp?'cheio':'vazio');
  elVida.innerHTML=h; elVida.setAttribute('aria-label',`Vida: ${S0.hp} de ${S0.maxHp}`);
  elObj.textContent=fase.objetivo(S0)||'';
  const n=achados(fase);
  elBolsa.innerHTML=fase.bolsa(S0).concat(n?[`Cordéis ${n}/${cordeisDaFase(fase).length}`]:[]).map(t=>`<span>${t}</span>`).join('');
  const on=!!chefe && chefe.active && !chefe.dead; elChefe.hidden=!on;
  if(on){
    elChefeNome.textContent=chefe.nome;
    let v=''; for(let i=0;i<chefe.max;i++) v+=`<i${i<chefe.hp?'':' class="vazio"'}></i>`;
    elChefeVida.innerHTML=v; elChefeVida.setAttribute('aria-label',`Vida: ${chefe.hp} de ${chefe.max}`);
  }
  measureHud();
}
function setStage(s){ S0.stage=s; updateHud(); salvarPartida(); }
function toast(msg,dur=2.6){ elToast.textContent=msg; elToast.hidden=false; toastT=dur; }
let hudB=34;  // base do HUD em pixels do canvas: a seta de objetivo fica sempre abaixo dele
function measureHud(){
  const r=cv.getBoundingClientRect(); if(!r.width) return;
  hudB=Math.max(20,Math.min(VH/2,Math.ceil((document.querySelector('.hud').getBoundingClientRect().bottom-r.top)*VW/r.width)+8));
}
addEventListener('resize',measureHud);
if(document.fonts) document.fonts.ready.then(measureHud);

/* ---------- DIÁLOGO ---------- */
const elDlg=$('dialogo'), elQuem=$('quem'), elFala=$('fala'), elSeta=$('seta');
const dlg={open:false,lines:[],i:0,shown:0,last:-1,end:null};
function say(lines,end){ dlg.open=true; dlg.lines=lines; dlg.i=0; dlg.shown=0; dlg.last=-1; dlg.end=end||null; elDlg.hidden=false; renderDlg(); }
function renderDlg(){
  const [n,t]=dlg.lines[dlg.i]; const k=Math.min(t.length,Math.floor(dlg.shown));
  if(k===dlg.last) return; dlg.last=k;
  elQuem.textContent=n; elFala.textContent=t.slice(0,k); elSeta.hidden = k<t.length;
}
function advance(){
  const t=dlg.lines[dlg.i][1];
  if(dlg.shown<t.length){ dlg.shown=t.length; }
  else { dlg.i++; dlg.shown=0; dlg.last=-1;
    if(dlg.i>=dlg.lines.length){ dlg.open=false; elDlg.hidden=true; const e=dlg.end; dlg.end=null; if(e) e(); return; }
    sfx.talk();
  }
  renderDlg();
}
function fecharDialogo(){ dlg.open=false; dlg.end=null; elDlg.hidden=true; }
elDlg.addEventListener('click',()=>{ if(dlg.open) advance(); });
function lerCordel(id){
  const [titulo,v]=CORDEIS[id], quem=`Cordel: ${titulo}`, total=cordeisDaFase(fase).length, n=achados(fase);
  say([[quem,v[0]+'\n'+v[1]],[quem,v[2]+'\n'+v[3]],[quem,v[4]+'\n'+v[5]]],
    ()=>toast(n<total ? `Cordéis desta fase: ${n} de ${total}` : perfil.cordeis.length>=Object.keys(CORDEIS).length ? 'Você achou todos os nove cordéis!' : 'Todos os cordéis desta fase!'));
}

/* ---------- ENTRADA ---------- */
const held=new Set(), just=new Set(), toque={}, pad={};
const segura=k=>held.has(k)||toque[k]||pad[k];
const KEYMAP={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',Space:'whip',KeyJ:'whip',KeyZ:'whip',KeyE:'talk',Enter:'talk',KeyK:'talk',KeyX:'talk',Escape:'pause',KeyP:'pause'};
addEventListener('keydown',e=>{
  if(telaAtual!=='telaJogo'){ if(e.code==='Escape' && VOLTAR[telaAtual]){ e.preventDefault(); VOLTAR[telaAtual](); } return; }
  const k=KEYMAP[e.code]; if(!k) return;
  if(k==='pause'){ if(running||paused){ e.preventDefault(); if(!e.repeat) togglePause(); } return; }
  if(!running) return;
  e.preventDefault();
  if(!held.has(k)) just.add(k);
  held.add(k);
});
addEventListener('keyup',e=>{ const k=KEYMAP[e.code]; if(k) held.delete(k); });
addEventListener('blur',()=>{ held.clear(); pause(); });
document.addEventListener('visibilitychange',()=>{ if(document.hidden) pause(); });
addEventListener('pagehide',()=>{ if(running) salvarPartida(); });
addEventListener('pointerdown',initAudio); addEventListener('keydown',initAudio);

// direcional de toque: o dedo pode deslizar entre as setas e as diagonais funcionam
const elDpad=document.querySelector('.dpad'), DIRS=['left','right','up','down'];
let dpadId=null;
function dpadSet(st){ for(const k of DIRS){ toque[k]=!!st[k]; elDpad.querySelector('.'+k).classList.toggle('on',!!st[k]); } }
function dpadMove(e){
  const r=elDpad.getBoundingClientRect(), dx=e.clientX-r.left-r.width/2, dy=e.clientY-r.top-r.height/2;
  if(Math.hypot(dx,dy)<r.width*.1) return dpadSet({});
  const sec=(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8;  // 0 direita, 2 baixo, 4 esquerda, 6 cima
  dpadSet({right:sec===7||sec<=1, down:sec>=1&&sec<=3, left:sec>=3&&sec<=5, up:sec>=5&&sec<=7});
}
elDpad.addEventListener('pointerdown',e=>{ e.preventDefault(); dpadId=e.pointerId; try{ elDpad.setPointerCapture(e.pointerId); }catch(_){} dpadMove(e); });
elDpad.addEventListener('pointermove',e=>{ if(e.pointerId===dpadId) dpadMove(e); });
for(const ev of ['pointerup','pointercancel','lostpointercapture']) elDpad.addEventListener(ev,e=>{ if(e.pointerId===dpadId){ dpadId=null; dpadSet({}); } });
elDpad.addEventListener('contextmenu',e=>e.preventDefault());
document.querySelectorAll('.acoes .tecla').forEach(b=>{
  const k=b.dataset.k;
  b.addEventListener('pointerdown',e=>{ e.preventDefault(); if(running) just.add(k); b.classList.add('on'); });
  const up=()=>b.classList.remove('on');
  b.addEventListener('pointerup',up); b.addEventListener('pointercancel',up); b.addEventListener('pointerleave',up);
  b.addEventListener('contextmenu',e=>e.preventDefault());
});
cv.addEventListener('pointerdown',()=>{ if(running && dlg.open) advance(); });

// controle: analógico ou direcional, A/X chicote, B/Y falar, Start pausa; nos menus o direcional anda entre os botões
let padAntes={};
function readPad(){
  let gp=null; if(navigator.getGamepads) for(const g of navigator.getGamepads()) if(g&&g.connected){ gp=g; break; }
  const b=i=>!!(gp&&gp.buttons[i]&&gp.buttons[i].pressed), ax=gp?gp.axes[0]||0:0, ay=gp?gp.axes[1]||0:0;
  const st={left:ax<-.45||b(14), right:ax>.45||b(15), up:ay<-.45||b(12), down:ay>.45||b(13), whip:b(0)||b(2), talk:b(1)||b(3), pause:b(9)};
  const jogo=telaAtual==='telaJogo';
  for(const k in st){
    if(st[k] && !padAntes[k]){
      if(!jogo) menuPad(k);
      else if(k==='pause') togglePause();
      else if(running) just.add(k);
      else if(k==='whip'){ const o=[...document.querySelectorAll('.overlay')].find(o=>!o.hidden), bt=o&&o.querySelector('.btn:not([hidden])'); if(bt) bt.click(); }
    }
    pad[k]=jogo && st[k];
  }
  padAntes=st;
}
function menuPad(k){
  const lista=[...document.querySelectorAll(`#${telaAtual} button, #${telaAtual} input`)].filter(b=>!b.disabled && b.offsetParent!==null);
  if(!lista.length) return;
  const i=lista.indexOf(document.activeElement);
  if(k==='left'||k==='up') lista[(i<=0?lista.length:i)-1].focus();
  else if(k==='right'||k==='down') lista[(i+1)%lista.length].focus();
  else if(k==='whip') (i>=0?lista[i]:lista[0]).click();
  else if(k==='talk' && VOLTAR[telaAtual]) VOLTAR[telaAtual]();
}

/* ---------- TELAS ---------- */
const TELAS=['telaPerfis','telaNovo','telaMenu','telaPersonagem','telaFases','telaJogo'];
let telaAtual='telaPerfis';
const VOLTAR={telaNovo:()=>{ if(perfis.lista.length) abrirPerfis(); }, telaMenu:()=>abrirPerfis(), telaPersonagem:()=>abrirMenu(), telaFases:()=>abrirMenu()};
function mostrar(id){
  for(const t of TELAS) $(t).hidden = t!==id;
  telaAtual=id; held.clear(); dpadSet({});
  const qj=$('quemJoga'); qj.hidden=!perfil || id==='telaPerfis' || id==='telaNovo';
  if(perfil){ qj.textContent='Jogando como '; qj.append(el('b','',perfil.nome),` · ${heroi.nome}`); }
  if(id==='telaJogo'){ measureHud(); $('frame').scrollIntoView({block:'nearest'}); }
  else { const h=$(id).querySelector('h2'); if(h) h.focus({preventScroll:true}); scrollTo({top:0}); }
}
function avatarCanvas(id){ const c=el('canvas','avatar'); c.width=24; c.height=24; c.dataset.pers=id; c.setAttribute('aria-hidden','true'); return c; }
function animarAvatares(t){
  for(const c of document.querySelectorAll('canvas[data-pers]')){
    if(c.offsetParent===null) continue;
    const anda=c.dataset.anda==='1' || (c.closest('.pers') && c.closest('.pers').getAttribute('aria-pressed')==='true');
    desenharAvatar(c,c.dataset.pers,t,anda,c.dataset.trava==='1');
  }
}

/* ---------- JOGADORES ---------- */
// "login" local: cada jogador guarda personagem, fases, recordes e cordéis neste navegador
let perfis={lista:[], ultimo:null};
function carregarPerfis(){
  const d=store.get(K_PERFIS);
  if(d && Array.isArray(d.lista)) perfis={lista:d.lista.filter(x=>x && x.id && x.nome), ultimo:d.ultimo||null};
  for(const pf of perfis.lista){
    pf.fases=pf.fases||{}; pf.cordeis=Array.isArray(pf.cordeis)?pf.cordeis:[];
    if(!PERSONAGENS[pf.personagem] || !liberado(pf.personagem,pf)) pf.personagem='ze';
  }
}
function salvarPerfis(){ store.set(K_PERFIS,{v:1, lista:perfis.lista, ultimo:perfis.ultimo}); }
function novoPerfil(nome,pers){
  const pf={id:'j'+Date.now().toString(36)+Math.random().toString(36).slice(2,6), nome, personagem:pers, criado:Date.now(), fases:{}, cordeis:[], bonusVida:0, fim:false};
  perfis.lista.push(pf); salvarPerfis(); return pf;
}
function apagarPerfil(id){
  perfis.lista=perfis.lista.filter(x=>x.id!==id); store.del(K_PARTIDA+id);
  if(perfis.ultimo===id) perfis.ultimo=null;
  if(perfil && perfil.id===id) perfil=null;
  salvarPerfis();
}
const feitas=pf=>FASES.filter(f=>pf.fases[f.id] && pf.fases[f.id].feita).length;
const resumoPerfil=pf=>(pf.fim?'Jornada completa':`Fase ${Math.min(feitas(pf)+1,FASES.length)} de ${FASES.length}`)+` · ${pf.cordeis.length}/${Object.keys(CORDEIS).length} cordéis`;
function abrirPerfis(){ renderPerfis(); mostrar('telaPerfis'); }
function renderPerfis(){
  const box=$('listaPerfis'); box.textContent='';
  const ordem=[...perfis.lista].sort((a,b)=>(b.id===perfis.ultimo)-(a.id===perfis.ultimo));
  for(const pf of ordem){
    const card=el('div','perfil'), entrar=el('button','perfil-entrar'), txt=el('span','perfil-txt'), pe=el('div','perfil-pe');
    entrar.type='button';
    txt.append(el('span','perfil-nome',pf.nome), el('span','perfil-info',`${PERSONAGENS[pf.personagem].nome} · ${resumoPerfil(pf)}`));
    entrar.append(avatarCanvas(pf.personagem),txt);
    entrar.addEventListener('click',()=>{ sfx.clique(); entrarComo(pf); });
    const apagar=el('button','link','Apagar'); apagar.type='button'; apagar.setAttribute('aria-label',`Apagar o jogador ${pf.nome}`);
    apagar.addEventListener('click',()=>confirmarApagar(pf,pe));
    pe.append(apagar); card.append(entrar,pe); box.append(card);
  }
  const cheio=perfis.lista.length>=8; $('btnNovoPerfil').hidden=cheio; $('limitePerfis').hidden=!cheio;
}
function confirmarApagar(pf,pe){
  pe.textContent='';
  const sim=el('button','link perigo','Sim, apagar'), nao=el('button','link','Não');
  sim.type=nao.type='button';
  sim.addEventListener('click',()=>{ apagarPerfil(pf.id); if(perfis.lista.length){ renderPerfis(); $('tPerfis').focus(); } else abrirNovo(); });
  nao.addEventListener('click',()=>{ renderPerfis(); });
  pe.append(el('p','',`Apagar ${pf.nome} e todo o progresso?`),sim,nao); nao.focus();
}
function entrarComo(pf){ perfil=pf; heroi=PERSONAGENS[pf.personagem]; perfis.ultimo=pf.id; salvarPerfis(); abrirMenu(); }

let escolhaNovo='ze';
function abrirNovo(){
  $('nomeNovo').value=''; $('erroNovo').hidden=true; escolhaNovo='ze';
  renderEscolha($('escolhaNovo'),null,escolhaNovo,id=>{ escolhaNovo=id; });
  $('btnCancelarNovo').hidden=!perfis.lista.length;
  mostrar('telaNovo'); $('nomeNovo').focus();
}
$('formNovo').addEventListener('submit',e=>{
  e.preventDefault();
  const nome=$('nomeNovo').value.trim().replace(/\s+/g,' '), erroEl=$('erroNovo');
  const erro=!nome ? 'Escreva um nome para o jogador.' : perfis.lista.some(x=>x.nome.toLowerCase()===nome.toLowerCase()) ? 'Já existe um jogador com esse nome.' : '';
  if(erro){ erroEl.textContent=erro; erroEl.hidden=false; $('nomeNovo').setAttribute('aria-invalid','true'); $('nomeNovo').focus(); return; }
  $('nomeNovo').removeAttribute('aria-invalid'); sfx.libera();
  entrarComo(novoPerfil(nome,escolhaNovo));
});
$('btnNovoPerfil').addEventListener('click',abrirNovo);
$('btnCancelarNovo').addEventListener('click',abrirPerfis);

/* ---------- PERSONAGENS ---------- */
function statsEl(ch){
  const dl=el('dl','stats');
  for(const [nome,v] of Object.entries(pontos(ch))){
    const n=clamp(v,1,5), dd=el('dd'); dd.setAttribute('aria-label',`${n} de 5`);
    for(let i=0;i<5;i++) dd.append(el('i',i<n?'on':''));
    dl.append(el('dt','',nome),dd);
  }
  return dl;
}
function renderEscolha(box,pf,sel,onPick){
  box.textContent='';
  for(const id of PERS_ORDEM){
    const ch=PERSONAGENS[id], livre=liberado(id,pf), b=el('button','pers'), av=avatarCanvas(id);
    b.type='button'; b.dataset.id=id; b.setAttribute('aria-pressed',String(id===sel));
    if(!livre){ b.setAttribute('aria-disabled','true'); av.dataset.trava='1'; }
    b.append(av, el('span','pers-nome',ch.nome), el('span','pers-titulo',ch.titulo), el('span','pers-desc',ch.desc), statsEl(ch));
    if(!livre) b.append(el('span','pers-trava',ch.liberar));
    else if(id===sel) b.append(el('span','pers-selo','Escolhido'));
    b.addEventListener('click',()=>{ if(!liberado(id,pf)) return; sfx.clique(); onPick(id); renderEscolha(box,pf,id,onPick); box.querySelector(`[data-id="${id}"]`).focus(); });
    box.append(b);
  }
}
function abrirPersonagens(){
  renderEscolha($('listaPersonagens'),perfil,perfil.personagem,id=>{ perfil.personagem=id; heroi=PERSONAGENS[id]; salvarPerfis(); });
  mostrar('telaPersonagem');
}

/* ---------- MENU DO JOGADOR ---------- */
function proximaFase(pf){ const f=FASES.find(f=>!(pf.fases[f.id] && pf.fases[f.id].feita)); return f?f.id:0; }
function abrirMenu(){
  paused=false; running=false; fecharOverlays();
  $('nomeMenu').textContent=perfil.nome;
  $('persMenu').textContent=`${heroi.nome}, ${heroi.titulo}`;
  const av=$('avatarMenu'); av.dataset.pers=perfil.personagem; av.dataset.anda='1';
  const total=FASES.filter(f=>perfil.fases[f.id] && perfil.fases[f.id].tempo>0).reduce((s,f)=>s+perfil.fases[f.id].tempo,0);
  $('resumoMenu').innerHTML=`<li>Fases <b>${feitas(perfil)}/${FASES.length}</b></li><li>Cordéis <b>${perfil.cordeis.length}/${Object.keys(CORDEIS).length}</b></li>`
    +`<li>Corações <b>${heroi.vida+(perfil.bonusVida||0)}</b></li>`+(perfil.fim?`<li>Melhor jornada <b>${fmt(total)}</b></li>`:'');
  const d=partidaSalva(perfil), n=proximaFase(perfil), bj=$('btnJogar');
  if(d) bj.innerHTML=`Continuar<small>Fase ${d.fase} · ${FASES[d.fase-1].nome}</small>`;
  else if(n) bj.innerHTML=`Jogar<small>Fase ${n} · ${FASES[n-1].nome}</small>`;
  else bj.innerHTML='Jogar de novo<small>Escolha a fase</small>';
  mostrar('telaMenu');
}
$('btnJogar').addEventListener('click',()=>{ sfx.clique(); const d=partidaSalva(perfil), n=proximaFase(perfil); if(d) continuar(d); else if(n) jogarFase(n); else abrirFases(); });
$('btnFases').addEventListener('click',()=>{ sfx.clique(); abrirFases(); });
$('btnPersonagem').addEventListener('click',()=>{ sfx.clique(); abrirPersonagens(); });
$('btnTrocar').addEventListener('click',()=>{ sfx.clique(); abrirPerfis(); });
$('btnVoltarPers').addEventListener('click',abrirMenu);
$('btnVoltarFases').addEventListener('click',abrirMenu);

/* ---------- FASES ---------- */
const miniCache={};
function abrirFases(){
  const box=$('listaFases'), d=partidaSalva(perfil); box.textContent='';
  for(const f of FASES){
    const livre=f.id===1 || !!(perfil.fases[f.id-1] && perfil.fases[f.id-1].feita), reg=perfil.fases[f.id]||{};
    const card=el('div','fase'+(livre?'':' bloqueada')), corpo=el('div','fase-corpo'), bt=el('div','fase-botoes');
    if(!miniCache[f.id]){ miniCache[f.id]=document.createElement('canvas'); miniatura(f,miniCache[f.id]); }
    const cnv=document.createElement('canvas'); cnv.width=miniCache[f.id].width; cnv.height=miniCache[f.id].height; cnv.setAttribute('aria-hidden','true');
    cnv.getContext('2d').drawImage(miniCache[f.id],0,0);
    corpo.append(el('p','eyebrow',`Fase ${f.id}`), el('h3','',f.nome), el('p','',f.resumo));
    if(reg.feita) corpo.append(el('span','selo-feita','Concluída'));
    corpo.append(el('p','fase-info', livre ? `Recorde ${reg.tempo>0?fmt(reg.tempo):'—'} · Cordéis ${achados(f)}/${cordeisDaFase(f).length}` : `Vença a fase ${f.id-1} para liberar`));
    const botao=(txt,cls,fn)=>{ const b=el('button',cls,txt); b.type='button'; b.addEventListener('click',()=>{ sfx.clique(); fn(); }); bt.append(b); return b; };
    if(!livre) botao('Bloqueada','btn',()=>{}).disabled=true;
    else if(d && d.fase===f.id){ botao('Continuar','btn',()=>continuar(d)); botao('Recomeçar','btn sec',()=>jogarFase(f.id)); }
    else botao('Jogar','btn',()=>jogarFase(f.id));
    corpo.append(bt); card.append(cnv,corpo); box.append(card);
  }
  $('avisoFases').textContent = d ? `Você tem uma partida salva na fase ${d.fase}. Começar outra fase descarta essa partida.` : 'Vença uma fase para liberar a seguinte.';
  mostrar('telaFases');
}

/* ---------- PARTIDA ---------- */
const btnPausa=$('btnPausa');
function fecharOverlays(){ for(const id of ['ovTitulo','ovPausa','ovDesmaio','ovFim']) $(id).hidden=true; fecharDialogo(); elToast.hidden=true; toastT=0; btnPausa.textContent='Pausar'; }
function jogarFase(id){
  store.del(K_PARTIDA+perfil.id);
  iniciarFase(id); fecharOverlays(); running=false; paused=false;
  $('tituloFase').textContent=`Fase ${id} de ${FASES.length}`;
  $('tituloNome').textContent=fase.nome; $('tituloResumo').textContent=fase.resumo;
  mostrar('telaJogo'); $('ovTitulo').hidden=false; $('btnComecarFase').focus();
}
$('btnComecarFase').addEventListener('click',()=>{ initAudio(); $('ovTitulo').hidden=true; running=true; held.clear(); say(fase.intro()); });
function continuar(d){
  try{ carregarPartida(d); }catch(e){ jogarFase(d.fase); return; }
  fecharOverlays(); paused=false; mostrar('telaJogo'); running=true;
  toast(`Partida retomada. Bom caminho, ${heroi.nome}!`);
}
function pause(){
  if(!running) return;
  running=false; paused=true; held.clear(); salvarPartida();
  $('textoPausa').textContent=`${heroi.nome} sentou na sombra de um juazeiro pra tomar fôlego. A partida fica salva neste navegador.`;
  $('ovPausa').hidden=false; btnPausa.textContent='Continuar'; $('btnVoltar').focus();
}
function unpause(){ if(!paused) return; paused=false; $('ovPausa').hidden=true; running=true; held.clear(); btnPausa.textContent='Pausar'; }
function togglePause(){ paused?unpause():pause(); }
btnPausa.addEventListener('click',togglePause);
$('btnVoltar').addEventListener('click',unpause);
$('btnReiniciar').addEventListener('click',()=>jogarFase(fase.id));
$('btnSairMenu').addEventListener('click',()=>{ salvarPartida(); abrirMenu(); });

function desmaiar(){
  running=false; held.clear();
  $('textoDesmaio').textContent=`${heroi.nome} desmaiou na poeira e acordou no começo do caminho. O que você conquistou nesta fase continua com você.`;
  $('ovDesmaio').hidden=false; $('btnLevantar').focus();
}
$('btnLevantar').addEventListener('click',()=>{
  respawn(); $('ovDesmaio').hidden=true; running=true; held.clear();
  say(fase.id===1 ? [['Vô Chico',`Acorda, ${heroi.nome}! Bebe um gole d’água e volta pra estrada.`]] : [[heroi.nome,'Ufa... Um gole d’água e bora de novo.']]);
});

const FIM_TEXTO={1:'A Caipora abriu o espinheiro. Adiante corre o Velho Chico.', 2:"A ponte está de pé e o Caboclo d'água voltou para o fundo do poço. Lá em cima, a Serra do Fogo."};
function concluirFase(){
  running=false; S0.won=true; sfx.win(); elToast.hidden=true; toastT=0;
  const reg=perfil.fases[fase.id]||{}, novo=!(reg.tempo>0) || time<reg.tempo, ultima=fase.id===FASES.length, primeiraVez=ultima && !perfil.fim;
  perfil.fases[fase.id]={feita:true, tempo:novo?time:reg.tempo};
  if(ultima) perfil.fim=true;
  perfis.ultimo=perfil.id; salvarPerfis(); store.del(K_PARTIDA+perfil.id);
  const total=cordeisDaFase(fase).length, n=achados(fase), falta=total-n;
  $('fimFase').textContent=`Fase ${fase.id} · ${fase.nome}`;
  $('fimTitulo').textContent=ultima?'Ê boi! O Estrela voltou':'Fase concluída!';
  $('fimTexto').textContent=(ultima?`${heroi.nome} desceu a serra tocando o boi, e o sertão inteiro cantou essa história em cordel.`:FIM_TEXTO[fase.id])
    +(primeiraVez?' Nova personagem liberada: Rosa, a rezadeira!':'');
  $('fimTempo').textContent=fmt(time); $('fimInimigos').textContent=S0.kills; $('fimCordeis').textContent=`${n}/${total}`;
  $('fimRecorde').textContent=(novo?'Novo recorde nesta fase!':`Recorde: ${fmt(perfil.fases[fase.id].tempo)}`)
    +(falta ? ` · ${falta===1?'Ficou 1 folheto':`Ficaram ${falta} folhetos`} de cordel pelo caminho.` : ' · Todos os cordéis desta fase!');
  $('btnProxima').hidden=ultima;
  $('ovFim').hidden=false; (ultima?$('btnMenuFim'):$('btnProxima')).focus();
  if(primeiraVez) setTimeout(()=>sfx.libera(),900);
}
$('btnProxima').addEventListener('click',()=>jogarFase(fase.id+1));
$('btnMenuFim').addEventListener('click',abrirMenu);

/* ---------- SOM ---------- */
function musicaDesejada(){
  if(telaAtual!=='telaJogo') return 'sertao';
  if(!running) return null;
  return chefe && chefe.active && !chefe.dead ? 'chefe' : fase.musica;
}
const btnSom=$('btnSom'), btnMusica=$('btnMusica');
const prefs=store.get(K_PREF)||{};
muted=prefs.efeitos===false; mus.on=prefs.musica!==false;
function labelSound(){
  btnSom.textContent=`Efeitos: ${muted?'desligados':'ligados'}`; btnSom.setAttribute('aria-pressed',String(!muted));
  btnMusica.textContent=`Música: ${mus.on?'ligada':'desligada'}`; btnMusica.setAttribute('aria-pressed',String(mus.on));
  store.set(K_PREF,{efeitos:!muted, musica:mus.on});
}
btnSom.addEventListener('click',()=>{ muted=!muted; labelSound(); });
btnMusica.addEventListener('click',()=>{ mus.on=!mus.on; labelSound(); });

/* ---------- LAÇO ---------- */
let last=performance.now();
function frame(now){
  const dt=Math.min(0.05,(now-last)/1000); last=now;
  readPad();
  if(telaAtual==='telaJogo'){ update(dt); render(); } else animarAvatares(now/1000);
  musTick(); just.clear();
  requestAnimationFrame(frame);
}

/* ---------- APP (PWA) ---------- */
// funciona sem internet e pode ser instalado na tela inicial
if('serviceWorker' in navigator && location.protocol.startsWith('http')) addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
let pedidoInstalar=null;
addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); pedidoInstalar=e; $('btnInstalar').hidden=false; });
addEventListener('appinstalled',()=>{ pedidoInstalar=null; $('btnInstalar').hidden=true; });
$('btnInstalar').addEventListener('click',async()=>{ if(!pedidoInstalar) return; pedidoInstalar.prompt(); await pedidoInstalar.userChoice.catch(()=>{}); pedidoInstalar=null; $('btnInstalar').hidden=true; });

carregarPerfis(); labelSound();
if(perfis.lista.length) abrirPerfis(); else abrirNovo();
requestAnimationFrame(frame);
