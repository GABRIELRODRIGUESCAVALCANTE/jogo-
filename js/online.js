'use strict';
/* ---------- CONTAS ONLINE ----------
  Cada jogador do aparelho pode ser ligado a uma conta (e-mail e senha) guardada no servidor (pasta servidor/, PostgreSQL).
  A conta guarda o progresso, para jogar em outro aparelho, e os melhores tempos, para o ranking mundial.
  Só funciona quando js/config.js aponta para a API; sem isso, nada aqui aparece. */
const K_SESSOES='estrela-do-sertao:sessoes';
const apiOnline=()=>String((window.ESTRELA_CONFIG||{}).api||'').replace(/\/+$/,'');
const contaOnline={ configurado:()=>!!apiOnline() };
const onlineAtivo=()=>contaOnline.configurado();
let sessoes=store.get(K_SESSOES)||{};          // id do jogador → {token, conta:{id,nome,email}}
const sessaoDe=pf=>(pf && sessoes[pf.id]) || null;
function salvarSessoes(){ store.set(K_SESSOES,sessoes); }

class ErroOnline extends Error{ constructor(codigo){ super(codigo); this.codigo=codigo; } }
// pedidos que o jogador está esperando na tela (aviso=true) mostram "Acordando o servidor…" se passarem de 1,5 s:
// servidores gratuitos dormem quando ficam parados e levam alguns segundos para voltar
let esperandoApi=0, avisoRelogio=0;
function avisoServidor(mais){
  esperandoApi+=mais; clearTimeout(avisoRelogio);
  if(esperandoApi>0 && mais>0) avisoRelogio=setTimeout(()=>{ $('avisoServidor').hidden=false; },1500);
  if(esperandoApi<=0){ esperandoApi=0; $('avisoServidor').hidden=true; }
}
async function pedirApi(metodo,caminho,corpo,token,{aviso=false}={}){
  const ctl=new AbortController(), relogio=setTimeout(()=>ctl.abort(),aviso?40000:12000);
  let r;
  if(aviso) avisoServidor(1);
  try{
    r=await fetch(apiOnline()+caminho,{method:metodo, signal:ctl.signal,
      headers:Object.assign(corpo?{'Content-Type':'application/json'}:{}, token?{Authorization:'Bearer '+token}:{}),
      body:corpo?JSON.stringify(corpo):undefined});
  }catch(e){ throw new ErroOnline('rede'); }
  finally{ clearTimeout(relogio); if(aviso) avisoServidor(-1); }
  if(r.status===204) return null;
  const dados=await r.json().catch(()=>({}));
  if(!r.ok) throw new ErroOnline(dados.erro||'geral');
  return dados;
}

/* ---------- PROGRESSO ---------- */
// o que vai para o servidor: o jogador inteiro, menos o id, que só vale neste aparelho
function dadosDoPerfil(pf){ const d=Object.assign({},pf); delete d.id; return d; }
// a função que junta dois progressos (mesclarProgresso) fica em js/mesclar.js, igual à do servidor
// guarda no aparelho o que o servidor devolveu, sem perder o que mudou aqui enquanto o pedido ia e voltava
function aplicarRemoto(pf,dados){
  if(!dados) return;
  const junto=mesclarProgresso(pf,dados); delete junto.id;
  if(!PERSONAGENS[junto.personagem] || !liberado(junto.personagem,junto)) junto.personagem=pf.personagem;
  if(!DIFICULDADES[junto.dificuldade]) junto.dificuldade=pf.dificuldade;
  if(JSON.stringify(Object.assign({},pf,junto))===JSON.stringify(pf)) return;
  Object.assign(pf,junto); salvarPerfis(true);
  if(perfil===pf) heroi=PERSONAGENS[pf.personagem];
  if(telaAtual==='telaMenu') abrirMenu();
}

let syncRelogio=0, syncPendente=new Set(), semRede=false, ultimoSync=0;
// chamada a cada salvarPerfis(): junta as mudanças e manda alguns segundos depois
function agendarSync(){
  if(!perfil || !sessaoDe(perfil)) return;
  syncPendente.add(perfil.id); clearTimeout(syncRelogio);
  syncRelogio=setTimeout(sincronizarPendentes,2500);
}
async function sincronizarPendentes(){
  for(const id of [...syncPendente]){
    const pf=perfis.lista.find(x=>x.id===id);
    if(!pf || !sessaoDe(pf)){ syncPendente.delete(id); continue; }
    try{ await enviarProgresso(pf); syncPendente.delete(id); semRede=false; }
    catch(e){ if(e.codigo==='nao_autorizado') syncPendente.delete(id); else semRede=true; }
  }
  if(syncPendente.size){ clearTimeout(syncRelogio); syncRelogio=setTimeout(sincronizarPendentes,30000); }   // sem rede: tenta de novo depois
  if(telaAtual==='telaConta') renderConta();
}
async function enviarProgresso(pf){
  const s=sessaoDe(pf);
  try{ const r=await pedirApi('PUT','/api/progresso',{dados:dadosDoPerfil(pf)},s.token); ultimoSync=Date.now(); aplicarRemoto(pf,r&&r.dados); }
  catch(e){ if(e.codigo==='nao_autorizado') sessaoExpirou(pf); throw e; }
}
addEventListener('online',()=>{ if(syncPendente.size) sincronizarPendentes(); });
function sessaoExpirou(pf){ delete sessoes[pf.id]; salvarSessoes(); }

/* ---------- RECORDES E RANKING MUNDIAL ---------- */
// Para valer no ranking mundial, a fase precisa começar avisando o servidor: ele anota a hora e depois só aceita
// um tempo que caiba no relógio dele. Fases jogadas sem conta ou sem internet ficam só no ranking do aparelho.
function registrarPartida(fid=fase.id, guardar){
  const s=sessaoDe(perfil), estado=S0, d=perfil.dificuldade||'normal';
  if(!s) return;
  pedirApi('POST','/api/partidas',{fase:fid, dificuldade:d},s.token)
    .then(r=>{ const pt={id:r.partida, dif:d}; if(guardar) guardar(pt); else if(S0===estado) S0.partida=pt; })
    .catch(e=>{ if(e.codigo==='nao_autorizado') sessaoExpirou(perfil); });
}
function enviarRecorde(pf,fid,d,tempo,partida){
  const s=sessaoDe(pf); if(!s || !partida || partida.dif!==d) return Promise.resolve();
  return pedirApi('POST','/api/recordes',{fase:fid, dificuldade:d, personagem:pf.personagem, chapeu:visualDe(pf).chapeu, tempo:Math.round(tempo*100)/100, partida:partida.id},s.token)
    .catch(e=>{ if(e.codigo==='nao_autorizado') sessaoExpirou(pf); });
}
async function rankingMundial(fase,dif){
  const s=sessaoDe(perfil), q=new URLSearchParams({fase:fase==='desafio'?String(FASE_DESAFIO):String(fase), dificuldade:dif});
  const r=await pedirApi('GET','/api/ranking?'+q,null,s&&s.token,{aviso:true});
  return (r.linhas||[]).map(l=>({nome:l.nome, personagem:PERSONAGENS[l.personagem]?l.personagem:'ze', chapeu:l.chapeu, tempo:l.tempo, eu:!!l.eu}));
}

/* ---------- TELA DA CONTA ---------- */
let modoConta='criar', contaPara=null;     // contaPara: jogador que vai ser ligado (null = entrar num aparelho novo)
function abrirConta(pf,modo){
  contaPara=pf; modoConta=modo||(pf?'criar':'entrar');
  $('emailConta').value=''; $('senhaConta').value=''; $('confirmaApagarConta').hidden=true;
  renderConta(); mostrar('telaConta');
}
function renderConta(){
  const s=sessaoDe(contaPara);
  $('contaLigada').hidden=!s; $('formConta').hidden=!!s;
  $('subConta').textContent=s ? t('conta.subLigada') : contaPara ? t('conta.sub',{jogador:contaPara.nome}) : t('conta.subEntrar');
  if(s){
    $('contaNome').textContent=s.conta.nome; $('contaEmail').textContent=s.conta.email;
    $('contaEstado').textContent=semRede && syncPendente.has(contaPara.id) ? t('conta.pendente') : ultimoSync ? t('conta.sincronizado') : '';
    return;
  }
  const abas=$('modoConta'); abas.textContent=''; abas.hidden=!contaPara;
  for(const m of ['criar','entrar']){
    const b=el('button','aba',t('conta.'+m)); b.type='button'; b.setAttribute('aria-pressed',String(m===modoConta));
    b.addEventListener('click',()=>{ sfx.clique(); modoConta=m; $('erroConta').hidden=true; renderConta(); abas.querySelector('[aria-pressed="true"]').focus(); });
    abas.append(b);
  }
  $('senhaConta').autocomplete=modoConta==='criar'?'new-password':'current-password';
  $('btnEnviarConta').textContent=t(modoConta==='criar'?'conta.criarBtn':'conta.entrarBtn');
  $('erroConta').hidden=true;
}
function erroConta(codigo){
  const e=$('erroConta'), chave='conta.erro.'+codigo;
  e.textContent=t(TEXTOS.pt[chave]?chave:'conta.erro.geral'); e.hidden=false;
}
$('formConta').addEventListener('submit',async e=>{
  e.preventDefault();
  const email=$('emailConta').value.trim(), senha=$('senhaConta').value, botao=$('btnEnviarConta');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erroConta('email_invalido');
  if(senha.length<6) return erroConta(modoConta==='criar'?'senha_curta':'login_invalido');
  botao.disabled=true; $('erroConta').hidden=true;
  try{
    const r=modoConta==='criar'
      ? await pedirApi('POST','/api/contas',{email, senha, nome:contaPara.nome},null,{aviso:true})
      : await pedirApi('POST','/api/sessoes',{email, senha},null,{aviso:true});
    const outro=perfis.lista.find(pf=>pf!==contaPara && sessaoDe(pf) && sessaoDe(pf).conta.id===r.conta.id);
    if(outro) return erroConta('jaLigada');
    await ligarConta(r);
  }catch(err){ erroConta(err.codigo||'geral'); }
  finally{ botao.disabled=false; }
});
// liga a conta ao jogador: junta o progresso do servidor com o do aparelho e manda tudo de volta
async function ligarConta(r){
  const remoto=(await pedirApi('GET','/api/progresso',null,r.token,{aviso:true})).dados;
  let pf=contaPara;
  if(!pf){
    // aparelho novo: usa o jogador com o mesmo nome, se houver, ou cria um
    pf=perfis.lista.find(x=>!sessaoDe(x) && x.nome.toLowerCase()===r.conta.nome.toLowerCase());
    if(!pf){
      if(perfis.lista.length>=8) throw new ErroOnline('cheio');
      pf=novoPerfil(r.conta.nome,'ze');
    }
  }
  // ligando um jogador daqui, valem as escolhas daqui; entrando num aparelho novo, valem as da conta
  if(remoto) Object.assign(pf,contaPara?mesclarProgresso(pf,remoto):mesclarProgresso(remoto,pf),{id:pf.id});
  if(!PERSONAGENS[pf.personagem] || !liberado(pf.personagem,pf)) pf.personagem='ze';
  if(!DIFICULDADES[pf.dificuldade]) pf.dificuldade='normal';
  sessoes[pf.id]={token:r.token, conta:r.conta}; salvarSessoes(); salvarPerfis();
  await enviarProgresso(pf).then(()=>{ syncPendente.delete(pf.id); semRede=false; }, ()=>{ syncPendente.add(pf.id); semRede=true; });
  sfx.libera();
  if(contaPara){ if(perfil===pf) heroi=PERSONAGENS[pf.personagem]; renderConta(); $('tConta').focus(); }
  else entrarComo(pf);
}
$('btnSincronizar').addEventListener('click',async()=>{
  sfx.clique(); const pf=contaPara; $('contaEstado').textContent=t('rank.carregando');
  try{
    await enviarProgresso(pf); syncPendente.delete(pf.id); semRede=false;   // o servidor junta e devolve o progresso das duas pontas
  }catch(e){ if(e.codigo!=='nao_autorizado'){ syncPendente.add(pf.id); semRede=true; } }
  renderConta();
});
$('btnSairConta').addEventListener('click',()=>{ sfx.clique(); sessaoExpirou(contaPara); syncPendente.delete(contaPara.id); renderConta(); $('tConta').focus(); });
$('btnApagarConta').addEventListener('click',()=>{ $('confirmaApagarConta').hidden=false; $('btnApagarNao').focus(); });
$('btnApagarNao').addEventListener('click',()=>{ $('confirmaApagarConta').hidden=true; $('btnApagarConta').focus(); });
$('btnApagarSim').addEventListener('click',async()=>{
  const pf=contaPara;
  try{ await pedirApi('DELETE','/api/contas',null,sessaoDe(pf).token,{aviso:true}); }
  catch(e){ if(e.codigo!=='nao_autorizado'){ $('contaEstado').textContent=t('conta.erro.'+(e.codigo==='rede'?'rede':'geral')); return; } }
  sessaoExpirou(pf); syncPendente.delete(pf.id); $('confirmaApagarConta').hidden=true;
  renderConta(); $('contaEstado').textContent=''; $('subConta').textContent=t('conta.apagada'); $('tConta').focus();
});
$('btnConta').addEventListener('click',()=>{ sfx.clique(); abrirConta(perfil); });
for(const b of ['btnEntrarOnline','btnContaNovo']) $(b).addEventListener('click',()=>{ sfx.clique(); abrirConta(null,'entrar'); });
$('btnVoltarConta').addEventListener('click',()=>{ if(contaPara) abrirMenu(); else if(perfis.lista.length) abrirPerfis(); else abrirNovo(); });

// mostra os botões e o selo só quando há API configurada
function atualizarOnline(){
  const on=onlineAtivo(), s=sessaoDe(perfil);
  $('btnConta').hidden=$('btnEntrarOnline').hidden=$('btnContaNovo').hidden=!on;
  $('seloOnline').hidden=!(on && s);
  if(on && s) $('seloOnline').textContent=t('conta.selo',{email:s.conta.email});
}

// acorda o servidor logo que o jogo abre, enquanto o jogador ainda escolhe quem vai jogar
if(onlineAtivo()) pedirApi('GET','/api/saude').catch(()=>{});
