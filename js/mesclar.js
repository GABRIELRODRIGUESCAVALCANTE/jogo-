'use strict';
// Junta dois progressos do mesmo jogador sem perder nada: fases feitas, melhores tempos, cordéis, conquistas e contadores.
// As escolhas (personagem, dificuldade, visual) vêm de "novo". O mesmo arquivo existe em js/mesclar.js (jogo) e
// servidor/mesclar.js (API); o teste tests/codigo.test.js confere que os dois são iguais.
function maiorDeCada(a, b){
  if(typeof a==='number' || typeof b==='number') return Math.max(Number(a)||0, Number(b)||0);
  const r = {};
  for(const k of new Set([...Object.keys(a||{}), ...Object.keys(b||{})])) r[k] = maiorDeCada((a||{})[k], (b||{})[k]);
  return r;
}
function mesclarProgresso(novo, velho){
  const r = Object.assign({}, velho, novo), a = novo.fases||{}, b = velho.fases||{};
  r.fases = {};
  for(const id of new Set([...Object.keys(a), ...Object.keys(b)])){
    const tempos = {};
    for(const reg of [a[id]||{}, b[id]||{}]){
      const ts = Object.assign(reg.tempo>0 ? {normal:reg.tempo} : {}, reg.tempos);
      for(const [d,v] of Object.entries(ts)) if(v>0 && !(tempos[d]<=v)) tempos[d] = v;
    }
    r.fases[id] = { feita:!!((a[id]||{}).feita || (b[id]||{}).feita), tempos };
  }
  r.cordeis = [...new Set([...(velho.cordeis||[]), ...(novo.cordeis||[])])];
  r.conquistas = Object.assign({}, velho.conquistas);
  for(const [k,v] of Object.entries(novo.conquistas||{})) if(!(r.conquistas[k]<=v)) r.conquistas[k] = v;
  r.fezCom = [...new Set([...(velho.fezCom||[]), ...(novo.fezCom||[])])];
  r.estat = maiorDeCada(novo.estat, velho.estat);
  r.bonusVida = Math.max(novo.bonusVida||0, velho.bonusVida||0);
  r.fim = !!(novo.fim || velho.fim);
  const dn = (novo.desafio||{}).tempos||{}, dv = (velho.desafio||{}).tempos||{}, desafio = {};
  for(const [d,v] of [...Object.entries(dv), ...Object.entries(dn)]) if(v>0 && !(desafio[d]<=v)) desafio[d] = v;
  if(Object.keys(desafio).length) r.desafio = { tempos:desafio };
  return r;
}
if(typeof module!=='undefined') module.exports = { mesclarProgresso };
