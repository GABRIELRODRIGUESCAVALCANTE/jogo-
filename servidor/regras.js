'use strict';
// Menor tempo aceito no ranking em cada fase, em segundos: 85% do menor caminho a pé por todos os objetivos,
// com o herói mais rápido em cada fase (o Raio com a arrancada, ou o Calango cortando caminho pelas pedras),
// mais o mínimo de cada luta com chefe.
// O teste tests/mapas.test.js recalcula esse caminho pelos mapas do jogo e avisa se algum valor ficou alto demais.
const TEMPO_MINIMO = { 1:7, 2:11, 3:11, 4:10, 5:8 };   // 5: Desafio dos Chefes (só as lutas, sem caminhada)
const CHEFE_MINIMO = { 1:0, 2:3, 3:4, 4:4 };
module.exports = { TEMPO_MINIMO, CHEFE_MINIMO };
