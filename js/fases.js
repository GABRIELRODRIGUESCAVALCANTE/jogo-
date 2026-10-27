'use strict';
/* ---------- FOLHETOS DE CORDEL ---------- */
const CORDEIS={
  c1:['O Vaqueiro',['Lá no sertão, quando chove,','o mandacaru dá flor;','quando a seca vem de novo,','o vaqueiro, com valor,','encoura o peito e segue','tangendo o gado sem temor.']],
  c2:['A Caipora',['Montada num caititu','a Caipora vem ligeira,','protege bicho do mato,','apaga rastro e poeira;','quem lhe traz fumo de rolo','ganha a mata companheira.']],
  c3:['A Cabra Cabriola',['A Cabra Cabriola berra','soltando fogo na venta,','de noite ronda as porteiras','atrás de gente desatenta;','quem anda sem ter cuidado','na caatinga não se aguenta.']],
  c4:['O Velho Chico',['Ô Velho Chico, rio grande,','água doce do sertão,','leva barco e leva peixe,','molha a roça e o feijão;','quem atravessa o teu leito','leva o rio no coração.']],
  c5:["O Caboclo d'água",['No fundo do Velho Chico','o Caboclo faz morada,','vira canoa e rasga rede','na calada da noitada;','mas se sobe pra brigar','leva lambada caprichada.']],
  c6:['A Carranca',['Na proa de cada barco','vai a carranca encarando,','cara feia, dente à mostra,','os encantos espantando;','com ela o barqueiro passa','o rio inteiro cantando.']],
  c7:['A Serra do Fogo',['Na Serra do Fogo a pedra','arde feito um tição,','morcego dorme na loca,','brasa estala pelo chão;','quem sobe sem ter medo','vence a serra e o sertão.']],
  c8:['A Mula sem Cabeça',['Galopa a Mula sem Cabeça','com fogo em vez de focinho,','derruba cerca e porteira,','queima o mato do caminho;','quem arranca o freio dela','quebra o encanto daninho.']],
  c9:['O Boi Estrela',['Ê boi, ê Boi Estrela,','estrela de ouro na testa,','quando ele volta pro curral','o sertão inteiro é festa:','tem zabumba, tem sanfona','e forró até a sesta.']],
};

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
  falar(npc) · pegar(item) → true se tratou · tick(dt) gatilhos · vencerChefe() · restaurar() ao continuar · alvo() da seta */
function sairDaFase(falas){ if(S0.saindo) return; S0.saindo=true; say(falas,concluirFase); }
const dentro=(e,r)=>e.x>=r[0]*T && e.x<(r[2]+1)*T && e.y>=r[1]*T && e.y<(r[3]+1)*T;

function abrirEspinheiro(){
  S0.thornsOpen=true; S0.hasFumo=false;
  if(!perfil.bonusVida){ perfil.bonusVida=1; salvarPerfis(); S0.maxHp++; }
  S0.hp=S0.maxHp;
  for(let ty=0;ty<MH;ty++) for(let tx=0;tx<MW;tx++) if(map[ty][tx]==='E') burst(tx*T+8,ty*T+8,'#5e4a36',8);
  trocarTiles('E',','); sfx.pick(); setStage(4); toast('O espinheiro do norte se abriu!');
}
function consertarPonte(){
  for(let ty=0;ty<MH;ty++) for(let tx=0;tx<MW;tx++) if(map[ty][tx]==='Q') burst(tx*T+8,ty*T+8,'#9a6a3a',8);
  trocarTiles('Q','='); S0.ponte=true; sfx.ponte(); setStage(4); toast('A ponte está de pé!');
}
function soltarTabua(){ items.push(Object.assign({type:'tabua', id:'tc'}, nearestFree(34,23))); }
function soltarEncanto(x,y){ npcs.push(npcNovo('moca',x,y)); npcs.push(npcNovo('boi',24*T+8,2*T+10)); }

const FASES=[
{
  id:1, nome:'A Caatinga', resumo:'Ganhe a ajuda da Caipora e escape das Cabras Cabriolas para abrir o caminho do norte.',
  musica:'sertao', mapa:MAPA_1, spawn:[23,20],
  npcs:[['avo',21,19],['caipora',6,9]],
  zonas:{caatinga:[14,4,46,23]},
  inimigos:[['cabra',36,5,'caatinga'],['cabra',40,9,'caatinga'],['cabra',44,12,'caatinga'],['cabra',34,16,'caatinga'],['cabra',41,20,'caatinga'],['cabra',38,13,'caatinga'],['cabra',33,7,'caatinga'],['cabra',45,5,'caatinga']],
  itens:[['fumo',43,6],['rapadura',10,18],['rapadura',38,23],['rapadura',29,20],['cordel',21,8,'c1'],['cordel',2,4,'c2'],['cordel',46,23,'c3']],
  estado:()=>({hasFumo:false, thornsOpen:false, metCaipora:false}),
  objetivo:s=>['','Encontre a Caipora na mata, a oeste','Ache o rolo de fumo na caatinga, a leste','Leve o fumo para a Caipora, na mata a oeste','Siga pelo espinheiro aberto, ao norte, rumo ao Velho Chico'][s.stage],
  bolsa:s=>s.hasFumo?['Rolo de fumo']:[],
  intro(){ const h=heroi; return [
    ['Vô Chico',`${h.nome}, ${ao(h.g,'meu neto','minha neta')}! O Boi Estrela arrebentou a cerca na lua cheia e sumiu rumo à Serra do Fogo, depois do Velho Chico.`],
    ['Vô Chico','Dizem que por lá anda uma Mula sem Cabeça, soltando fogo pelo pescoço.'],
    ['Vô Chico','O caminho do norte tá fechado de espinheiro. Só a Caipora, dona da mata, sabe abrir passagem. Ela vive a oeste.'],
    ['Vô Chico',`Leva teu chicote e cuidado com as Cabras Cabriolas da caatinga. Elas não perdoam ${ao(h.g,'menino desatento','menina desatenta')}.`],
    ['Vô Chico','Ah, e o vento espalhou meus folhetos de cordel pelo caminho. Se achar algum, lê pra mim depois.'],
  ]; },
  restaurar(){ if(S0.thornsOpen) trocarTiles('E',','); },
  falar(n){
    const h=heroi;
    if(n.type==='avo'){
      const s=S0.stage;
      if(s===1) say([['Vô Chico',`A Caipora mora na mata, a oeste. Vai lá, ${ao(h.g,'menino','menina')}, que o Estrela não espera.`]]);
      else if(s===2) say([['Vô Chico','Fumo? A Caipora é doida por um rolo. Procura na caatinga, a leste, mas cuidado com as cabras.']]);
      else if(s===3) say([['Vô Chico','Achou o fumo! Leva pra Caipora antes que ela mude de ideia.']]);
      else say([['Vô Chico','O espinheiro abriu! Segue pro norte até o Velho Chico. O barqueiro Bené vai te ajudar a atravessar.']]);
    } else if(n.type==='caipora'){
      if(S0.thornsOpen){ say([['Caipora',`Vai, ${h.trato}. O rio fica ao norte, depois do espinheiro.`]]); return; }
      const greet = S0.metCaipora ? [] : [
        ['Caipora','Quem entra na minha mata sem pedir licença?'],
        ['Caipora',`Hum... ${ao(h.g,'um','uma')} ${h.trato} atrás de boi. Os bichos me contaram.`],
      ];
      S0.metCaipora=true;
      if(S0.hasFumo) say(greet.concat([
        ['Caipora','Ah, esse cheiro! Fumo de rolo do bom.'],
        ['Caipora','Trato é trato. O espinheiro do norte já se abriu pra você.'],
        ['Caipora', perfil.bonusVida ? 'E toma de novo a força da mata: teus corações tão cheinhos.' : 'E leva essa força da mata: mais um coração no peito, pra sempre.'],
        ['Caipora','Lá na Serra, a Mula não é bicho, é encanto. Arranca o freio de ferro dela e o encanto quebra.'],
      ]), abrirEspinheiro);
      else say(greet.concat([
        ['Caipora','Eu abro o espinheiro pra você. Mas Caipora não trabalha de graça: me traz um rolo de fumo.'],
        ['Caipora','O vento diz que tem um caído na caatinga, a leste, no meio das Cabras Cabriolas.'],
      ]), ()=>{ if(S0.stage<2) setStage(2); });
    }
  },
  pegar(it){
    if(it.type!=='fumo') return false;
    S0.hasFumo=true; sfx.pick(); toast('Você pegou um rolo de fumo!'); if(S0.stage<3) setStage(3);
    return true;
  },
  tick(){
    if(!S0.thornsOpen && p.y<4*T && p.x>21*T && p.x<27*T && avisoT<=0){ avisoT=5; toast('Espinheiro fechado. Só a Caipora abre essa passagem.'); }
    if(S0.thornsOpen && p.y<T+4) sairDaFase([[heroi.nome,'Lá adiante corre o Velho Chico. Depois dele, a Serra do Fogo.']]);
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
  id:2, nome:'O Velho Chico', resumo:"Conserte a ponte do Rio São Francisco e tome a última tábua do Caboclo d'água.",
  musica:'rio', mapa:MAPA_2, spawn:[23,26],
  npcs:[['barqueiro',21,19]],
  zonas:{oeste:[1,18,20,27], poco:[28,18,46,27], norte:[1,2,46,8]},
  inimigos:[['jacare',6,20,'oeste'],['jacare',12,24,'oeste'],['jacare',4,26,'oeste'],['jacare',30,23,'poco'],['jacare',46,26,'poco'],['jacare',10,5,'norte'],['jacare',38,4,'norte']],
  itens:[['tabua',7,13],['tabua',3,22],['rapadura',15,26],['rapadura',30,19],['rapadura',40,4],['cordel',38,12,'c4'],['cordel',46,20,'c5'],['cordel',3,3,'c6']],
  chefe:{tipo:'caboclo', zona:[35,20,42,26], gatilho:[31,17,46,28]},
  estado:()=>({falouBarqueiro:false, tabuas:0, ponte:false}),
  objetivo:s=>['','Fale com o barqueiro, perto da ponte quebrada',`Junte as tábuas para consertar a ponte (${s.tabuas}/3)`,'Leve as tábuas para o barqueiro, na ponte','Atravesse a ponte e siga para a Serra do Fogo, ao norte'][s.stage],
  bolsa:s=>s.tabuas && !s.ponte ? [`Tábuas ${s.tabuas}/3`] : [],
  intro:()=>[[heroi.nome,'O Velho Chico! Tão largo que a outra margem parece outro mundo.'],[heroi.nome,'A ponte tá quebrada no meio... Aquele barqueiro ali deve saber o que aconteceu.']],
  restaurar(){
    if(S0.ponte) trocarTiles('Q','=');
    if(S0.chefeVencido){ chefe.dead=true; if(!S0.got.includes('tc')) soltarTabua(); }
  },
  falar(n){
    if(n.type!=='barqueiro') return;
    const h=heroi, B='Barqueiro Bené', falta=3-S0.tabuas;
    if(!S0.falouBarqueiro){
      say([
        [B,`Ô ${ao(h.g,'moço','moça')}! Quer atravessar? A ponte quebrou.`],
        [B,"Foi o Caboclo d'água. Subiu do fundo numa noite de lua e arrancou as tábuas do meio."],
        [B,'Me traz três tábuas que eu conserto num instante. Uma ficou na ilha do oeste: dá pra chegar pelo raso.'],
        [B,'Outra rolou pra beira, lá onde os jacarés tomam sol. E a terceira o Caboclo levou pro poço dele, a leste.'],
        [B,'Ele só se mostra quando sobe pra fora d’água. É aí que tem que acertar.'],
      ], ()=>{ S0.falouBarqueiro=true; setStage(S0.tabuas>=3?3:2); });
    }
    else if(S0.stage===2) say([[B,`Ainda falta${falta>1?'m':''} ${falta} tábua${falta>1?'s':''}. Uma na ilha do oeste, uma com os jacarés e a do Caboclo, no poço a leste.`]]);
    else if(S0.stage===3) say([[B,'Boas tábuas! Segura aí que eu prego num instante.']], consertarPonte);
    else say([[B,`Vai com Deus, ${h.trato}. Depois da vereda começa a Serra do Fogo.`]]);
  },
  pegar(it){
    if(it.type!=='tabua') return false;
    S0.tabuas++; sfx.pick();
    toast(S0.tabuas<3 ? `Tábua ${S0.tabuas} de 3` : 'Três tábuas! Leve-as para o barqueiro.');
    if(S0.falouBarqueiro) setStage(S0.tabuas>=3?3:2); else updateHud();
    return true;
  },
  tick(){
    const g=fase.chefe.gatilho;
    if(!S0.chefeVencido){
      if(dentro(p,g) && !chefe.active){
        if(!S0.chefeIntro){
          S0.chefeIntro=true;
          say([
            [heroi.nome,'A água do poço tá borbulhando...'],
            ["Caboclo d'água",`Quem vem buscar minha tábua? Chega mais, que eu te molho ${ao(heroi.g,'todinho','todinha')}!`],
            ['Dica','Ele só pode ser atingido quando está fora d’água. Fique na margem e desvie das bolas de lama.'],
          ], ()=>{ chefe.active=true; updateHud(); });
        } else { chefe.active=true; updateHud(); }
      } else if(chefe.active && !dentro(p,[g[0]-4,g[1]-4,g[2]+4,g[3]+4])){ chefe.active=false; chefe.estado='fundo'; chefe.alvo=null; updateHud(); }
    }
    if(S0.ponte && p.y<T+4) sairDaFase([[heroi.nome,'Lá em cima, a Serra do Fogo soltando fumaça. O Estrela tá perto.']]);
  },
  vencerChefe(){
    chefe.dead=true; chefe.active=false; S0.chefeVencido=true;
    balls=balls.filter(b=>b.tipo!=='lama'); burst(chefe.x,chefe.y-8,'#cfe7f2',20,80); shake=.3; sfx.crash();
    soltarTabua(); updateHud();
    say([["Caboclo d'água",'Tá bom, tá bom! Leva essa tábua e me deixa em paz no meu poço.'],[heroi.nome,'Trato feito. Agora é consertar a ponte.']]);
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
  id:3, nome:'A Serra do Fogo', resumo:'Suba a serra entre brasas e morcegos e quebre o encanto da Mula sem Cabeça.',
  musica:'serra', mapa:MAPA_3, spawn:[24,31], retorno:{acima:13, x:24, y:14},
  npcs:[],
  zonas:{meio:[2,19,45,24], topo:[2,13,45,15], baixo:[2,29,45,32]},
  inimigos:[['morcego',10,21,'meio'],['morcego',22,20,'meio'],['morcego',36,22,'meio'],['morcego',30,14,'topo'],['morcego',13,14,'topo'],['cabra',14,30,'baixo'],['cabra',36,31,'baixo']],
  itens:[['rapadura',20,30],['rapadura',6,22],['rapadura',40,14],['cordel',44,24,'c7'],['cordel',11,5,'c8'],['cordel',2,14,'c9']],
  chefe:{tipo:'mula'},
  estado:()=>({hasFreio:false, avisoBrasa:false}),
  objetivo:s=>['','Suba a Serra do Fogo até o alto','Golpeie a Mula sem Cabeça quando ela ficar tonta','Encontre o Boi Estrela no alto da serra','Ê boi! O Estrela está a salvo'][s.stage],
  bolsa:s=>s.hasFreio?['Freio de ferro']:[],
  intro:()=>[[heroi.nome,'A Serra do Fogo. Até as pedras soltam fumaça.'],
    [heroi.nome, heroi.imuneFogo ? 'Brasa não me queima, tenho o corpo fechado. Mas esses morcegos...' : 'Melhor pisar nas pedras frias e fugir das brasas.']],
  tom:()=>`rgba(140,40,10,${p.y<12*T?.14:.06})`,
  restaurar(){ if(S0.chefeVencido){ chefe.dead=true; soltarEncanto(24*T+8,7*T+8); } },
  falar(n){
    if(n.type==='moca') say([['Moça',`Teu boi tá logo ali em cima, ${heroi.trato}. Obrigada por me libertar.`]]);
    else if(n.type==='boi' && !S0.won){
      S0.won=true; setStage(4);
      say([['Boi Estrela','Muuuuu!'],[heroi.nome,'Bora pra casa, Estrela. O sertão inteiro vai saber dessa história.']], concluirFase);
    }
  },
  tick(){
    if(!S0.avisoBrasa && chao(p)==='b'){ S0.avisoBrasa=true; toast(heroi.imuneFogo ? `${heroi.nome} tem o corpo fechado: a brasa não queima.` : 'Brasa! Procure as pedras frias para não se queimar.',3.2); }
    if(!S0.chefeVencido && p.y<11*T+6){
      if(!S0.chefeIntro){
        S0.chefeIntro=true;
        say([
          [heroi.nome,'Um tropel de cascos... e cheiro de fogo no ar.'],
          [heroi.nome,'É a Mula sem Cabeça! O Estrela deve estar preso atrás dela.'],
          ['Dica','Desvie das investidas: a linha vermelha mostra para onde ela vai correr.'],
          ['Dica','Quando ela bater numa pedra ou parede, fica tonta. É a hora do chicote!'],
        ], ()=>{ chefe.active=true; setStage(2); });
      } else if(!chefe.active){ chefe.active=true; updateHud(); }
    }
  },
  vencerChefe(){
    chefe.dead=true; chefe.active=false; S0.chefeVencido=true; S0.hasFreio=true; fires=[]; balls=[];
    burst(chefe.x,chefe.y-8,'#ffd23a',24,90); burst(chefe.x,chefe.y-8,'#c4462c',18,70); shake=.4; sfx.crash();
    soltarEncanto(chefe.x,chefe.y);
    setStage(3);
    say([
      [heroi.nome,'Peguei o freio de ferro!'],
      ['Moça',`O encanto se quebrou! Eu era a Mula, ${heroi.trato}, e agora voltei a ser gente.`],
      ['Moça','Teu boi tá logo ali em cima, assustado, mas inteiro.'],
    ]);
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
