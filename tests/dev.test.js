// `npm run dev`: serve o jogo, injeta o recarregamento automático e avisa quando um arquivo muda.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const RAIZ = path.join(__dirname, '..');
let proc, base;
before(async()=>{
  const env = { ...process.env, PORT:'0' }; delete env.DATABASE_URL;
  proc = spawn(process.execPath, [path.join(RAIZ,'scripts','dev.js')], { env });
  base = await new Promise((ok, falha)=>{
    let saida=''; const relogio=setTimeout(()=>falha(new Error('o servidor não subiu: '+saida)), 8000);
    proc.stdout.on('data', d=>{ saida+=d; const m=/rodando em (http:\/\/localhost:\d+)\//.exec(saida); if(m){ clearTimeout(relogio); ok(m[1]); } });
  });
});
after(()=>{ if(proc) proc.kill(); });

test('serve o jogo e o editor com o recarregamento automático', async()=>{
  for(const pagina of ['/', '/editor.html']){
    const r = await fetch(base+pagina);
    assert.equal(r.status, 200);
    const html = await r.text();
    assert.match(html, /EventSource\('\/__recarregar'\)/);
  }
  const js = await fetch(base+'/js/config.js');
  assert.match(await js.text(), /api:''/, 'sem banco, as contas online ficam desligadas');
  assert.equal((await fetch(base+'/node_modules/playwright/package.json')).status, 403);
});

test('avisa a página quando um arquivo muda', async()=>{
  const ctl = new AbortController();
  const r = await fetch(base+'/__recarregar', { signal:ctl.signal });
  const leitor = r.body.getReader(), dec = new TextDecoder();
  const temp = path.join(RAIZ, 'docs', `.teste-dev-${process.pid}.txt`);
  try{
    await leitor.read();                                   // ": ok"
    await new Promise(r=>setTimeout(r,150));
    fs.writeFileSync(temp, String(Date.now()));
    let txt='';
    const fim = Date.now()+5000;
    while(!txt.includes('recarregar') && Date.now()<fim){ const { value } = await leitor.read(); txt += dec.decode(value); }
    assert.match(txt, /data: recarregar/);
  } finally { ctl.abort(); fs.rmSync(temp, { force:true }); }
});
