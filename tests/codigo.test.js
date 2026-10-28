// Os scripts compartilham o escopo global: nenhum nome pode ser declarado duas vezes.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('scripts do index.html juntos não têm nomes repetidos nem erro de sintaxe', ()=>{
  const raiz=path.join(__dirname,'..'), html=fs.readFileSync(path.join(raiz,'index.html'),'utf8');
  const scripts=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);
  assert.ok(scripts.length>=10);
  const codigo=scripts.map(s=>fs.readFileSync(path.join(raiz,s),'utf8').replace(/^'use strict';/m,'')).join('\n;\n');
  assert.doesNotThrow(()=>new vm.Script(codigo,{filename:'todos-os-scripts.js'}));
});

test('o jogo e o servidor juntam o progresso com o mesmo código', ()=>{
  const raiz=path.join(__dirname,'..');
  assert.equal(fs.readFileSync(path.join(raiz,'js/mesclar.js'),'utf8'), fs.readFileSync(path.join(raiz,'servidor/mesclar.js'),'utf8'),
    'js/mesclar.js e servidor/mesclar.js precisam ser iguais');
});
