// Gera os ícones do app (PWA) em pixel art: a cabeça do Boi Estrela num fundo de couro.
// Uso: node scripts/gerar-icones.js   (precisa do Playwright)
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const html = `<canvas id="c"></canvas><script>
function desenhar(tam, margem){
  const c=document.getElementById('c'); c.width=c.height=tam;
  const g=c.getContext('2d'); g.imageSmoothingEnabled=false;
  const px=tam/32*(1-margem*2), o=tam*margem;               // grade de 32x32 "pixels"
  const R=(cor,x,y,w,h)=>{ g.fillStyle=cor; g.fillRect(Math.round(o+x*px),Math.round(o+y*px),Math.ceil(w*px),Math.ceil(h*px)); };
  g.fillStyle='#22150e'; g.fillRect(0,0,tam,tam);
  if(!margem){ R('#e9a83b',0,0,32,1); R('#e9a83b',0,31,32,1); R('#e9a83b',0,0,1,32); R('#e9a83b',31,0,1,32); }
  // chifres
  R('#d8cbb0',3,6,5,2); R('#d8cbb0',2,3,2,4); R('#f1e2c2',2,3,1,3);
  R('#d8cbb0',24,6,5,2); R('#d8cbb0',28,3,2,4); R('#f1e2c2',29,3,1,3);
  // orelhas
  R('#c9bca4',5,9,4,3); R('#e0b0a0',6,10,2,1); R('#c9bca4',23,9,4,3); R('#e0b0a0',24,10,2,1);
  // cabeça
  R('#efe6d6',9,5,14,20); R('#efe6d6',8,7,16,14); R('#d8cfc0',9,23,14,2);
  R('#2a2220',9,12,3,6); R('#2a2220',20,14,3,5);             // manchas
  // estrela de cinco pontas na testa
  ['...X...','...X...','..XXX..','XXXXXXX','.XXXXX.','..XXX..','.XX.XX.','XX...XX'].forEach((l,y)=>[...l].forEach((ch,x)=>{ if(ch==='X') R('#ffd23a',13+x,5+y,1,1); }));
  R('#fff1a0',16,6,1,3);
  // olhos
  R('#1a0e08',11,15,2,2); R('#1a0e08',19,15,2,2); R('#ffffff',11,15,1,1); R('#ffffff',19,15,1,1);
  // focinho
  R('#e0b0a0',11,20,10,7); R('#c98a7a',11,26,10,1); R('#6a3a30',13,22,2,2); R('#6a3a30',17,22,2,2);
  // fitas de festa nos chifres
  R('#c4462c',8,7,1,4); R('#3a78a0',7,8,1,4); R('#c4462c',23,7,1,4); R('#3a78a0',24,8,1,4);
  return c.toDataURL('image/png');
}
</script>`;

(async()=>{
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  const destino = path.join(__dirname, '..', 'icones');
  fs.mkdirSync(destino, { recursive:true });
  for(const [nome,tam,margem] of [['icone-192.png',192,0],['icone-512.png',512,0],['icone-maskable-512.png',512,.12],['icone-180.png',180,0],['favicon-32.png',32,0]]){
    const url = await page.evaluate(([t,m])=>desenhar(t,m),[tam,margem]);
    fs.writeFileSync(path.join(destino,nome), Buffer.from(url.split(',')[1],'base64'));
    console.log('gerado', nome);
  }
  await browser.close();
})();
