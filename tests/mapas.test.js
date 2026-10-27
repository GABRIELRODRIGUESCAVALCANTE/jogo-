// Todo item, NPC e saída precisa ter caminho a pé; inimigos nascem em chão livre e dentro da zona.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { preparar, abrir } = require('./ajuda');

let A, J;
before(async()=>{ A=await preparar(); J=await abrir(A.browser,A.url); });
after(async()=>{ await A.fim(); });

test('mapas das fases são consistentes e alcançáveis', async()=>{
  const problemas = await J.ev(()=>{
    const out=[];
    const alcance=(rows,sx,sy)=>{ const H=rows.length,W=rows[0].length, seen=new Set([sx+','+sy]), q=[[sx,sy]];
      while(q.length){ const [x,y]=q.shift(); for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx,ny=y+dy,k=nx+','+ny;
        if(nx<0||ny<0||nx>=W||ny>=H||seen.has(k)||SOLID.has(rows[ny][nx])) continue; seen.add(k); q.push([nx,ny]); } }
      return seen; };
    for(const f of FASES){
      const rows=f.mapa, W=rows[0].length, livre=(x,y)=>!SOLID.has(rows[y][x]);
      if(!rows.every(r=>r.length===W)) out.push(`F${f.id}: linhas de larguras diferentes`);
      const antes=alcance(rows,...f.spawn), depois=alcance(f.aberto?f.aberto(rows):rows,...f.spawn);
      if(!livre(...f.spawn)) out.push(`F${f.id}: início em chão sólido`);
      for(const [t,x,y] of f.npcs){ if(!livre(x,y)) out.push(`F${f.id}: ${t} em sólido`); if(!antes.has(x+','+y)) out.push(`F${f.id}: ${t} inalcançável`); }
      for(const [t,x,y,id] of f.itens){
        if(!livre(x,y)) out.push(`F${f.id}: ${t} ${id||''} em sólido`);
        const precisaAntes=['fumo','tabua'].includes(t);   // itens de missão ficam do lado de cá da passagem
        if(!(precisaAntes?antes:depois).has(x+','+y)) out.push(`F${f.id}: ${t} ${id||''} (${x},${y}) inalcançável`);
      }
      for(const [t,x,y,z] of f.inimigos){ const zz=f.zonas[z];
        if(!livre(x,y)) out.push(`F${f.id}: ${t} em sólido`);
        if(x<zz[0]||x>zz[2]||y<zz[1]||y>zz[3]) out.push(`F${f.id}: ${t} fora da zona ${z}`); }
      for(const [x,y] of f.pontosChave||[]) if(!depois.has(x+','+y)) out.push(`F${f.id}: ponto-chave (${x},${y}) inalcançável`);
      for(const [x,y] of f.fechadoAntes||[]) if(antes.has(x+','+y)) out.push(`F${f.id}: (${x},${y}) alcançável antes de abrir a passagem`);
    }
    return out;
  });
  assert.deepEqual(problemas, []);
  assert.deepEqual(J.erros, []);
});
