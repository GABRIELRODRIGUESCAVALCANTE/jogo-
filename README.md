# Estrela do Sertão

Jogo de aventura em pixel art ambientado no sertão nordestino. O Boi Estrela fugiu na lua cheia: escolha seu vaqueiro ou sua vaqueira e atravesse a caatinga, o Velho Chico e a Serra do Fogo, encontrando criaturas do folclore brasileiro pelo caminho.

## Como jogar

Abra o `index.html` em qualquer navegador. Não precisa instalar nada.

| Ação | Teclado | Celular | Controle |
|---|---|---|---|
| Andar | Setas ou WASD | Direcional na tela (deslize o dedo; aceita diagonais) | Analógico ou direcional |
| Chicote | Espaço (ou J/Z) | Botão "Chicote" | A ou X |
| Falar / avançar diálogo | E (ou Enter) | Botão "Falar" | B ou Y |
| Pausar | Esc ou P | Botão "Pausar" | Start |

Nos menus, o controle também funciona: o direcional anda entre os botões, A confirma e B volta. No teclado, Esc volta para a tela anterior.

## Jogadores

A primeira tela pergunta **Quem vai jogar?**. Cada jogador tem nome, personagem, fases liberadas, recordes de tempo e folhetos de cordel encontrados. Use **+ Novo jogador** para criar outro (até 8) e **Apagar** para remover.

Os jogadores ficam salvos no próprio navegador (`localStorage`), sem senha e sem servidor. Por isso o progresso não passa de um aparelho para outro. Contas com senha e progresso na nuvem exigiriam um serviço de banco de dados, como Supabase ou Firebase.

## Personagens

| Personagem | Vida | Destaque |
|---|---|---|
| **Zé**, o vaqueiro | 3 | Equilibrado em tudo |
| **Luzia**, a aboiadora | 3 | A mais rápida; chicote curto que estala sem parar |
| **Tião**, o ferreiro | 4 | Lento, mas cada lambada tira o dobro |
| **Rosa**, a rezadeira | 3 | Corpo fechado: brasa e rastro de fogo não a queimam. Liberada ao vencer a Serra do Fogo |

Troque de personagem a qualquer momento em **Personagem**, no menu do jogador. A bênção da Caipora dá um coração extra que vale para todos os personagens daquele jogador.

## Fases

1. **A Caatinga**: areia, cactos, a mata da Caipora e o açude. Leve um rolo de fumo para a Caipora e ela abre o espinheiro do norte. Cuidado com as Cabras Cabriolas.
2. **O Velho Chico**: rio fundo, água rasa e lama (deixam você mais lento), juncos, carnaúbas e uma ponte quebrada. O barqueiro Bené precisa de três tábuas. Uma delas está com o **Caboclo d'água**, que só pode ser atingido quando sobe para fora do poço e atira bolas de lama. Jacarés tomam sol nas margens.
3. **A Serra do Fogo**: rocha, cascalho, fendas de fogo e campos de brasa que queimam (siga as pedras frias). Morcegos guardam a subida. No alto, a **Mula sem Cabeça**: desvie das investidas, espere ela ficar tonta depois de bater numa pedra e use o chicote. Com metade da vida ela se enfurece e solta anéis de fogo.

Vencer uma fase libera a seguinte. Uma seta na borda da tela aponta o próximo objetivo. A partida é salva sozinha: dá para sair pela pausa, fechar o navegador e escolher **Continuar** depois.

### Folhetos de cordel

Nove folhetos estão escondidos, três por fase. Cada um traz uma sextilha sobre a jornada. Um folheto lido fica guardado no jogador para sempre.

## Tecnologia

HTML, CSS e JavaScript puros, com Canvas 2D. Os sprites são desenhados em pixel art via código, e os efeitos sonoros e as trilhas (baião, xote e o tema dos chefes, com zabumba, triângulo, baixo e sanfona) são gerados com Web Audio. Não há etapa de build.

```
index.html          marcação das telas (jogadores, menu, personagens, fases, jogo)
css/jogo.css        estilos
js/base.js          constantes, armazenamento e primitivas de desenho
js/audio.js         efeitos e músicas
js/personagens.js   personagens jogáveis, atributos e sprites
js/terreno.js       legenda dos tiles, colisão, efeitos de terreno e desenho do mapa
js/entidades.js     NPCs, inimigos, chefes, itens e tiros
js/fases.js         cordéis, mapas e a lógica de cada fase
js/jogo.js          estado da partida, atualização e desenho do jogo
js/telas.js         HUD, diálogos, controles, menus, jogadores e o laço principal
```

Os scripts são carregados em ordem pelo `index.html` e compartilham o escopo global da página.

**Para criar uma fase**, desenhe o mapa em `js/fases.js` com os caracteres da legenda que está no topo de `js/terreno.js` e adicione um objeto em `FASES` com NPCs, inimigos, itens e os ganchos (`objetivo`, `intro`, `falar`, `pegar`, `tick`, `alvo`...). **Para criar um personagem**, adicione uma entrada em `PERSONAGENS` (em `js/personagens.js`) com atributos e cores, e inclua o id em `PERS_ORDEM`.

## Publicar no GitHub Pages

Em **Settings → Pages**, escolha a branch `main` e a pasta `/ (root)`. O jogo ficará disponível em `https://gabrielrodriguescavalcante.github.io/jogo-/`.
