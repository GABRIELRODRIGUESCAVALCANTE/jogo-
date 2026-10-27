'use strict';
/* ---------- RANKING ----------
  Melhores tempos por fase (ou da jornada inteira) e por dificuldade.
  "Neste aparelho" lê os jogadores locais; "Mundial" aparece quando as contas online estão ligadas (js/online.js). */
let rankFase=1, rankDif='normal', rankFonte='local';

function tempoRanking(pf,alvo,d){
  if(alvo!=='jornada') return recorde(pf,alvo,d);
  return FASES.every(f=>recorde(pf,f.id,d)>0) ? FASES.reduce((s,f)=>s+recorde(pf,f.id,d),0) : 0;
}
function linhasLocais(){
  return perfis.lista.map(pf=>({nome:pf.nome, personagem:pf.personagem, chapeu:visualDe(pf).chapeu, tempo:tempoRanking(pf,rankFase,rankDif), eu:!!perfil && pf.id===perfil.id}))
    .filter(l=>l.tempo>0).sort((a,b)=>a.tempo-b.tempo).slice(0,10);
}
function abrirRanking(){
  rankDif=(perfil && perfil.dificuldade) || 'normal';
  if(rankFonte==='mundial' && !onlineAtivo()) rankFonte='local';
  renderRanking(); mostrar('telaRanking');
}
async function renderRanking(){
  const abas=$('abasRanking'); abas.textContent='';
  for(const alvo of [...FASES.map(f=>f.id),'jornada']){
    const b=el('button','aba',alvo==='jornada'?t('rank.jornada'):t('fases.n',{n:alvo})); b.type='button';
    b.setAttribute('aria-pressed',String(alvo===rankFase));
    b.addEventListener('click',()=>{ sfx.clique(); rankFase=alvo; renderRanking(); abas.querySelector('[aria-pressed="true"]').focus(); });
    abas.append(b);
  }
  seletorDificuldade($('difRanking'),rankDif,d=>{ rankDif=d; renderRanking(); });
  const fonte=$('fonteRanking'); fonte.hidden=!onlineAtivo(); fonte.textContent='';
  for(const f of ['local','mundial']){
    const b=el('button','aba',t('rank.'+f)); b.type='button'; b.setAttribute('aria-pressed',String(f===rankFonte));
    b.addEventListener('click',()=>{ rankFonte=f; renderRanking(); });
    fonte.append(b);
  }
  $('tituloRanking').textContent=rankFase==='jornada'?t('rank.jornada'):`${t('fases.n',{n:rankFase})} · ${FASES[rankFase-1].nome}`;
  const lista=$('listaRanking'), vazio=$('vazioRanking'), pedido=`${rankFonte}${rankFase}${rankDif}`;
  lista.dataset.pedido=pedido; lista.textContent=''; vazio.hidden=true;
  let linhas;
  if(rankFonte==='mundial'){
    vazio.hidden=false; vazio.textContent=t('rank.carregando');
    try{ linhas=await rankingMundial(rankFase,rankDif); }catch(e){ linhas=null; }
    if(lista.dataset.pedido!==pedido) return;          // o jogador já trocou de aba
    if(!linhas){ vazio.textContent=t('rank.erro'); return; }
  } else linhas=linhasLocais();
  vazio.hidden=linhas.length>0; vazio.textContent=t('rank.vazio');
  linhas.forEach((l,i)=>{
    const li=el('li','linha'+(l.eu?' eu':'')), av=avatarCanvas(l.personagem); av.dataset.chapeu=l.chapeu||'couro';
    const quem=el('span','quem'); quem.append(el('b','',l.nome), el('small','',PERSONAGENS[l.personagem]?PERSONAGENS[l.personagem].nome:''));
    if(l.eu) quem.append(el('small','voce',t('rank.voce')));
    li.append(el('span','pos',String(i+1)), av, quem, el('span','tempo',fmt(l.tempo)));
    lista.append(li);
  });
}
