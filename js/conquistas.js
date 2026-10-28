'use strict';
/* ---------- CONQUISTAS ----------
  Cada conquista fica guardada no jogador (perfil.conquistas = {id: data}). Algumas liberam visuais.
  Nomes e descrições ficam em js/idiomas.js ('conq.<id>' e 'conq.<id>.d'). */
const CONQUISTAS=[
  {id:'pe_na_estrada'}, {id:'travessia'}, {id:'quebra_encanto'}, {id:'jornada'},
  {id:'primeiro_cordel'}, {id:'cordelista'}, {id:'ligeiro'}, {id:'pastor'},
  {id:'couro_grosso'}, {id:'firme'}, {id:'lambada'}, {id:'familia'}, {id:'coragem'}, {id:'lua_cheia'},
  {id:'desrespeito', secreta:true},
];
// visuais: o chapéu muda as cores da cabeça (chapéu, bandana ou véu); o chicote muda a cor da tira
const CHAPEUS={
  couro:null,
  palha:{chapeu:'#d8b86a', chapeu2:'#c8a85a', enfeite:'#8a3a22', requer:'primeiro_cordel'},
  vermelho:{chapeu:'#a8281a', chapeu2:'#c4462c', enfeite:'#ffd23a', requer:'pastor'},
  estrela:{chapeu:'#4a2e1a', chapeu2:'#5e3a22', enfeite:'#ffd23a', estrela:true, requer:'quebra_encanto'},
  festa:{chapeu:'#3a78a0', chapeu2:'#5a8ac0', enfeite:'#e9a83b', requer:'jornada'},
};
const CHICOTES={
  couro:{cor:'#c9a06a'},
  trancado:{cor:'#7a4a28', requer:'ligeiro'},
  prata:{cor:'#c8ccd2', requer:'couro_grosso'},
  dourado:{cor:'#ffd23a', requer:'cordelista'},
  fogo:{cor:'#ff6a2a', requer:'coragem'},
};
const temConquista=(pf,id)=>!!(pf && pf.conquistas && pf.conquistas[id]);
const visualLiberado=(pf,item)=>!item || !item.requer || temConquista(pf,item.requer);
function visualDe(pf){ const v=(pf && pf.visual)||{}; return {chapeu:CHAPEUS[v.chapeu]!==undefined?v.chapeu:'couro', chicote:CHICOTES[v.chicote]?v.chicote:'couro'}; }
// as cores do personagem com o chapéu escolhido por cima
function visualComChapeu(ch,chapeu){ const c=CHAPEUS[chapeu]; return c ? Object.assign({}, ch.visual, c) : ch.visual; }

const filaConquistas=[];
let conquistaT=0;
function conquistar(id){
  if(!perfil || temConquista(perfil,id)) return;
  perfil.conquistas=perfil.conquistas||{}; perfil.conquistas[id]=Date.now(); salvarPerfis();
  filaConquistas.push(id);
}
// aviso no canto da tela, um de cada vez
function avisarConquistas(dt){
  const box=$('avisoConquista');
  if(conquistaT>0){ conquistaT-=dt; if(conquistaT<=0) box.hidden=true; return; }
  if(!filaConquistas.length) return;
  const id=filaConquistas.shift();
  $('avisoConquistaNome').textContent=t('conq.'+id);
  box.hidden=false; box.classList.toggle('anima',!calm); conquistaT=3.4; sfx.libera();
}
const estat=()=>(perfil.estat=perfil.estat||{inimigos:0});
function aoVencerInimigo(){
  estat().inimigos++; salvarPerfis();
  if(estat().inimigos>=50) conquistar('lambada');
  if(fase.id===1 && S0.kills>=8) conquistar('pastor');
}
function aoLevarDano(){ S0.danos=(S0.danos||0)+1; if(chefe && chefe.active && !chefe.dead) S0.danoChefe=(S0.danoChefe||0)+1; }
function aoVencerChefe(){ contarCriatura('chefe',chefe.tipo); if(!S0.danoChefe) conquistar('couro_grosso'); if(chefe && chefe.tipo==='lobisomem') conquistar('lua_cheia'); }
function aoLerCordel(){ conquistar('primeiro_cordel'); if(perfil.cordeis.length>=CORDEIS_IDS.length) conquistar('cordelista'); }
function aoConcluirFase(ultima){
  const porFase={1:'pe_na_estrada',2:'travessia',3:'quebra_encanto'}[fase.id]; if(porFase) conquistar(porFase);
  if(ultima) conquistar('jornada');
  if(fase.id===1 && time<120) conquistar('ligeiro');
  if(!S0.danos) conquistar('firme');
  if(fase.id===3 && perfil.dificuldade==='dificil') conquistar('coragem');
  perfil.fezCom=[...new Set([...(perfil.fezCom||[]), heroi.id])];
  if(PERS_ORDEM.every(id=>perfil.fezCom.includes(id))) conquistar('familia');
  salvarPerfis();
}

/* ---------- TELA DE CONQUISTAS ---------- */
function recompensaDe(id){
  for(const [k,v] of Object.entries(CHAPEUS)) if(v && v.requer===id) return t('vis.chapeu.'+k);
  for(const [k,v] of Object.entries(CHICOTES)) if(v.requer===id) return t('vis.chicote.'+k);
  return '';
}
function abrirConquistas(){
  const box=$('listaConquistas'); box.textContent='';
  let n=0;
  for(const c of CONQUISTAS){
    const tem=temConquista(perfil,c.id); if(tem) n++;
    const card=el('div','conq'+(tem?' tem':'')), txt=el('div','conq-txt');
    const oculto=c.secreta && !tem;
    txt.append(el('b','',oculto?t('conq.secreta'):t('conq.'+c.id)), el('span','',oculto?t('conq.secreta.d'):t('conq.'+c.id+'.d')));
    const premio=recompensaDe(c.id); if(premio) txt.append(el('small','',t('conq.libera',{item:premio})));
    const med=el('span','medalha',tem?'★':'☆'); med.setAttribute('aria-hidden','true');
    card.append(med,txt); card.setAttribute('aria-label',`${tem?t('conq.feita'):t('conq.falta')}: ${oculto?t('conq.secreta'):t('conq.'+c.id)}`);
    box.append(card);
  }
  $('contaConquistas').textContent=t('conq.conta',{n,t:CONQUISTAS.length});
  mostrar('telaConquistas');
}

/* ---------- VISUAL (na tela de personagens) ---------- */
function renderVisual(){
  const v=visualDe(perfil);
  const linha=(box,lista,tipo,atual,amostra)=>{
    box.textContent='';
    for(const [k,item] of Object.entries(lista)){
      const livre=visualLiberado(perfil,item), b=el('button','amostra'); b.type='button';
      b.setAttribute('role','radio'); b.setAttribute('aria-checked',String(k===atual)); b.dataset.vis=k;
      if(!livre) b.setAttribute('aria-disabled','true');
      const cor=el('span','cor'); amostra(cor,k,item);
      b.append(cor, el('span','vis-nome',t(`vis.${tipo}.${k}`)));
      if(!livre) b.append(el('small','',t('conq.requer',{nome:t('conq.'+item.requer)})));
      b.addEventListener('click',()=>{
        if(!visualLiberado(perfil,item)) return;
        sfx.clique(); perfil.visual=Object.assign({},visualDe(perfil),{[tipo]:k}); salvarPerfis();
        renderVisual(); abrirPersonagensAvatares(); box.querySelector(`[data-vis="${k}"]`).focus();
      });
      box.append(b);
    }
  };
  linha($('amostrasChapeu'),CHAPEUS,'chapeu',v.chapeu,(cor,k,item)=>{ const c=item||PERSONAGENS[perfil.personagem].visual; cor.style.background=`linear-gradient(${c.chapeu2||c.chapeu} 0 45%, ${c.chapeu} 45% 80%, ${c.enfeite||c.chapeu} 80%)`; });
  linha($('amostrasChicote'),CHICOTES,'chicote',v.chicote,(cor,k,item)=>{ cor.style.background=item.cor; });
}
function abrirPersonagensAvatares(){ for(const c of document.querySelectorAll('#listaPersonagens canvas[data-pers]')) c.dataset.chapeu=visualDe(perfil).chapeu; }
