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
  elVida.innerHTML=h; elVida.setAttribute('aria-label',t('hud.vida',{n:S0.hp,t:S0.maxHp}));
  elObj.textContent=fase.objetivo(S0)||'';
  const n=achados(fase);
  elBolsa.innerHTML=fase.bolsa(S0).concat(n?[t('hud.cordeis',{n,t:cordeisDaFase(fase).length})]:[]).map(t=>`<span>${t}</span>`).join('');
  const on=!!chefe && chefe.active && !chefe.dead; elChefe.hidden=!on;
  if(on){
    elChefeNome.textContent=CHEFES[chefe.tipo].nome;
    let v=''; for(let i=0;i<chefe.max;i++) v+=`<i${i<chefe.hp?'':' class="vazio"'}></i>`;
    elChefeVida.innerHTML=v; elChefeVida.setAttribute('aria-label',t('hud.vida',{n:chefe.hp,t:chefe.max}));
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
  const [titulo,v]=cordel(id), quem=t('cordel.quem',{titulo}), total=cordeisDaFase(fase).length, n=achados(fase);
  say([[quem,v[0]+'\n'+v[1]],[quem,v[2]+'\n'+v[3]],[quem,v[4]+'\n'+v[5]]],
    ()=>toast(n<total ? t('cordel.daFase',{n,t:total}) : perfil.cordeis.length>=CORDEIS_IDS.length ? t('cordel.todos',{t:CORDEIS_IDS.length}) : t('cordel.todosFase')));
}

/* ---------- ENTRADA ---------- */
const held=new Set(), just=new Set(), toque={}, pad={};
const segura=k=>held.has(k)||toque[k]||pad[k];
let KEYMAP={};   // tecla → ação, montado por montarTeclas() a partir das teclas padrão e das escolhidas nas Opções
addEventListener('keydown',e=>{
  if(ouvindo){ e.preventDefault(); gravarTecla(e.code); return; }
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
const TELAS=['telaPerfis','telaNovo','telaMenu','telaPersonagem','telaFases','telaOpcoes','telaConquistas','telaRanking','telaCena','telaConta','telaJogo'];
let telaAtual='telaPerfis';
const VOLTAR={telaNovo:()=>{ if(perfis.lista.length) abrirPerfis(); }, telaMenu:()=>abrirPerfis(), telaPersonagem:()=>abrirMenu(), telaFases:()=>abrirMenu(), telaConquistas:()=>abrirMenu(), telaRanking:()=>abrirMenu(), telaCena:()=>$('btnCenaSeguir').click(), telaOpcoes:()=>voltarDeOpcoes(), telaConta:()=>$('btnVoltarConta').click()};
function mostrar(id){
  for(const t of TELAS) $(t).hidden = t!==id;
  telaAtual=id; held.clear(); dpadSet({});
  const qj=$('quemJoga'); qj.hidden=!perfil || id==='telaPerfis' || id==='telaNovo';
  if(perfil){ qj.textContent=t('quemJoga')+' '; qj.append(el('b','',perfil.nome),` · ${heroi.nome}`); }
  if(id==='telaJogo'){ measureHud(); $('frame').scrollIntoView({block:'nearest'}); }
  else { const h=$(id).querySelector('h2'); if(h) h.focus({preventScroll:true}); scrollTo({top:0}); }
}
function avatarCanvas(id){ const c=el('canvas','avatar'); c.width=24; c.height=24; c.dataset.pers=id; c.setAttribute('aria-hidden','true'); return c; }
function animarAvatares(t){
  for(const c of document.querySelectorAll('canvas[data-pers]')){
    if(c.offsetParent===null) continue;
    const anda=c.dataset.anda==='1' || (c.closest('.pers') && c.closest('.pers').getAttribute('aria-pressed')==='true');
    desenharAvatar(c,c.dataset.pers,t,anda,c.dataset.trava==='1',c.dataset.chapeu);
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
    if(!DIFICULDADES[pf.dificuldade]) pf.dificuldade='normal';
    if(!PERSONAGENS[pf.personagem] || !liberado(pf.personagem,pf)) pf.personagem='ze';
  }
}
function salvarPerfis(semSync){ store.set(K_PERFIS,{v:1, lista:perfis.lista, ultimo:perfis.ultimo}); if(!semSync) agendarSync(); }
function novoPerfil(nome,pers,dificuldade='normal'){
  const pf={id:'j'+Date.now().toString(36)+Math.random().toString(36).slice(2,6), nome, personagem:pers, dificuldade, criado:Date.now(), fases:{}, cordeis:[], bonusVida:0, fim:false};
  perfis.lista.push(pf); salvarPerfis(); return pf;
}
function apagarPerfil(id){
  perfis.lista=perfis.lista.filter(x=>x.id!==id); store.del(K_PARTIDA+id);
  if(perfis.ultimo===id) perfis.ultimo=null;
  if(perfil && perfil.id===id) perfil=null;
  if(sessoes[id]){ delete sessoes[id]; salvarSessoes(); }   // a conta online continua existindo; só deixa de estar ligada aqui
  salvarPerfis();
}
const feitas=pf=>FASES.filter(f=>pf.fases[f.id] && pf.fases[f.id].feita).length;
const resumoPerfil=pf=>(pf.fim?t('perfis.completa'):t('perfis.fase',{n:Math.min(feitas(pf)+1,FASES.length),t:FASES.length}))+' · '+t('perfis.cordeis',{n:pf.cordeis.length,t:CORDEIS_IDS.length});
function abrirPerfis(){ renderPerfis(); mostrar('telaPerfis'); }
function renderPerfis(){
  const box=$('listaPerfis'); box.textContent='';
  const ordem=[...perfis.lista].sort((a,b)=>(b.id===perfis.ultimo)-(a.id===perfis.ultimo));
  for(const pf of ordem){
    const card=el('div','perfil'), entrar=el('button','perfil-entrar'), txt=el('span','perfil-txt'), pe=el('div','perfil-pe');
    entrar.type='button';
    txt.append(el('span','perfil-nome',pf.nome), el('span','perfil-info',`${PERSONAGENS[pf.personagem].nome} · ${resumoPerfil(pf)}`));
    const av=avatarCanvas(pf.personagem); av.dataset.chapeu=visualDe(pf).chapeu;
    entrar.append(av,txt);
    entrar.addEventListener('click',()=>{ sfx.clique(); entrarComo(pf); });
    const apagar=el('button','link',t('perfis.apagar')); apagar.type='button'; apagar.setAttribute('aria-label',t('perfis.apagarAria',{jogador:pf.nome}));
    apagar.addEventListener('click',()=>confirmarApagar(pf,pe));
    pe.append(apagar); card.append(entrar,pe); box.append(card);
  }
  const cheio=perfis.lista.length>=8; $('btnNovoPerfil').hidden=cheio; $('limitePerfis').hidden=!cheio;
  atualizarOnline();
}
function confirmarApagar(pf,pe){
  pe.textContent='';
  const sim=el('button','link perigo',t('perfis.sim')), nao=el('button','link',t('perfis.nao'));
  sim.type=nao.type='button';
  sim.addEventListener('click',()=>{ apagarPerfil(pf.id); if(perfis.lista.length){ renderPerfis(); $('tPerfis').focus(); } else abrirNovo(); });
  nao.addEventListener('click',()=>{ renderPerfis(); });
  pe.append(el('p','',t('perfis.pergunta',{jogador:pf.nome})),sim,nao); nao.focus();
}
function entrarComo(pf){ perfil=pf; heroi=PERSONAGENS[pf.personagem]; perfis.ultimo=pf.id; salvarPerfis(); abrirMenu(); }

let escolhaNovo='ze', difNovo='normal';
function abrirNovo(){
  $('nomeNovo').value=''; $('erroNovo').hidden=true; escolhaNovo='ze'; difNovo='normal';
  renderEscolha($('escolhaNovo'),null,escolhaNovo,id=>{ escolhaNovo=id; });
  seletorDificuldade($('difNovo'),difNovo,d=>{ difNovo=d; });
  $('btnCancelarNovo').hidden=!perfis.lista.length; atualizarOnline();
  mostrar('telaNovo'); $('nomeNovo').focus();
}
$('formNovo').addEventListener('submit',e=>{
  e.preventDefault();
  const nome=$('nomeNovo').value.trim().replace(/\s+/g,' '), erroEl=$('erroNovo');
  const erro=!nome ? t('novo.erroVazio') : perfis.lista.some(x=>x.nome.toLowerCase()===nome.toLowerCase()) ? t('novo.erroRepetido') : '';
  if(erro){ erroEl.textContent=erro; erroEl.hidden=false; $('nomeNovo').setAttribute('aria-invalid','true'); $('nomeNovo').focus(); return; }
  $('nomeNovo').removeAttribute('aria-invalid'); sfx.libera();
  entrarComo(novoPerfil(nome,escolhaNovo,difNovo));
});
$('btnNovoPerfil').addEventListener('click',abrirNovo);
$('btnCancelarNovo').addEventListener('click',abrirPerfis);

/* ---------- DIFICULDADE E RECORDES ---------- */
function seletorDificuldade(box,atual,onPick){
  box.textContent='';
  for(const d of Object.keys(DIFICULDADES)){
    const b=el('button','dif'); b.type='button'; b.dataset.dif=d; b.setAttribute('role','radio'); b.setAttribute('aria-checked',String(d===atual));
    b.append(el('b','',t('dif.'+d)), el('small','',t('dif.'+d+'.d')));
    b.addEventListener('click',()=>{ sfx.clique(); onPick(d); seletorDificuldade(box,d,onPick); box.querySelector(`[data-dif="${d}"]`).focus(); });
    box.append(b);
  }
}
// recordes de tempo separados por dificuldade (perfis antigos guardavam um só, que vale como Normal)
function recorde(pf,fid,d=pf.dificuldade||'normal'){
  const reg=pf.fases[fid]; if(!reg) return 0;
  return (reg.tempos && reg.tempos[d]) || (d==='normal' && reg.tempo) || 0;
}

/* ---------- PERSONAGENS ---------- */
function statsEl(ch){
  const dl=el('dl','stats');
  for(const [k,v] of Object.entries(pontos(ch))){
    const n=clamp(v,1,5), dd=el('dd'); dd.setAttribute('aria-label',t('stat.de5',{n}));
    for(let i=0;i<5;i++) dd.append(el('i',i<n?'on':''));
    dl.append(el('dt','',t('stat.'+k)),dd);
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
    else if(id===sel) b.append(el('span','pers-selo',t('pers.escolhido')));
    b.addEventListener('click',()=>{ if(!liberado(id,pf)) return; sfx.clique(); onPick(id); renderEscolha(box,pf,id,onPick); box.querySelector(`[data-id="${id}"]`).focus(); });
    box.append(b);
  }
}
function abrirPersonagens(){
  const escolher=id=>{ perfil.personagem=id; heroi=PERSONAGENS[id]; salvarPerfis(); abrirPersonagensAvatares(); renderVisual(); };
  renderEscolha($('listaPersonagens'),perfil,perfil.personagem,escolher);
  abrirPersonagensAvatares(); renderVisual();
  mostrar('telaPersonagem');
}

/* ---------- MENU DO JOGADOR ---------- */
function proximaFase(pf){ const f=FASES.find(f=>!(pf.fases[f.id] && pf.fases[f.id].feita)); return f?f.id:0; }
function abrirMenu(){
  paused=false; running=false; fecharOverlays();
  $('nomeMenu').textContent=perfil.nome;
  $('persMenu').textContent=`${heroi.nome}, ${heroi.titulo}`;
  const av=$('avatarMenu'); av.dataset.pers=perfil.personagem; av.dataset.anda='1'; av.dataset.chapeu=visualDe(perfil).chapeu;
  const total=FASES.every(f=>recorde(perfil,f.id)>0) ? FASES.reduce((s,f)=>s+recorde(perfil,f.id),0) : 0;
  $('resumoMenu').innerHTML=`<li>${t('menu.rFases')} <b>${feitas(perfil)}/${FASES.length}</b></li><li>${t('menu.rCordeis')} <b>${perfil.cordeis.length}/${CORDEIS_IDS.length}</b></li>`
    +`<li>${t('menu.rCoracoes')} <b>${heroi.vida+(perfil.bonusVida||0)}</b></li>`+`<li>${t('menu.conquistas')} <b>${CONQUISTAS.filter(c=>temConquista(perfil,c.id)).length}/${CONQUISTAS.length}</b></li>`
    +(total?`<li>${t('menu.rMelhor')} <b>${fmt(total)}</b></li>`:'');
  seletorDificuldade($('difMenu'),perfil.dificuldade||'normal',d=>{ perfil.dificuldade=d; salvarPerfis(); abrirMenu(); $('difMenu').querySelector(`[data-dif="${d}"]`).focus(); });
  const d=partidaSalva(perfil), n=proximaFase(perfil), bj=$('btnJogar');
  const linha=(a,b)=>{ bj.textContent=a; bj.append(el('small','',b)); };
  if(d) linha(t('menu.continuar'),`${t('fases.n',{n:d.fase})} · ${FASES[d.fase-1].nome}`);
  else if(n) linha(t('menu.jogar'),`${t('fases.n',{n})} · ${FASES[n-1].nome}`);
  else linha(t('menu.jogarDeNovo'),t('menu.escolhaFase'));
  atualizarOnline();
  mostrar('telaMenu');
}
$('btnJogar').addEventListener('click',()=>{ sfx.clique(); const d=partidaSalva(perfil), n=proximaFase(perfil); if(d) continuar(d); else if(n) jogarFase(n); else abrirFases(); });
$('btnFases').addEventListener('click',()=>{ sfx.clique(); abrirFases(); });
$('btnPersonagem').addEventListener('click',()=>{ sfx.clique(); abrirPersonagens(); });
$('btnTrocar').addEventListener('click',()=>{ sfx.clique(); abrirPerfis(); });
$('btnConquistas').addEventListener('click',()=>{ sfx.clique(); abrirConquistas(); });
$('btnVoltarConquistas').addEventListener('click',abrirMenu);
$('btnRanking').addEventListener('click',()=>{ sfx.clique(); abrirRanking(); });
$('btnVoltarRanking').addEventListener('click',abrirMenu);
$('btnVoltarPers').addEventListener('click',abrirMenu);
$('btnVoltarFases').addEventListener('click',abrirMenu);

/* ---------- FASES ---------- */
const miniCache={};
function abrirFases(){
  const box=$('listaFases'), d=partidaSalva(perfil); box.textContent='';
  for(const f of FASES){
    const livre=f.id===1 || !!(perfil.fases[f.id-1] && perfil.fases[f.id-1].feita), reg=perfil.fases[f.id]||{}, rec=recorde(perfil,f.id);
    const card=el('div','fase'+(livre?'':' bloqueada')), corpo=el('div','fase-corpo'), bt=el('div','fase-botoes');
    if(!miniCache[f.id]){ miniCache[f.id]=document.createElement('canvas'); miniatura(f,miniCache[f.id]); }
    const cnv=document.createElement('canvas'); cnv.width=miniCache[f.id].width; cnv.height=miniCache[f.id].height; cnv.setAttribute('aria-hidden','true');
    cnv.getContext('2d').drawImage(miniCache[f.id],0,0);
    corpo.append(el('p','eyebrow',t('fases.n',{n:f.id})), el('h3','',f.nome), el('p','',f.resumo));
    if(reg.feita) corpo.append(el('span','selo-feita',t('fases.concluida')));
    corpo.append(el('p','fase-info', livre ? t('fases.info',{dif:t('dif.'+(perfil.dificuldade||'normal')), tempo:rec>0?fmt(rec):'—', n:achados(f), t:cordeisDaFase(f).length}) : t('fases.liberar',{n:f.id-1})));
    const botao=(txt,cls,fn)=>{ const b=el('button',cls,txt); b.type='button'; b.addEventListener('click',()=>{ sfx.clique(); fn(); }); bt.append(b); return b; };
    if(!livre) botao(t('fases.bloqueada'),'btn',()=>{}).disabled=true;
    else if(d && d.fase===f.id){ botao(t('fases.continuar'),'btn',()=>continuar(d)); botao(t('fases.recomecar'),'btn sec',()=>jogarFase(f.id)); }
    else botao(t('fases.jogar'),'btn',()=>jogarFase(f.id));
    corpo.append(bt); card.append(cnv,corpo); box.append(card);
  }
  $('avisoFases').textContent = d ? t('fases.avisoSalva',{n:d.fase}) : t('fases.aviso');
  mostrar('telaFases');
}

/* ---------- PARTIDA ---------- */
const btnPausa=$('btnPausa');
function fecharOverlays(){ for(const id of ['ovTitulo','ovPausa','ovDesmaio','ovFim']) $(id).hidden=true; fecharDialogo(); elToast.hidden=true; toastT=0; btnPausa.textContent=t('btn.pausar'); }
// antes de cada fase, a cena de cordel (se estiver ligada nas Opções)
function jogarFase(id){
  store.del(K_PARTIDA+perfil.id);
  iniciarFase(id); fecharOverlays(); running=false; paused=false;
  mostrarCena(id,()=>abrirTitulo(id));
}
function abrirTitulo(id){
  $('tituloFase').textContent=t('fases.nDe',{n:id,t:FASES.length});
  $('tituloNome').textContent=fase.nome; $('tituloResumo').textContent=fase.resumo;
  mostrar('telaJogo'); $('ovTitulo').hidden=false; $('btnComecarFase').focus();
}
$('btnComecarFase').addEventListener('click',()=>{ initAudio(); $('ovTitulo').hidden=true; running=true; held.clear(); registrarPartida(); say(fase.intro()); });
function continuar(d){
  try{ carregarPartida(d); }catch(e){ jogarFase(d.fase); return; }
  fecharOverlays(); paused=false; mostrar('telaJogo'); running=true;
  toast(t('partida.retomada'));
}
function pause(){
  if(!running) return;
  running=false; paused=true; held.clear(); salvarPartida();
  $('textoPausa').textContent=t('pausa.texto');
  $('ovPausa').hidden=false; btnPausa.textContent=t('btn.continuar'); $('btnVoltar').focus();
}
function unpause(){ if(!paused) return; paused=false; $('ovPausa').hidden=true; running=true; held.clear(); btnPausa.textContent=t('btn.pausar'); }
function togglePause(){ paused?unpause():pause(); }
btnPausa.addEventListener('click',togglePause);
$('btnVoltar').addEventListener('click',unpause);
$('btnReiniciar').addEventListener('click',()=>jogarFase(fase.id));
$('btnSairMenu').addEventListener('click',()=>{ salvarPartida(); abrirMenu(); });

function desmaiar(){
  running=false; held.clear();
  $('textoDesmaio').textContent=t('desmaio.texto');
  $('ovDesmaio').hidden=false; $('btnLevantar').focus();
}
$('btnLevantar').addEventListener('click',()=>{
  respawn(); $('ovDesmaio').hidden=true; running=true; held.clear();
  say(t(fase.id===1?'desmaio.avo':'desmaio.so'));
});

function concluirFase(){
  running=false; S0.won=true; sfx.win(); elToast.hidden=true; toastT=0;
  const d=perfil.dificuldade||'normal', antigo=recorde(perfil,fase.id,d), novo=!(antigo>0) || time<antigo, ultima=fase.id===FASES.length, primeiraVez=fase.id===3 && !liberado('rosa',perfil);   // a Rosa é liberada ao vencer a Serra do Fogo
  const reg=perfil.fases[fase.id]||{}, tempos=Object.assign({}, reg.tempos, reg.tempo>0 && !(reg.tempos||{}).normal ? {normal:reg.tempo} : {});
  if(novo) tempos[d]=time;
  perfil.fases[fase.id]={feita:true, tempos};
  if(ultima) perfil.fim=true;
  perfis.ultimo=perfil.id; salvarPerfis(); store.del(K_PARTIDA+perfil.id);
  aoConcluirFase(ultima);
  if(novo) enviarRecorde(perfil,fase.id,d,time,S0.partida);
  const total=cordeisDaFase(fase).length, n=achados(fase), falta=total-n;
  $('fimFase').textContent=t('fim.fase',{n:fase.id,nomeFase:fase.nome});
  $('fimTitulo').textContent=t(ultima?'fim.tituloFinal':'fim.titulo');
  $('fimTexto').textContent=t(ultima?'fim.final':'fim.'+fase.id)+(primeiraVez?t('fim.rosa'):'');
  $('fimTempo').textContent=fmt(time); $('fimInimigos').textContent=S0.kills; $('fimCordeis').textContent=`${n}/${total}`;
  const nomeDif=t('dif.'+d);
  $('fimRecorde').textContent=(novo?t('fim.recordeNovo',{dif:nomeDif}):t('fim.recorde',{dif:nomeDif, tempo:fmt(tempos[d])}))
    +(falta ? t(falta===1?'fim.falta1':'fim.faltaN',{n:falta}) : t('fim.todos'));
  $('btnProxima').hidden=ultima;
  $('ovFim').hidden=false; (ultima?$('btnMenuFim'):$('btnProxima')).focus();
  if(primeiraVez) setTimeout(()=>sfx.libera(),900);
  if(ultima) mostrarCena('final',()=>{ mostrar('telaJogo'); $('btnMenuFim').focus(); });
}
$('btnProxima').addEventListener('click',()=>jogarFase(fase.id+1));
$('btnMenuFim').addEventListener('click',abrirMenu);

/* ---------- SOM ---------- */
function musicaDesejada(){
  if(telaAtual!=='telaJogo') return 'sertao';
  if(!running) return null;
  if(S0 && S0.festa) return 'festa';
  return chefe && chefe.active && !chefe.dead ? 'chefe' : fase.musica;
}
// a música reage à partida: apressa com um coração só, ganha percussão perto do perigo e o chocalho do boi quando ele vem junto
function climaMusica(){
  if(telaAtual!=='telaJogo' || !running || !S0 || !p) return {acel:1, tensao:false, chocalho:false};
  const perto=(x,y,r)=>Math.hypot(x-p.x,y-p.y)<r;
  const tensao=!!(chefe && !chefe.dead && (chefe.active || perto(chefe.x,chefe.y,10*T))) || inimigos.some(c=>!c.dead && perto(c.x,c.y,80));
  return {acel:S0.hp===1 && !S0.won ? 1.12 : 1, tensao, chocalho:!S0.festa && p.moving && npcs.some(n=>n.segue)};
}
const btnSom=$('btnSom'), btnMusica=$('btnMusica');
const prefs=store.get(K_PREF)||{};
muted=prefs.efeitos===false; mus.on=prefs.musica!==false;
function salvarPrefs(){ Object.assign(prefs,{efeitos:!muted, musica:mus.on, idioma}); store.set(K_PREF,prefs); }

/* ---------- OPÇÕES ---------- */
const ACOES=['up','down','left','right','whip','talk','pause'];
const TECLAS_PADRAO={up:['ArrowUp','KeyW'], down:['ArrowDown','KeyS'], left:['ArrowLeft','KeyA'], right:['ArrowRight','KeyD'],
  whip:['Space','KeyJ','KeyZ'], talk:['KeyE','Enter','KeyK','KeyX'], pause:['Escape','KeyP']};
let TECLAS={}, ouvindo=null, origemOpcoes='telaPerfis';
const nomeTecla=c=>({ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',Escape:'Esc',Space:t('tecla.espaco'),Enter:'Enter'})[c] || c.replace(/^(Key|Digit|Numpad)/,'');
// a tecla escolhida vem primeiro; as padrão continuam valendo se nenhuma outra ação tomou o lugar delas
function montarTeclas(){
  const escolhidas=prefs.teclas||{}; KEYMAP={}; TECLAS={};
  for(const a of ACOES) if(escolhidas[a]) KEYMAP[escolhidas[a]]=a;
  for(const a of ACOES){ TECLAS[a]=escolhidas[a]?[escolhidas[a]]:[]; for(const c of TECLAS_PADRAO[a]) if(!KEYMAP[c]){ KEYMAP[c]=a; TECLAS[a].push(c); } }
  atualizarLegenda();
}
function atualizarLegenda(){
  const leg=document.querySelector('.legenda'), antes=leg.querySelector('.botoes');
  for(const x of leg.querySelectorAll('.leg-tecla')) x.remove();
  const anda=i=>{ const ordem=i?['up','left','down','right']:['up','down','left','right'];   // ↑↓←→ e WASD
    return ordem.every(a=>TECLAS[a][i]) ? ordem.map(a=>nomeTecla(TECLAS[a][i])).join('') : ''; };
  const itens=[[[anda(0),anda(1)].filter(Boolean),'leg.andar'],[[nomeTecla(TECLAS.whip[0])],'leg.chicote'],[[nomeTecla(TECLAS.talk[0])],'leg.falar'],[[nomeTecla(TECLAS.pause[0])],'leg.pausar']];
  for(const [teclas,k] of itens){
    const sp=el('span','so-teclado leg-tecla');
    teclas.forEach((n,i)=>{ if(i) sp.append(t('ou')+' '); sp.append(el('kbd','',n)); });
    sp.append(t(k)); leg.insertBefore(sp,antes);
  }
  $('dicasTeclas').textContent=itens.map(([teclas,k])=>`${teclas.join(' / ')} ${t(k)}`).join(' · ');
}
function renderTeclas(){
  const box=$('listaTeclas'); box.textContent='';
  for(const a of ACOES){
    const kb=el('span'); TECLAS[a].forEach(c=>kb.append(el('kbd','',nomeTecla(c)),' '));
    const b=el('button','link',t('op.trocar')); b.type='button'; b.setAttribute('aria-label',`${t('op.trocar')}: ${t('acao.'+a)}`);
    b.addEventListener('click',()=>{ ouvindo=a; kb.textContent=''; kb.append(el('kbd','ouvindo',t('op.ouvindo'))); });
    box.append(el('span','',t('acao.'+a)),kb,b);
  }
}
function gravarTecla(code){
  const a=ouvindo; ouvindo=null;
  if(code!=='Escape' && code!=='Tab'){
    prefs.teclas=prefs.teclas||{};
    for(const x of ACOES) if(prefs.teclas[x]===code) delete prefs.teclas[x];
    prefs.teclas[a]=code; salvarPrefs();
  }
  montarTeclas(); renderTeclas();
}
function aplicarOpcoes(){
  document.body.classList.toggle('texto-grande',!!prefs.textoGrande);
  document.body.classList.toggle('contraste',!!prefs.contraste);
  const mudouContraste=contraste!==!!prefs.contraste;
  contraste=!!prefs.contraste; mostrarSeta=prefs.seta!==false;
  calm=prefs.calmo!=null ? !!prefs.calmo : matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.body.classList.toggle('calmo',calm);
  volMusica=(prefs.volMusica!=null?prefs.volMusica:100)/100; volEfeitos=(prefs.volEfeitos!=null?prefs.volEfeitos:100)/100; aplicarVolume();
  if(mudouContraste && fase && map.length) drawMap();
  measureHud();
}
function abrirOpcoes(){
  if(telaAtual==='telaOpcoes') return;
  if(telaAtual==='telaJogo' && running) pause();
  origemOpcoes=telaAtual;
  $('opVolMusica').value=Math.round(volMusica*100); $('opVolEfeitos').value=Math.round(volEfeitos*100);
  $('opVolMusicaV').textContent=$('opVolMusica').value+'%'; $('opVolEfeitosV').textContent=$('opVolEfeitos').value+'%';
  $('opTexto').checked=!!prefs.textoGrande; $('opContraste').checked=!!prefs.contraste; $('opCalmo').checked=calm;
  $('opSeta').checked=mostrarSeta; $('opVibrar').checked=prefs.vibrar!==false; $('opCenas').checked=prefs.cenas!==false; $('opIdioma').value=idioma;
  renderTeclas(); mostrar('telaOpcoes');
}
function voltarDeOpcoes(){
  ouvindo=null;
  if(origemOpcoes==='telaJogo'){ mostrar('telaJogo'); if(paused) $('btnVoltar').focus(); return; }
  ({telaPerfis:abrirPerfis, telaMenu:abrirMenu, telaPersonagem:abrirPersonagens, telaFases:abrirFases, telaNovo:()=>mostrar('telaNovo')}[origemOpcoes]||abrirPerfis)();
}
for(const [id,chave] of [['opVolMusica','volMusica'],['opVolEfeitos','volEfeitos']])
  $(id).addEventListener('input',()=>{ prefs[chave]=+$(id).value; $(id+'V').textContent=$(id).value+'%'; salvarPrefs(); aplicarOpcoes(); if(chave==='volEfeitos') sfx.clique(); });
for(const [id,chave] of [['opTexto','textoGrande'],['opContraste','contraste'],['opCalmo','calmo'],['opSeta','seta'],['opVibrar','vibrar'],['opCenas','cenas']])
  $(id).addEventListener('change',()=>{ prefs[chave]=$(id).checked; salvarPrefs(); aplicarOpcoes(); });
$('btnTeclasPadrao').addEventListener('click',()=>{ prefs.teclas={}; ouvindo=null; salvarPrefs(); montarTeclas(); renderTeclas(); });
$('btnOpcoes').addEventListener('click',abrirOpcoes);
$('btnOpcoesPausa').addEventListener('click',abrirOpcoes);
$('btnVoltarOpcoes').addEventListener('click',voltarDeOpcoes);
function labelSound(){
  btnSom.textContent=t(muted?'som.efeitos.off':'som.efeitos.on'); btnSom.setAttribute('aria-pressed',String(!muted));
  btnMusica.textContent=t(mus.on?'som.musica.on':'som.musica.off'); btnMusica.setAttribute('aria-pressed',String(mus.on));
  salvarPrefs();
}
btnSom.addEventListener('click',()=>{ muted=!muted; labelSound(); });
btnMusica.addEventListener('click',()=>{ mus.on=!mus.on; labelSound(); });

/* ---------- LAÇO ---------- */
let last=performance.now();
function frame(now){
  const dt=Math.min(0.05,(now-last)/1000); last=now;
  readPad();
  if(telaAtual==='telaJogo'){ update(dt); render(); avisarConquistas(dt); } else animarAvatares(now/1000);
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

/* ---------- IDIOMA ---------- */
const selIdioma=$('selIdioma');
for(const sel of [selIdioma,$('opIdioma')]){
  for(const [cod,nome] of Object.entries(IDIOMAS)) sel.append(Object.assign(el('option','',nome),{value:cod}));
  sel.value=idioma; sel.addEventListener('change',()=>trocarIdioma(sel.value));
}
function trocarIdioma(novo){
  if(!IDIOMAS[novo]) return;
  idioma=novo; selIdioma.value=$('opIdioma').value=novo; salvarPrefs(); traduzirPagina(); labelSound(); atualizarLegenda();
  const reabrir={telaPerfis:abrirPerfis, telaMenu:abrirMenu, telaPersonagem:abrirPersonagens, telaFases:abrirFases, telaOpcoes:renderTeclas,
    telaConquistas:abrirConquistas, telaRanking:renderRanking, telaConta:renderConta, telaCena:()=>cenaAtual && textoCena(cenaAtual), telaNovo:()=>{ renderEscolha($('escolhaNovo'),null,escolhaNovo,id=>{ escolhaNovo=id; }); seletorDificuldade($('difNovo'),difNovo,d=>{ difNovo=d; }); }}[telaAtual];
  if(reabrir) reabrir();
  else if(S0){ updateHud(); btnPausa.textContent=t(paused?'btn.continuar':'btn.pausar'); if(paused) $('textoPausa').textContent=t('pausa.texto'); }
}

