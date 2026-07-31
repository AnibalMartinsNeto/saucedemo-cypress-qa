# Histórico de Prompts

Registro dos principais prompts usados com IA (Claude) durante o desenvolvimento deste projeto. Comecei numa conversa e precisei trocar pra outra no meio do caminho (limite de mensagens), então esse histórico junta as duas, na ordem em que as decisões foram tomadas.

## 1. Ponto de partida

Já cheguei com a estrutura do projeto montada — Page Object Model em `cypress/pages/` (`LoginPage`, `InventoryPage`, `CartPage`, `CheckoutPage`), specs esqueletadas em `cypress/e2e/` (login, sorting, checkout) cobrindo os 4 cenários obrigatórios do desafio, `cypress.config.js` com `baseUrl` configurado e fixtures de usuário criadas. A partir daí um dos testes estava com erro de seletor, e foi esse o primeiro ponto que levei pra IA:

**Prompt:**
> "Já tenho a estrutura do projeto pronta (Page Object Model, specs de login/sorting/checkout, config). Um teste está falhando ao tentar achar o ícone dentro do botão do menu (`.find("div, span")` não encontra nada). Segue o erro e o print do DOM — me ajuda a entender o motivo?"

**Resultado:** o ícone do menu é um elemento irmão do botão, não filho — por isso o seletor nunca encontrava nada. Ajustei o seletor comparando com o DOM real da aplicação.

## 2. Definindo a arquitetura da suíte por usuário

**Prompt:**
> "Quero manter só login, sorting e checkout como specs de teste. E pro login: preciso que aconteça uma única vez por usuário e que todas as validações daquele usuário rodem em sequência depois — sem logar de novo a cada verificação."

**Resultado:** decisão de arquitetura pra suíte de comportamento por usuário — um login por usuário, todas as checagens em sequência sem repetição.

## 3. Ajustando o padrão até ficar legível

Uma primeira tentativa usando `cy.session()` quebrou (o app troca a URL pra `/inventory.html` só via JS no client, então revisitar essa URL direto pra restaurar sessão dá 404).

**Prompt:**
> "O nome genérico que ficou nos testes ('deve se comportar conforme o gabarito esperado') não ajuda em nada pra entender o que quebrou no relatório. Preciso de nomes de teste descritivos, um por verificação, mas sem perder o requisito de logar só uma vez por usuário."

**Resultado:** padrão final — `describe` por usuário com `{ testIsolation: false }` e um `before()` fazendo login uma única vez; cada `it()` seguinte é uma checagem isolada e com nome legível, sem repetir login.

## 4. Erro tem que aparecer como erro, não virar "cenário aceito"

**Prompt:**
> "Os botões 'Add to cart' de alguns usuários não estão respondendo ao clique, e a suíte está tratando isso como resultado esperado só pra passar. Isso está errado: se o clique não muda o estado do botão, isso é um bug e precisa falhar o teste e ficar registrado no log, não virar um cenário aceito."

**Resultado:** reformulei a lógica de asserção — toda checagem passa a exigir "sem bug" pra qualquer usuário, sem comparação com um "gabarito esperado" por usuário (esse modelo anterior escondia bugs reais quando coincidiam com o que estava marcado como esperado).

## 5. Mapeando os bugs reais de cada usuário

**Prompt:**
> "Depois de testar manualmente cada usuário do SauceDemo, esse é o comportamento real que encontrei: `visual_user` tem o menu torto e o botão 'Add to cart' do último produto fora do lugar (precisa validar em todos os produtos, não só um); `error_user` tem o mesmo problema de posição do botão; `performance_glitch_user` tem login perceptivelmente lento e isso precisa aparecer como falha; `problem_user` tem imagens de produto duplicadas; `standard_user` não tem nenhum bug; `locked_out_user` deve mostrar mensagem de erro no login. Atualiza a suíte pra refletir exatamente isso."

**Resultado:** fixture `userScenarios.json` e as checagens de `commands.js` revisadas uma a uma pra bater com esse levantamento.

## 6. Validação ao vivo pra eliminar resultados inconsistentes

**Prompt:**
> "Os resultados de clique e posição do botão estão inconsistentes entre `problem_user` e `error_user`, e não estou conseguindo confiar no que a suíte está reportando. Consegue testar direto no navegador, clique por clique, pra confirmar o que é bug real e o que é falha na checagem?"

**Resultado:** com o navegador conectado, testei cada botão manualmente, com sessão limpa, e confirmei: 3 produtos específicos (Bolt T-Shirt, Fleece Jacket, Test.allTheThings T-Shirt) têm o botão realmente quebrado tanto no `problem_user` quanto no `error_user`, e o `visual_user` realmente tem o botão do último produto ultrapassando a borda do card. Também identifiquei que o carrinho pode vazar de uma sessão pra outra do mesmo usuário se cookies/localStorage não forem limpos antes do login — corrigido com `cy.clearCookies()` / `cy.clearLocalStorage()` no comando de login.

## 7. Revisão final e publicação

**Prompt:**
> "Suíte terminada. Quero fazer uma revisão final: confere ponto a ponto se cobre tudo que o enunciado do desafio pede, revisa a validação do carrinho no checkout (confirma se está checando os produtos certos, não só a quantidade), limpa os comentários do código deixando só o que ajuda a entender a lógica, e atualiza o README com pré-requisitos, comandos de execução e a explicação da arquitetura."

**Resultado:** suíte conferida contra o enunciado, validação do carrinho no checkout melhorada (confere os produtos pelo nome, não só a quantidade), comentários redundantes removidos, README reescrito com instalação/comandos/arquitetura, e projeto publicado num repositório público no GitHub.

---

### Sobre revisão do código gerado

Todo trecho sugerido pela IA foi conferido manualmente antes de entrar no projeto — seletores comparados com o DOM real do SauceDemo, comportamento validado rodando a suíte e, nos pontos mais duvidosos, testando manualmente no navegador antes de confiar na checagem automatizada.
