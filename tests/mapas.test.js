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
      for(const [t,x,y] of f.npcs){
        if(t==='fogueira'){ if(![[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>depois.has((x+a)+','+(y+b)))) out.push(`F${f.id}: fogueira (${x},${y}) sem chão em volta`); continue; }
        if(!livre(x,y)) out.push(`F${f.id}: ${t} em sólido`);
        if(!depois.has(x+','+y)) out.push(`F${f.id}: ${t} inalcançável`);
      }
      for(const [x,y] of f.pontosAntes||[]) if(!antes.has(x+','+y)) out.push(`F${f.id}: (${x},${y}) precisa ser alcançável desde o começo`);
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

// o servidor recusa recordes abaixo de TEMPO_MINIMO; ele nunca pode passar do que um jogador perfeito consegue
test('tempo mínimo do ranking cabe no menor caminho de cada fase', async()=>{
  const { TEMPO_MINIMO, CHEFE_MINIMO } = require('../servidor/regras');
  const caminhos = await J.ev(()=>{
    // pontos por onde toda partida passa (itens de missão, quem precisa ouvir, chefes) e a saída
    const OBRIG={1:{pts:[[43,6],[6,9]],fim:[23,0]}, 2:{pts:[[7,13],[3,22],[34,23],[21,19]],fim:[23,0],ultimo:4}, 3:{pts:[],fim:[24,2]}, 4:{pts:[[8,5],[12,7],[36,13],[24,23],[30,25]],fim:[24,30]}};
    return FASES.map(f=>{
      const rows=f.aberto?f.aberto(f.mapa):f.mapa, H=rows.length, W=rows[0].length, livre=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&!SOLID.has(rows[y][x]);
      const dij=(sx,sy)=>{ const dist=new Map([[sx+','+sy,0]]), fila=[[0,sx,sy]];
        while(fila.length){ fila.sort((a,b)=>a[0]-b[0]); const [d,x,y]=fila.shift(); if(d>dist.get(x+','+y)) continue;
          for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){ const nx=x+dx, ny=y+dy;
            if(!livre(nx,ny) || (dx&&dy&&(!livre(x+dx,y)||!livre(x,y+dy)))) continue;
            const nd=d+(dx&&dy?Math.SQRT2:1), k=nx+','+ny; if(!(dist.get(k)<=nd)){ dist.set(k,nd); fila.push([nd,nx,ny]); } } }
        return dist; };
      const ate=(dist,[x,y])=>Math.min(...[[0,0],[1,0],[-1,0],[0,1],[0,-1]].map(([a,b])=>dist.get((x+a)+','+(y+b))??Infinity));
      const o=OBRIG[f.id], todos=[f.spawn,...o.pts], D=todos.map(([x,y])=>dij(x,y));
      const perms=a=>a.length<=1?[a]:a.flatMap((v,i)=>perms([...a.slice(0,i),...a.slice(i+1)]).map(r=>[v,...r]));
      let melhor=Infinity;
      for(const pm of perms(o.pts.map((_,i)=>i+1))){ if(o.ultimo && pm.at(-1)!==o.ultimo) continue;
        let tot=0, at=0; for(const j of pm){ tot+=ate(D[at],todos[j]); at=j; } melhor=Math.min(melhor, tot+ate(D[at],o.fim)); }
      return { id:f.id, segundos:melhor*T/Math.max(...Object.values(PERSONAGENS).map(c=>c.vel)) };
    });
  });
  assert.equal(caminhos.length, Object.keys(TEMPO_MINIMO).length);
  for(const c of caminhos){
    assert.ok(Number.isFinite(c.segundos), `F${c.id}: caminho não encontrado`);
    assert.ok(TEMPO_MINIMO[c.id] <= Math.floor(c.segundos*0.85)+CHEFE_MINIMO[c.id], `F${c.id}: mínimo ${TEMPO_MINIMO[c.id]} s, caminho ${c.segundos.toFixed(1)} s`);
  }
});
