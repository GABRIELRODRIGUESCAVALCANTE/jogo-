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
async function pedirApi(metodo,caminho,corpo,token){
  const ctl=new AbortController(), relogio=setTimeout(()=>ctl.abort(),12000);
  let r;
  try{
    r=await fetch(apiOnline()+caminho,{method:metodo, signal:ctl.signal,
      headers:Object.assign(corpo?{'Content-Type':'application/json'}:{}, token?{Authorization:'Bearer '+token}:{}),
      body:corpo?JSON.stringify(corpo):undefined});
  }catch(e){ throw new ErroOnline('rede'); }
  finally{ clearTimeout(relogio); }
  if(r.status===204) return null;
  const dados=await r.json().catch(()=>({}));
  if(!r.ok) throw new ErroOnline(dados.erro||'geral');
  return dados;
}

/* ---------- PROGRESSO ---------- */
// o que vai para o servidor: o jogador inteiro, menos o id, que só vale neste aparelho
function dadosDoPerfil(pf){ const d=Object.assign({},pf); delete d.id; return d; }
// junta dois progressos sem perder nada: fases feitas, melhores tempos, cordéis e conquistas dos dois lados
function mesclarProgresso(local,remoto){
  const r=Object.assign({},remoto,local), a=local.fases||{}, b=remoto.fases||{};
  r.fases={};
  for(const id of new Set([...Object.keys(a),...Object.keys(b)])){
    const tempos={};
    for(const reg of [a[id]||{},b[id]||{}]){
      const ts=Object.assign(reg.tempo>0?{normal:reg.tempo}:{}, reg.tempos);
      for(const [d,v] of Object.entries(ts)) if(v>0 && !(tempos[d]<=v)) tempos[d]=v;
    }
    r.fases[id]={feita:!!((a[id]||{}).feita || (b[id]||{}).feita), tempos};
  }
  r.cordeis=[...new Set([...(remoto.cordeis||[]),...(local.cordeis||[])])];
  r.conquistas=Object.assign({},remoto.conquistas);
  for(const [k,v] of Object.entries(local.conquistas||{})) if(!(r.conquistas[k]<=v)) r.conquistas[k]=v;
  r.fezCom=[...new Set([...(remoto.fezCom||[]),...(local.fezCom||[])])];
  r.estat={inimigos:Math.max((local.estat||{}).inimigos||0,(remoto.estat||{}).inimigos||0)};
  r.bonusVida=Math.max(local.bonusVida||0,remoto.bonusVida||0);
  r.fim=!!(local.fim||remoto.fim);
  return r;
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
  try{ await pedirApi('PUT','/api/progresso',{dados:dadosDoPerfil(pf)},s.token); ultimoSync=Date.now(); }
  catch(e){ if(e.codigo==='nao_autorizado') sessaoExpirou(pf); throw e; }
}
addEventListener('online',()=>{ if(syncPendente.size) sincronizarPendentes(); });
function sessaoExpirou(pf){ delete sessoes[pf.id]; salvarSessoes(); }

/* ---------- RECORDES E RANKING MUNDIAL ---------- */
function enviarRecorde(pf,fid,d,tempo){
  const s=sessaoDe(pf); if(!s) return Promise.resolve();
  return pedirApi('POST','/api/recordes',{fase:fid, dificuldade:d, personagem:pf.personagem, chapeu:visualDe(pf).chapeu, tempo:Math.round(tempo*100)/100},s.token)
    .catch(e=>{ if(e.codigo==='nao_autorizado') sessaoExpirou(pf); });
}
// depois de ligar a conta, manda todos os melhores tempos que o jogador já tinha
function enviarTodosRecordes(pf){
  const envios=[];
  for(const f of FASES) for(const d of Object.keys(DIFICULDADES)){ const tp=recorde(pf,f.id,d); if(tp>0) envios.push(enviarRecorde(pf,f.id,d,tp)); }
  return Promise.all(envios);
}
async function rankingMundial(fase,dif){
  const s=sessaoDe(perfil), q=new URLSearchParams({fase:String(fase), dificuldade:dif});
  const r=await pedirApi('GET','/api/ranking?'+q,null,s&&s.token);
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
      ? await pedirApi('POST','/api/contas',{email, senha, nome:contaPara.nome})
      : await pedirApi('POST','/api/sessoes',{email, senha});
    const outro=perfis.lista.find(pf=>pf!==contaPara && sessaoDe(pf) && sessaoDe(pf).conta.id===r.conta.id);
    if(outro) return erroConta('jaLigada');
    await ligarConta(r);
  }catch(err){ erroConta(err.codigo||'geral'); }
  finally{ botao.disabled=false; }
});
// liga a conta ao jogador: junta o progresso do servidor com o do aparelho e manda tudo de volta
async function ligarConta(r){
  const remoto=(await pedirApi('GET','/api/progresso',null,r.token)).dados;
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
  enviarTodosRecordes(pf);
  sfx.libera();
  if(contaPara){ if(perfil===pf) heroi=PERSONAGENS[pf.personagem]; renderConta(); $('tConta').focus(); }
  else entrarComo(pf);
}
$('btnSincronizar').addEventListener('click',async()=>{
  sfx.clique(); const pf=contaPara; $('contaEstado').textContent=t('rank.carregando');
  try{
    const remoto=(await pedirApi('GET','/api/progresso',null,sessaoDe(pf).token)).dados;
    if(remoto){ Object.assign(pf,mesclarProgresso(pf,remoto),{id:pf.id}); salvarPerfis(); }
    await enviarProgresso(pf); syncPendente.delete(pf.id); semRede=false; enviarTodosRecordes(pf);
  }catch(e){ if(e.codigo!=='nao_autorizado'){ syncPendente.add(pf.id); semRede=true; } }
  renderConta();
});
$('btnSairConta').addEventListener('click',()=>{ sfx.clique(); sessaoExpirou(contaPara); syncPendente.delete(contaPara.id); renderConta(); $('tConta').focus(); });
$('btnApagarConta').addEventListener('click',()=>{ $('confirmaApagarConta').hidden=false; $('btnApagarNao').focus(); });
$('btnApagarNao').addEventListener('click',()=>{ $('confirmaApagarConta').hidden=true; $('btnApagarConta').focus(); });
$('btnApagarSim').addEventListener('click',async()=>{
  const pf=contaPara;
  try{ await pedirApi('DELETE','/api/contas',null,sessaoDe(pf).token); }
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
