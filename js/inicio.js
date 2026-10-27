'use strict';
/* ---------- INÍCIO ----------
  Carregado por último: todas as partes do jogo já existem quando a primeira tela abre. */
traduzirPagina(); montarTeclas(); aplicarOpcoes(); carregarPerfis(); labelSound();
if(perfis.lista.length) abrirPerfis(); else abrirNovo();
requestAnimationFrame(frame);
