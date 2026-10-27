// Ranking local: ordena os jogadores do aparelho por tempo, por fase e por dificuldade.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { preparar, abrir } = require('./ajuda');

let A, J;
before(async()=>{ A=await preparar(); J=await abrir(A.browser,A.url); });
after(async()=>{ await A.fim(); });

test('ranking mostra os melhores tempos em ordem e destaca o jogador atual', async()=>{
  await J.criarJogador('Ana','tiao'); await J.criarJogador('Bia','luzia'); await J.criarJogador('Caio','ze');
  await J.ev(()=>{
    const [a,b,c]=perfis.lista;
    a.fases={1:{feita:true,tempos:{normal:150}},2:{feita:true,tempos:{normal:200}},3:{feita:true,tempos:{normal:300}},4:{feita:true,tempos:{normal:250}}};
    b.fases={1:{feita:true,tempos:{normal:95, facil:80}}};
    c.fases={1:{feita:true,tempos:{normal:120}}};
    salvarPerfis();
  });
  await J.page.click('#btnRanking');
  assert.equal(await J.ev(()=>telaAtual), 'telaRanking');
  assert.deepEqual(await J.page.locator('#listaRanking .quem b').allTextContents(), ['Bia','Caio','Ana']);
  assert.equal(await J.page.textContent('#listaRanking .eu .quem b'), 'Caio');
  await J.page.click('#difRanking [data-dif="facil"]');
  assert.deepEqual(await J.page.locator('#listaRanking .quem b').allTextContents(), ['Bia']);
  await J.page.click('#difRanking [data-dif="normal"]');
  await J.page.click('#abasRanking .aba >> nth=-1');            // jornada inteira
  assert.deepEqual(await J.page.locator('#listaRanking .tempo').allTextContents(), ['15:00']);
  await J.page.click('#abasRanking .aba >> nth=1');
  assert.deepEqual(await J.page.locator('#listaRanking .quem b').allTextContents(), ['Ana']);
  await J.page.click('#difRanking [data-dif="dificil"]');
  assert.ok(await J.page.isVisible('#vazioRanking'));
  assert.ok(!(await J.page.isVisible('#fonteRanking')), 'sem contas online, não há aba Mundial');
  assert.deepEqual(J.erros, []);
});
