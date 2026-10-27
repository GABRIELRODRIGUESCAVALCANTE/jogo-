'use strict';
/* ---------- FOLHETOS DE CORDEL ---------- */
// os versos ficam em js/idiomas.js ('cordel.c1.t' é o título, 'cordel.c1' são os seis versos)
const CORDEIS_IDS=['c1','c2','c3','c4','c5','c6','c7','c8','c9'];
const cordel=id=>[t(`cordel.${id}.t`), t(`cordel.${id}`)];

/* ---------- MAPAS (legenda em terreno.js) ---------- */
const MAPA_1=[
  '######################....######################',
  '######################....######################',
  '######################EEEE######################',
  'RBBBBBBBBBBBBB########....#####################R',
  'RBMMMMMBMMMMMBC.......,......C...,.....C.....,.R',
  'RBMMBMMMMMMBMB..,..........,...C.....,.....C...R',
  'RBMMMMMMMMMMMB....C...,...........R.......,....R',
  'RBMBMMMMMMBMMM..................C.....C....R...R',
  'RBMMMMMMMMMMMM...,....WWW.....,.....,.....C....R',
  'RBMMBMMMMMBMMM........WWWW.,......C.....,......R',
  'RBMMMMMBMMMMMB..,....WWWW......C......R....C...R',
  'RBMMMMMMMMMMMB.........WW..........,......,....R',
  'RBBMMMMBMMMMBB..C...............C....C.....,...R',
  'RBBBMMMMMMMBBB......,..............,.....C.....R',
  'RTTBBBMMMBBBTT..,.........C...C......,.....R...R',
  'R.,..T.......T....................C......,.....R',
  'R..T....,............HHHHH......,.....C.....C..R',
  'R.,......T...........HHHHH.........,......C....R',
  'R...C.....,..........HHDHH....C........,.......R',
  'R.,......C.......,..........,.....C.......C....R',
  'R....,....T.........,...........,......,.......R',
  'R..C.......,...........,...........C.......,...R',
  'R.....,..C......C...........C....,.......C.....R',
  'R..,................,.........C.....,......C...R',
  'RCC.CCC..CCC.CCCCC.CCCCC.CCCCCCC.CCCC.CCC.CCC.CR',
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
];
const MAPA_2=[
  '######################....######################',
  '######################....######################',
  'PggggPgggggggggPPPgggg....gPPgggggggPggPgggggggP',
  'PggggggggPgggggggggggg....ggggggggggg,ggggggg,gP',
  'Pggggggggggggg,gggggggg..gggg,gggggggggggggggggP',
  'PggggggPggggggg,gggg,gg..ggggggggggggPgggggggggP',
  'PggggP,g,,g,gggggjggg,g..Pggjgg,ggggggPgjgggg,gP',
  'Pgggggggggggggggggggggg..ggPggjjgjgjgg,gggPggggP',
  'Pgggjggggjgggjggggggggg..ggggggggggggggggggggggP',
  'Pljljjlllllllllllljjllj==llllllllllllljjlljjljlP',
  'Pwwwwwwwwwwwwwwwwwwwwww==wwwwwwwwwwwwwwwwwwwwwwP',
  'PWWWWWWWWWWWWWWWWWWWWWW==WWWWWWWWWWWWWWWWWWWWWWP',
  'PWWWWw.,...WWWWWWWWWWWWQQWWWWWWWWWWW...,WWWWWWWP',
  'PWWWW....P.WWWWWWWWWWWWQQWWWWWWWWWWW....WWWWWWWP',
  'PWWWW.....wWWWWWWWWWWWWQQWWWWWWWWWWWWwwWWWWWWWWP',
  'PWWWWWWWwwWWWWWWWWWWWWW==WWWWWWWWWWWWwwWWWWWWWWP',
  'Pwwwwwwwwwwwwwwwwwwwwww==wwwwwwwwwwwwwwwwwwwwwwP',
  'Pjlllljlljjjlljjlllllll==ljllllljllljllljlljlljP',
  'RggggggggggggPggggggggggggggggggg..,,...,,.....R',
  'Rgg,Pg...,g,.Cgg..gg.g..ggg..P...jjllllllljljj.R',
  'R.,g.g..g..g....T...gg...,,CC.g.,lllWWWWWWljjj.R',
  'R....,,..P...C...................jlWWWWWWWWljj.R',
  'R........C...C....P....,.........llWWWWWWWWlll.R',
  'R.C......,.......C...............llWWWWWWWWlll.R',
  'R.................C........,.C...llWWWWWWWWjll.R',
  'R.......,C...............,......,ljWWWWWWWWlll.R',
  'R..T......,....,..,........C,.T,.lllWWWWWWjlll.R',
  'R..............,...C....,,.......jjllllllllljj.R',
  'CC.CCC..CCC.C,CC.CCCCC.CCCCC.CCC.CCCC.CC.CCC.CCC',
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
];
const MAPA_3=[
  '################################################',
  '############xxxxxxxxxxxxxxxxxxxxxxxxx###########',
  '###########xxxxxxxxxxxxxxxxxxxxxxxxxxx##########',
  '##########xxxxxRxxxxxxxxxxxxxxxxRxxxxxx#########',
  '##########xxxxxxxxxxxxxxxxxxxxxxxxxxxxx#########',
  '##########xxxxxxxxxxxxxxxxxxxxxxxxxxxxx#########',
  '##########xxxxxxxxxxxxxxxxxxxxxxxxxxxxx#########',
  '##########xxxxxRxxxxxxxxxxxxxxxxRxxxxxx#########',
  '##########xxxxxxxxxxxxxxxxxxxxxxxxxxxxx#########',
  '###########xxxxxxxxxxxxxxxxxxxxxxxxxxx##########',
  '############xxxxxxxxxxxxxxxxxxxxxxxxx###########',
  '##################xxxxxxxxxxx###################',
  '######################rrrr######################',
  '##rkrrrrrrrrrrkrrrrrrrrrrrrrkrrrrrkrkkrrrrrkrr##',
  '##rkrrrrrrkrRrrkrrrrrrrrkrrrrrrrrRrkrrrkrrrrrr##',
  '##rrrkrrrrrkrrrrrrkrrrrrrrrrrrrrrrrkrrrrrrrrkr##',
  '#######################################rrrrr####',
  '#######################################rrrrr####',
  '#######################################rrrrr####',
  '##rrrrkrrrrrrbbbbrrrrrrrrbbbbbbbFbrrrrrrrrrrrr##',
  '##rkrrkkrRrrrbbFbrrrrrrrrbbbrrrrrrrrrrrrrrRrrr##',
  '##rrrrrrrrrrrbbbbrrbbbbrrbFbrrrrrrrrrrrrrrrrrr##',
  '##rkrkrrrrrrrbbbbrrbbFbrrbbbrrbbbbrrrrRrrrrrrr##',
  '##rrrrrrrrFrrrrrrrrbFbbrrrrrrrbFbbrrFrrrrrrrrr##',
  '##rrkrrrrrrrrrrrrrrbbbbrrrrrrrbbbbrrrrrrrrrrrr##',
  '###rrrrr########################################',
  '###rrrrr########################################',
  '###rrrrr########################################',
  '###rrrrr########################################',
  '##rrrrrrkrrrrrrrrrrkrrkrrrrrkrrrrrrkrkrrkkrrrr##',
  '##rrrrRrrrrkrrrrrkrrrrkrrrrrrrRrrrkrrkrrrrrrrr##',
  '##rrrrrrrrrrrrrrrrrRrrrrrrrrrrrrrrrkrrrrRrrrrr##',
  '##rrrrkrkrrkrrrrrrrkrrkrrrrkrrrrrrkrrrrrrrrrrr##',
  '################################################',
];

/* ---------- FASES ----------
  Cada fase traz o mapa, quem vive nele e ganchos chamados pelo jogo:
  estado() campos extras de S0 · objetivo(S0) texto do HUD · bolsa(S0) itens na bolsa · intro() falas de abertura
  falar(npc) · pegar(item) → true se tratou · tick(dt) gatilhos · vencerChefe() · restaurar() ao continuar · alvo() da seta
  aberto/pontosChave/fechadoAntes servem aos testes de mapa. Textos e falas ficam em js/idiomas.js. */
function sairDaFase(falas){ if(S0.saindo) return; S0.saindo=true; say(falas,concluirFase); }
const dentro=(e,r)=>e.x>=r[0]*T && e.x<(r[2]+1)*T && e.y>=r[1]*T && e.y<(r[3]+1)*T;

function abrirEspinheiro(){
  S0.thornsOpen=true; S0.hasFumo=false;
  if(!perfil.bonusVida){ perfil.bonusVida=1; salvarPerfis(); S0.maxHp++; }
  S0.hp=S0.maxHp;
  for(let ty=0;ty<MH;ty++) for(let tx=0;tx<MW;tx++) if(map[ty][tx]==='E') burst(tx*T+8,ty*T+8,'#5e4a36',8);
  trocarTiles('E',','); sfx.pick(); setStage(4); toast(t('f1.aberto'));
}
function consertarPonte(){
  for(let ty=0;ty<MH;ty++) for(let tx=0;tx<MW;tx++) if(map[ty][tx]==='Q') burst(tx*T+8,ty*T+8,'#9a6a3a',8);
  trocarTiles('Q','='); S0.ponte=true; sfx.ponte(); setStage(4); toast(t('f2.ponte'));
}
function soltarTabua(){ items.push(Object.assign({type:'tabua', id:'tc'}, nearestFree(34,23))); }
function soltarEncanto(x,y){ npcs.push(npcNovo('moca',x,y)); npcs.push(npcNovo('boi',24*T+8,2*T+10)); }

const FASES=[
{
  id:1, get nome(){ return t('f1.nome'); }, get resumo(){ return t('f1.resumo'); },
  musica:'sertao', mapa:MAPA_1, spawn:[23,20],
  aberto:m=>m.map(r=>r.replace(/E/g,',')), pontosChave:[[23,0]], fechadoAntes:[[23,0]],
  npcs:[['avo',21,19],['caipora',6,9]],
  zonas:{caatinga:[14,4,46,23]},
  inimigos:[['cabra',36,5,'caatinga'],['cabra',40,9,'caatinga'],['cabra',44,12,'caatinga'],['cabra',34,16,'caatinga'],['cabra',41,20,'caatinga'],['cabra',38,13,'caatinga'],['cabra',33,7,'caatinga'],['cabra',45,5,'caatinga']],
  itens:[['fumo',43,6],['rapadura',10,18],['rapadura',38,23],['rapadura',29,20],['cordel',21,8,'c1'],['cordel',2,4,'c2'],['cordel',46,23,'c3']],
  estado:()=>({hasFumo:false, thornsOpen:false, metCaipora:false}),
  objetivo:s=>t('f1.obj')[s.stage],
  bolsa:s=>s.hasFumo?[t('f1.fumo')]:[],
  intro:()=>t('f1.intro'),
  restaurar(){ if(S0.thornsOpen) trocarTiles('E',','); },
  falar(n){
    if(n.type==='avo') say(t('f1.avo'+Math.min(S0.stage,4)));
    else if(n.type==='caipora'){
      if(S0.thornsOpen){ say(t('f1.caiporaVai')); return; }
      const oi = S0.metCaipora ? [] : t('f1.caiporaOi');
      S0.metCaipora=true;
      if(S0.hasFumo) say(oi.concat(t('f1.caiporaFumo',{bencao:t(perfil.bonusVida?'f1.bencaoDeNovo':'f1.bencaoNova')})), abrirEspinheiro);
      else say(oi.concat(t('f1.caiporaPede')), ()=>{ if(S0.stage<2) setStage(2); });
    }
  },
  pegar(it){
    if(it.type!=='fumo') return false;
    S0.hasFumo=true; sfx.pick(); toast(t('f1.pegouFumo')); if(S0.stage<3) setStage(3);
    return true;
  },
  tick(){
    if(!S0.thornsOpen && p.y<4*T && p.x>21*T && p.x<27*T && avisoT<=0){ avisoT=5; toast(t('f1.fechado')); }
    if(S0.thornsOpen && p.y<T+4) sairDaFase(t('f1.saida'));
  },
  alvo(){
    const s=S0.stage;
    if(s===1||s===3) return npcs.find(n=>n.type==='caipora');
    if(s===2) return items.find(i=>i.type==='fumo');
    if(s===4) return {x:24*T, y:T};
    return null;
  },
},
{
  id:2, get nome(){ return t('f2.nome'); }, get resumo(){ return t('f2.resumo'); },
  musica:'rio', mapa:MAPA_2, spawn:[23,26],
  aberto:m=>m.map(r=>r.replace(/Q/g,'=')), pontosChave:[[23,0],[34,23]], fechadoAntes:[[23,0]],
  npcs:[['barqueiro',21,19]],
  zonas:{oeste:[1,18,20,27], poco:[28,18,46,27], norte:[1,2,46,8]},
  inimigos:[['jacare',6,20,'oeste'],['jacare',12,24,'oeste'],['jacare',4,26,'oeste'],['jacare',30,23,'poco'],['jacare',46,26,'poco'],['jacare',10,5,'norte'],['jacare',38,4,'norte']],
  itens:[['tabua',7,13],['tabua',3,22],['rapadura',15,26],['rapadura',30,19],['rapadura',40,4],['cordel',38,12,'c4'],['cordel',46,20,'c5'],['cordel',3,3,'c6']],
  chefe:{tipo:'caboclo', zona:[35,20,42,26], gatilho:[31,17,46,28]},
  estado:()=>({falouBarqueiro:false, tabuas:0, ponte:false}),
  objetivo:s=>t('f2.obj',{n:s.tabuas})[s.stage],
  bolsa:s=>s.tabuas && !s.ponte ? [t('f2.tabuas',{n:s.tabuas})] : [],
  intro:()=>t('f2.intro'),
  restaurar(){
    if(S0.ponte) trocarTiles('Q','=');
    if(S0.chefeVencido){ chefe.dead=true; if(!S0.got.includes('tc')) soltarTabua(); }
  },
  falar(n){
    if(n.type!=='barqueiro') return;
    const falta=3-S0.tabuas;
    if(!S0.falouBarqueiro) say(t('f2.barqExplica'), ()=>{ S0.falouBarqueiro=true; setStage(S0.tabuas>=3?3:2); });
    else if(S0.stage===2) say(t(falta===1?'f2.barqFalta1':'f2.barqFaltaN',{n:falta}));
    else if(S0.stage===3) say(t('f2.barqConserta'), consertarPonte);
    else say(t('f2.barqVai'));
  },
  pegar(it){
    if(it.type!=='tabua') return false;
    S0.tabuas++; sfx.pick();
    toast(S0.tabuas<3 ? t('f2.tabua',{n:S0.tabuas}) : t('f2.tresTabuas'));
    if(S0.falouBarqueiro) setStage(S0.tabuas>=3?3:2); else updateHud();
    return true;
  },
  tick(){
    const g=fase.chefe.gatilho;
    if(!S0.chefeVencido){
      if(dentro(p,g) && !chefe.active){
        if(!S0.chefeIntro){ S0.chefeIntro=true; say(t('f2.cabocloIntro'), ()=>{ chefe.active=true; updateHud(); }); }
        else { chefe.active=true; updateHud(); }
      } else if(chefe.active && !dentro(p,[g[0]-4,g[1]-4,g[2]+4,g[3]+4])){ chefe.active=false; chefe.estado='fundo'; chefe.alvo=null; updateHud(); }
    }
    if(S0.ponte && p.y<T+4) sairDaFase(t('f2.saida'));
  },
  vencerChefe(){
    chefe.dead=true; chefe.active=false; S0.chefeVencido=true;
    balls=balls.filter(b=>b.tipo!=='lama'); burst(chefe.x,chefe.y-8,'#cfe7f2',20,80); shake=.3; sfx.crash();
    soltarTabua(); updateHud();
    say(t('f2.cabocloVencido'));
    salvarPartida();
  },
  alvo(){
    const s=S0.stage;
    if(s===1||s===3) return npcs.find(n=>n.type==='barqueiro');
    if(s===2){
      let best=null, bd=1e9;
      for(const it of items) if(it.type==='tabua'){ const d=Math.hypot(it.x-p.x,it.y-p.y); if(d<bd){ bd=d; best=it; } }
      return best || (S0.chefeVencido ? null : {x:38*T, y:23*T});
    }
    if(s===4) return {x:24*T, y:T};
    return null;
  },
},
{
  id:3, get nome(){ return t('f3.nome'); }, get resumo(){ return t('f3.resumo'); },
  musica:'serra', mapa:MAPA_3, spawn:[24,31], retorno:{acima:13, x:24, y:14},
  pontosChave:[[24,5],[24,2]],
  npcs:[],
  zonas:{meio:[2,19,45,24], topo:[2,13,45,15], baixo:[2,29,45,32]},
  inimigos:[['morcego',10,21,'meio'],['morcego',22,20,'meio'],['morcego',36,22,'meio'],['morcego',30,14,'topo'],['morcego',13,14,'topo'],['cabra',14,30,'baixo'],['cabra',36,31,'baixo']],
  itens:[['rapadura',20,30],['rapadura',6,22],['rapadura',40,14],['cordel',44,24,'c7'],['cordel',11,5,'c8'],['cordel',2,14,'c9']],
  chefe:{tipo:'mula'},
  estado:()=>({hasFreio:false, avisoBrasa:false}),
  objetivo:s=>t('f3.obj')[s.stage],
  bolsa:s=>s.hasFreio?[t('f3.freio')]:[],
  intro:()=>t(heroi.imuneFogo?'f3.introImune':'f3.intro'),
  tom:()=>`rgba(140,40,10,${p.y<12*T?.14:.06})`,
  restaurar(){ if(S0.chefeVencido){ chefe.dead=true; soltarEncanto(24*T+8,7*T+8); } },
  falar(n){
    if(n.type==='moca') say(t('f3.moca'));
    else if(n.type==='boi' && !S0.won){ S0.won=true; setStage(4); say(t('f3.boi'), concluirFase); }
  },
  tick(){
    if(!S0.avisoBrasa && chao(p)==='b'){ S0.avisoBrasa=true; toast(t(heroi.imuneFogo?'f3.brasaImune':'f3.brasa'),3.2); }
    if(!S0.chefeVencido && p.y<11*T+6){
      if(!S0.chefeIntro){ S0.chefeIntro=true; say(t('f3.mulaIntro'), ()=>{ chefe.active=true; setStage(2); }); }
      else if(!chefe.active){ chefe.active=true; updateHud(); }
    }
  },
  vencerChefe(){
    chefe.dead=true; chefe.active=false; S0.chefeVencido=true; S0.hasFreio=true; fires=[]; balls=[];
    burst(chefe.x,chefe.y-8,'#ffd23a',24,90); burst(chefe.x,chefe.y-8,'#c4462c',18,70); shake=.4; sfx.crash();
    soltarEncanto(chefe.x,chefe.y);
    setStage(3);
    say(t('f3.mulaVencida'));
  },
  alvo(){
    const s=S0.stage;
    if(s===1) return p.y>25*T ? {x:5*T, y:25*T} : p.y>16*T ? {x:41*T, y:16*T} : {x:24*T, y:11*T};  // segue o zigue-zague da subida
    if(s===3) return npcs.find(n=>n.type==='boi');
    return null;
  },
},
];
const cordeisDaFase=f=>f.itens.filter(i=>i[0]==='cordel').map(i=>i[3]);
