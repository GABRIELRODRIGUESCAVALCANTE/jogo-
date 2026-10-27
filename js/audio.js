'use strict';
/* ---------- EFEITOS ---------- */
let ac=null, muted=false, volMusica=1, volEfeitos=1;
function tone(f,d,type='square',vol=.05,slide=0,delay=0){
  if(!ac||muted||volEfeitos<=0) return;
  vol*=volEfeitos;
  const t0=ac.currentTime+delay, o=ac.createOscillator(), g=ac.createGain();
  o.type=type; o.frequency.setValueAtTime(f,t0);
  if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t0+d);
  g.gain.setValueAtTime(vol,t0); g.gain.exponentialRampToValueAtTime(0.0001,t0+d);
  o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0+d+0.02);
}
const sfx={
  whip:()=>tone(1100,.09,'sawtooth',.035,-800),
  hit:()=>tone(240,.12,'square',.06,-140),
  clink:()=>tone(1400,.06,'square',.03,-200),
  hurt:()=>tone(170,.28,'sawtooth',.07,-100),
  pick:()=>{tone(660,.08,'square',.05);tone(990,.14,'square',.05,0,.08);},
  crash:()=>tone(90,.4,'triangle',.14,-50),
  talk:()=>tone(520,.03,'square',.015),
  win:()=>{[523,659,784,1046].forEach((f,i)=>tone(f,.22,'square',.05,0,i*.14));},
  fogo:()=>{tone(260,.35,'sawtooth',.05,-160);tone(130,.4,'triangle',.09,-60,.02);},
  pagina:()=>{[880,1320,1760].forEach((f,i)=>tone(f,.1,'triangle',.04,0,i*.06));},
  agua:()=>tone(760,.07,'triangle',.018,-420),
  lama:()=>{tone(210,.22,'triangle',.07,-110);tone(120,.18,'sine',.06,-40,.03);},
  bote:()=>tone(150,.16,'sawtooth',.05,140),
  ponte:()=>{[330,290,350,310].forEach((f,i)=>tone(f,.06,'square',.04,-60,i*.11));},
  clique:()=>tone(700,.04,'square',.018),
  uivo:medo=>medo ? tone(780,.35,'triangle',.05,-380) : (tone(320,.5,'sawtooth',.035,320), tone(640,.7,'sine',.04,-240,.45)),
  acender:()=>{tone(180,.25,'sawtooth',.04,400);tone(880,.2,'triangle',.03,300,.12);},
  libera:()=>{[523,659,784,988,1318].forEach((f,i)=>tone(f,.18,'triangle',.05,0,i*.09));},
};

/* ---------- MÚSICA ---------- */
// feita na hora: zabumba, triângulo, baixo e uma sanfona de dois osciladores
const NOTA={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
const midi=n=>{ const m=/^([A-G])(#?)(\d)$/.exec(n); return 12*(+m[3]+1)+NOTA[m[1]]+(m[2]?1:0); };
const hz=n=>440*Math.pow(2,(n-69)/12);
function song(bpm,baixo,mel,ritmo='baiao'){
  const at={}; let st=0;
  for(const tok of mel.trim().split(/\s+/)){ if(tok==='|') continue; const [n,l]=tok.split(':'); if(n!=='-') at[st]=[midi(n),+l]; st+=+l; }
  return {bpm, baixo:baixo.map(midi), at, len:baixo.length*8, ritmo};
}
const SONGS={
  // baião em sol mixolídio, o modo do sertão
  sertao:song(104,['G2','F2','F2','G2','G2','C3','D3','G2'],`
    G4:2 B4:2 D5:2 C5:1 B4:1 | C5:2 A4:2 F4:3 -:1 | F4:2 A4:2 C5:2 B4:1 A4:1 | B4:2 G4:2 D4:3 -:1 |
    G4:1 G4:1 B4:1 D5:1 F5:2 E5:1 D5:1 | E5:2 C5:2 A4:3 -:1 | F5:1 E5:1 D5:1 C5:1 B4:2 A4:1 F4:1 | G4:6 -:2`),
  // xote manso em ré mixolídio, para a beira do rio
  rio:song(88,['D2','A2','C3','D2','D2','G2','A2','D2'],`
    A4:3 F#4:1 A4:2 B4:2 | C5:3 B4:1 A4:4 | G4:3 E4:1 G4:2 A4:2 | F#4:6 -:2 |
    D5:2 C5:1 B4:1 A4:2 F#4:2 | G4:2 A4:2 B4:2 C5:2 | B4:2 A4:2 G4:1 F#4:1 E4:2 | D4:6 -:2`,'xote'),
  // baião em lá dórico, mais tenso, para a subida da serra
  serra:song(112,['A2','G2','G2','A2','A2','D3','E2','A2'],`
    A4:2 C5:2 E5:2 D5:1 C5:1 | D5:2 B4:2 G4:3 -:1 | G4:2 B4:2 D5:2 C5:1 B4:1 | C5:2 A4:2 E4:3 -:1 |
    A4:1 A4:1 C5:1 E5:1 G5:2 F#5:1 E5:1 | F#5:2 D5:2 B4:3 -:1 | G5:1 F#5:1 E5:1 D5:1 C5:2 B4:1 G4:1 | A4:6 -:2`),
  // xote em lá menor, devagar, para a noite nas dunas
  noite:song(80,['A2','A2','G2','E2','F2','G2','E2','A2'],`
    A4:3 C5:1 E5:2 D5:2 | C5:3 B4:1 A4:4 | G4:3 A4:1 B4:2 C5:2 | B4:6 -:2 |
    F5:2 E5:1 D5:1 C5:2 A4:2 | B4:2 C5:2 D5:2 E5:2 | C5:2 B4:2 A4:1 G#4:1 E4:2 | A4:6 -:2`,'xote'),
  // baião festeiro em dó maior, para a festa de São João
  festa:song(132,['C3','A2','F2','C3','C3','F2','G2','C3'],`
    C5:1 E5:1 G5:2 E5:1 C5:1 D5:2 | E5:2 D5:1 C5:1 A4:4 | F4:1 A4:1 C5:2 A4:1 F4:1 G4:2 | A4:2 G4:1 E4:1 C4:4 |
    C5:1 C5:1 E5:1 G5:1 A5:2 G5:2 | F5:1 E5:1 D5:1 C5:1 D5:4 | G4:1 B4:1 D5:2 F5:1 E5:1 D5:2 | C5:6 -:2`),
  chefe:song(138,['E2','A2','B2','E2'],`
    E5:1 -:1 E5:1 F5:1 E5:2 B4:2 | C5:1 -:1 C5:1 D5:1 C5:2 A4:2 | B4:1 -:1 B4:1 C5:1 B4:2 G#4:2 | A4:2 B4:2 E4:3 -:1`),
};
const MUS_VOL=.35, mus={on:true, song:null, step:0, next:0, loop:0};
let musG=null;
function env(t,vol,d,att=.005){ const g=ac.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+att); g.gain.exponentialRampToValueAtTime(0.0001,t+d); g.connect(musG); return g; }
function osc(type,f,t,d,dest){ const o=ac.createOscillator(); o.type=type; o.frequency.setValueAtTime(f,t); o.connect(dest); o.start(t); o.stop(t+d+.02); return o; }
function zabumba(t,forte){ const d=forte?.28:.14, o=osc('sine',forte?120:95,t,d,env(t,forte?.32:.16,d)); o.frequency.exponentialRampToValueAtTime(42,t+.16); }
function triangulo(t,aberto){ const d=aberto?.22:.04, g=env(t,aberto?.018:.01,d,.002); osc('sine',4200,t,d,g); osc('sine',6300,t,d,g); }
function baixo(n,t,d){ osc('triangle',hz(n),t,d,env(t,.16,d)); }
function sanfona(n,t,d){
  const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1800; lp.connect(env(t,.05,d,.02));
  for(const det of [-7,7]) osc('sawtooth',hz(n),t,d,lp).detune.value=det;
}
function musStep(s,i,t,u){
  const b=i%8, r=s.baixo[Math.floor(i/8)];
  if(s.ritmo==='xote'){ if(b===0) zabumba(t,true); else if(b===4||b===6) zabumba(t,false); }
  else if(b===0) zabumba(t,true); else if(b===3||b===4) zabumba(t,false);
  triangulo(t,b===2||b===6);
  if(b===0) baixo(r,t,u*2.8); else if(b===3||b===6) baixo(r,t,u*.9); else if(b===4) baixo(r+7,t,u*1.8);
  const m=s.at[i]; if(m && mus.loop%3!==2) sanfona(m[0],t,m[1]*u*.92);
}
function musTick(){
  if(!ac||!musG) return;
  const want = mus.on ? musicaDesejada() : null, now=ac.currentTime;
  if(want!==mus.song){
    mus.song=want; mus.step=0; mus.loop=0; mus.next=now+.06;
    musG.gain.cancelScheduledValues(now);
    if(want) musG.gain.setValueAtTime(MUS_VOL*volMusica,now); else musG.gain.setTargetAtTime(0,now,.06);
  }
  if(!want) return;
  const s=SONGS[want], u=60/s.bpm/4;
  if(mus.next<now) mus.next=now+.02;
  while(mus.next<now+.15){ musStep(s,mus.step,mus.next,u); mus.next+=u; if(++mus.step>=s.len){ mus.step=0; mus.loop++; } }
}
function aplicarVolume(){ if(ac && musG && mus.song) musG.gain.setTargetAtTime(MUS_VOL*volMusica,ac.currentTime,.05); }
function initAudio(){
  try{
    if(!ac){ ac=new (window.AudioContext||window.webkitAudioContext)(); musG=ac.createGain(); musG.gain.value=0; musG.connect(ac.destination); }
    if(ac.state==='suspended') ac.resume();
  }catch(e){ ac=null; musG=null; }
}
