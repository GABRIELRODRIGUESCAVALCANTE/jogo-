'use strict';
/* ---------- DESAFIO DOS CHEFES ----------
  Liberado ao terminar a jornada: as Cabras Cabriolas e os três chefes em sequência, nos mapas das próprias fases,
  com um estoque de vida só (sem rapadura) e o tempo somado. Tem recorde e ranking próprios (no servidor, "fase" 5). */
const FASE_DESAFIO=5;
let desafio=null;       // {etapa, tempo, hp, partida} enquanto o desafio está em andamento

const ETAPAS_DESAFIO=[
  {fase:1, nome:()=>t('des.cabras'), arrumar(){
      p.x=30*T; p.y=13*T;
      for(const c of inimigos) c.brava=true;                 // as cabras já vêm bravas
    }, vencida:()=>inimigos.every(c=>c.dead)},
  {fase:2, nome:()=>CHEFES.caboclo.nome, arrumar(){
      Object.assign(S0,{falouBarqueiro:true, chefeIntro:true}); p.x=38*T+8; p.y=19*T+8; chefe.active=true;
      inimigos=inimigos.filter(c=>c.x>28*T);                                                // só os jacarés do poço
    }},
  {fase:3, nome:()=>CHEFES.mula.nome, arrumar(){
      Object.assign(S0,{chefeIntro:true, avisoBrasa:true}); p.x=24*T+8; p.y=11*T; chefe.active=true; setStage(2);
      inimigos=inimigos.filter(c=>c.tipo==='morcego' && c.y<16*T);
    }},
  {fase:4, nome:()=>CHEFES.lobisomem.nome, arrumar(){
      Object.assign(S0,{ticao:true, ticoes:TICOES_MAX, acesas:[0,1,2], ultima:2, chefeIntro:true});
      for(const n of npcs) if(n.type==='fogueira') n.acesa=true;
      p.x=24*T+8; p.y=21*T+8; const boi=npcs.find(n=>n.segue); boi.x=p.x; boi.y=p.y-14;
      inimigos=inimigos.filter(c=>c.tipo==='batatao' && c.y>19*T); chefe.active=true; setStage(3);
    }},
];
const desafioLiberado=pf=>!!(pf && pf.fim);
const recordeDesafio=(pf,d=pf.dificuldade||'normal')=>((pf.desafio||{}).tempos||{})[d]||0;

function iniciarDesafio(){
  desafio={etapa:0, tempo:0, hp:null, partida:null};
  store.del(K_PARTIDA+perfil.id);
  iniciarEtapa(0); fecharOverlays(); running=false; paused=false;
  $('tituloFase').textContent=t('des.eyebrow',{t:ETAPAS_DESAFIO.length});
  $('tituloNome').textContent=t('des.titulo'); $('tituloResumo').textContent=t('des.resumo');
  mostrar('telaJogo'); $('ovTitulo').hidden=false; $('btnComecarFase').focus();
}
function comecarDesafio(){
  const este=desafio;
  registrarPartida(FASE_DESAFIO, pt=>{ if(desafio===este) desafio.partida=pt; });
  toast(t('des.etapa',{n:1, t:ETAPAS_DESAFIO.length, nome:ETAPAS_DESAFIO[0].nome()}));
}
function iniciarEtapa(i){
  const e=ETAPAS_DESAFIO[i];
  desafio.etapa=i; desafio.trocando=false;
  iniciarFase(e.fase); fantasma=null; items=[];
  e.arrumar();
  if(desafio.hp!=null) S0.hp=Math.min(desafio.hp,S0.maxHp);
  updateHud();
}
// chamado a cada quadro durante o desafio
function tickDesafio(){
  const e=ETAPAS_DESAFIO[desafio.etapa];
  if(!desafio.trocando && e.vencida && e.vencida()) etapaVencida();
}
function etapaVencida(){
  if(desafio.trocando) return;
  desafio.trocando=true; desafio.tempo+=time; desafio.hp=S0.hp; balls=[]; fires=[];
  if(chefe && chefe.dead){ chefe.active=false; burst(chefe.x,chefe.y-10,'#ffd23a',24,90); shake=.35; sfx.crash(); }
  updateHud();
  const prox=desafio.etapa+1, este=desafio;
  if(prox>=ETAPAS_DESAFIO.length){ fimDesafio(true); return; }
  sfx.libera(); toast(t('des.etapa',{n:prox+1, t:ETAPAS_DESAFIO.length, nome:ETAPAS_DESAFIO[prox].nome()}),2.6);
  setTimeout(()=>{ if(desafio===este && telaAtual==='telaJogo'){ iniciarEtapa(prox); toastT=Math.max(toastT,1.6); } },1300);
}
function fimDesafio(venceu){
  running=false; held.clear(); elToast.hidden=true; toastT=0;
  const d=perfil.dificuldade||'normal', total=desafio.tempo, antigo=recordeDesafio(perfil,d), novo=venceu && (!antigo || total<antigo);
  if(novo){
    perfil.desafio=perfil.desafio||{tempos:{}}; perfil.desafio.tempos=Object.assign({},perfil.desafio.tempos,{[d]:total});
    salvarPerfis(); enviarRecorde(perfil,FASE_DESAFIO,d,total,desafio.partida);
  }
  if(venceu) sfx.win(); else sfx.hurt();
  const nomeDif=t('dif.'+d);
  $('desafioTitulo').textContent=t(venceu?'des.venceu':'des.perdeu');
  $('desafioTexto').textContent=venceu ? t('des.venceuTexto') : t('des.perdeuTexto',{n:desafio.etapa+1, t:ETAPAS_DESAFIO.length, nome:ETAPAS_DESAFIO[desafio.etapa].nome()});
  $('desafioTempo').textContent=venceu?fmt(total):'—';
  $('desafioRecorde').textContent=novo ? t('fim.recordeNovo',{dif:nomeDif}) : antigo ? t('fim.recorde',{dif:nomeDif, tempo:fmt(antigo)}) : '';
  $('ovDesafio').hidden=false; $('btnDesafioDeNovo').focus();
}
function atualizarBotaoDesafio(){
  const b=$('btnDesafio'), livre=desafioLiberado(perfil);
  b.textContent=t('des.titulo');
  if(livre){ b.removeAttribute('aria-disabled'); const r=recordeDesafio(perfil); if(r) b.append(el('small','',t('des.melhor',{tempo:fmt(r)}))); }
  else { b.setAttribute('aria-disabled','true'); b.append(el('small','',t('des.trava'))); }
}
$('btnDesafio').addEventListener('click',()=>{ if(!desafioLiberado(perfil)) return; sfx.clique(); iniciarDesafio(); });
$('btnDesafioDeNovo').addEventListener('click',()=>{ sfx.clique(); iniciarDesafio(); });
$('btnDesafioMenu').addEventListener('click',()=>{ desafio=null; abrirMenu(); });
