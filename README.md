# Estrela do Sertão

Jogo de aventura web ambientado no sertão nordestino. Zé, um jovem vaqueiro, atravessa a caatinga em busca do Boi Estrela e encontra criaturas do folclore brasileiro pelo caminho.

## Como jogar

Abra o `index.html` em qualquer navegador. Não precisa instalar nada.

| Ação | Teclado | Celular | Controle |
|---|---|---|---|
| Andar | Setas ou WASD | Direcional na tela (deslize o dedo; aceita diagonais) | Analógico ou direcional |
| Chicote | Espaço (ou J/Z) | Botão "Chicote" | A ou X |
| Falar / avançar diálogo | E (ou Enter) | Botão "Falar" | B ou Y |
| Pausar | Esc ou P | Botão "Pausar" | Start |

O jogo pausa sozinho quando você troca de aba ou de aplicativo. O progresso fica salvo no navegador: na volta, é só escolher **Continuar jornada**.

## A jornada

1. **Vô Chico** conta que o Boi Estrela fugiu para a Serra do Fogo, mas o caminho do norte está fechado por espinheiros.
2. **Caipora**, a guardiã da mata (a oeste), abre a passagem se você trouxer um rolo de fumo. Não bata nela!
3. O fumo está na caatinga (a leste), no meio das **Cabras Cabriolas**.
4. Na serra, enfrente a **Mula sem Cabeça**: desvie das investidas e do rastro de fogo. Quando ela bate numa pedra fica tonta, e só então o chicote faz efeito.
5. Arranque o freio de ferro, quebre o encanto e leve o Boi Estrela de volta.

Quando a Mula perde metade da vida, ela se enfurece: as investidas ficam mais rápidas e, ao sair da tontura, ela solta um anel de bolas de fogo. Quando ela pisca, afaste-se. Uma linha vermelha mostra para onde ela vai investir.

Uma seta na borda da tela aponta para o próximo objetivo.

### Folhetos de cordel

Cinco folhetos de cordel estão escondidos pelo mapa, da mata à Serra do Fogo. Cada um traz uma sextilha sobre a jornada. A tela final mostra quantos você achou, junto com o tempo e o seu recorde.

## Tecnologia

Um único arquivo HTML com Canvas 2D e JavaScript puro. Os sprites são desenhados em pixel art via código. Os efeitos sonoros e a trilha em ritmo de baião (zabumba, triângulo, baixo e sanfona, em sol mixolídio) são gerados com Web Audio. Música e efeitos podem ser desligados separadamente. Progresso, recorde e preferências de som ficam no `localStorage`.

## Publicar no GitHub Pages

Em **Settings → Pages**, escolha a branch `main` e a pasta `/ (root)`. O jogo ficará disponível em `https://gabrielrodriguescavalcante.github.io/jogo-/`.
