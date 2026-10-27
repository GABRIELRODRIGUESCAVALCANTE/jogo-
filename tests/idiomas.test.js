// Português, inglês e espanhol: detecção pelo navegador, troca na hora e textos completos.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { preparar, abrir } = require('./ajuda');

let A;
before(async()=>{ A=await preparar(); });
after(async()=>{ await A.fim(); });

test('todas as chaves do português existem em inglês e espanhol, com as mesmas variáveis', async()=>{
  const J=await abrir(A.browser,A.url);
  const faltas=await J.ev(()=>{
    const out=[], vars=s=>JSON.stringify(s).match(/\{(?!g:)\w+\}/g)?.sort().join()||'';
    for(const k of Object.keys(TEXTOS.pt)) for(const l of ['en','es']){
      const a=TEXTOS.pt[k], b=TEXTOS[l][k];
      if(b===undefined){ out.push(`${l}: falta ${k}`); continue; }
      if(Array.isArray(a)!==Array.isArray(b) || (Array.isArray(a) && a.length!==b.length)) out.push(`${l}: formato diferente em ${k}`);
      if(vars(a)!==vars(b)) out.push(`${l}: variáveis diferentes em ${k}`);
    }
    for(const l of ['en','es']) for(const k of Object.keys(TEXTOS[l])) if(TEXTOS.pt[k]===undefined) out.push(`${l}: chave sobrando ${k}`);
    return out;
  });
  assert.deepEqual(faltas, []);
  await J.fechar();
});

test('navegador em espanhol abre o jogo em espanhol', async()=>{
  const J=await abrir(A.browser,A.url,{locale:'es-ES'});
  assert.equal(await J.ev(()=>document.documentElement.lang), 'es');
  assert.equal(await J.page.textContent('#tNovo'), 'Nuevo jugador');
  await J.criarJogador('Lucía','luzia');
  assert.match(await J.page.textContent('#btnJogar'), /^Jugar/);
  await J.comecarFase(1);
  assert.match(await J.page.textContent('#objetivo'), /Caipora/);
  assert.equal(await J.ev(()=>t('f1.avo1')[0][1].includes('muchacha')), true, 'concordância com a personagem');
  assert.deepEqual(J.erros, []);
  await J.fechar();
});

test('troca de idioma na hora e lembra a escolha', async()=>{
  const J=await abrir(A.browser,A.url);
  assert.equal(await J.page.textContent('#tNovo'), 'Novo jogador');
  await J.page.selectOption('#selIdioma','en');
  assert.equal(await J.page.textContent('#tNovo'), 'New player');
  assert.equal(await J.page.textContent('#escolhaNovo [data-id="ze"] .pers-titulo'), 'the cowboy');
  await J.criarJogador('Sam','tiao');
  await J.comecarFase(1);
  await J.ev(()=>{ p.x=7*16+8; p.y=9*16+8; }); await J.page.keyboard.press('KeyE'); await J.ate(()=>dlg.open);
  await J.ate(()=>!$('seta').hidden || true);
  assert.match(await J.ev(()=>dlg.lines.map(l=>l[1]).join(' ')), /a blacksmith chasing an ox/);
  await J.pular();
  await J.page.reload(); await J.page.waitForFunction(()=>typeof telaAtual!=='undefined');
  assert.equal(await J.page.textContent('#tPerfis'), "Who's playing?");
  assert.deepEqual(J.erros, []);
  await J.fechar();
});
