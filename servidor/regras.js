'use strict';
// Menor tempo aceito no ranking em cada fase, em segundos: 85% do menor caminho a pé por todos os objetivos,
// na velocidade da Luzia (a mais rápida), mais o mínimo de cada luta com chefe.
// O teste tests/mapas.test.js recalcula esse caminho pelos mapas do jogo e avisa se algum valor ficou alto demais.
const TEMPO_MINIMO = { 1:12, 2:16, 3:17, 4:14, 5:10 };   // 5: Desafio dos Chefes (só as lutas, sem caminhada)
const CHEFE_MINIMO = { 1:0, 2:3, 3:4, 4:4 };
module.exports = { TEMPO_MINIMO, CHEFE_MINIMO };
