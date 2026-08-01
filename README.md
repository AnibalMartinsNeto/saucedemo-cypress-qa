# SauceDemo – Automação de Testes E2E com Cypress

Projeto de automação de testes end-to-end para a aplicação [SauceDemo (Swag Labs)](https://www.saucedemo.com/), desenvolvido como Desafio Técnico para Analista de QA.

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- [Git](https://git-scm.com/)

```bash
node -v
npm -v
git --version
```

## Instalação

```bash
git clone <URL_DO_REPOSITORIO>
cd DesafioQA
npm install
```

## Executando os testes

**Modo interativo (interface gráfica):**

```bash
npm run cy:open
```

**Modo headless (linha de comando):**

```bash
npm test
```

**Modo headless em um navegador específico:**

```bash
npm run test:chrome
```

> Esses três comandos rodam só a suíte obrigatória do desafio (`login.cy.js`, `sorting.cy.js`, `checkout.cy.js`) — sempre 100% verde.

**Suíte diferencial de detecção de bugs** (explicada mais abaixo, roda separada porque vai além do que o desafio pede e pode acusar bugs reais do app):

```bash
npm run test:diagnostics
```

**Todos os specs de uma vez** (obrigatórios + diferencial, incluindo o que a suíte de diagnóstico encontrar):

```bash
npm run test:all
```

## Arquitetura do projeto

O projeto segue o padrão **Page Object Model (POM)**: os seletores e ações de cada página ficam isolados em classes próprias (`cypress/pages/`), então uma mudança de seletor exige alteração em um único lugar.

```
cypress/
├── e2e/                        # Specs de teste
│   ├── login.cy.js               # Login válido + login bloqueado (obrigatório)
│   ├── sorting.cy.js              # Ordenação por preço (obrigatório)
│   ├── checkout.cy.js             # Fluxo de compra completo (obrigatório)
│   └── user-behavior-matrix.cy.js # Detecção de bugs por usuário (diferencial, separado)
├── pages/               # Page Objects
│   ├── LoginPage.js
│   ├── InventoryPage.js
│   ├── CartPage.js
│   └── CheckoutPage.js
├── fixtures/             # Massa de dados
│   ├── users.json
│   └── userScenarios.json
└── support/              # Comandos customizados e setup
    ├── commands.js
    └── e2e.js
```

### Cenários obrigatórios cobertos

- **Login com sucesso** (`login.cy.js`): acesso válido com `standard_user`.
- **Login inválido** (`login.cy.js`): mensagem de erro ao logar com `locked_out_user`.
- **Fluxo de compra completo** (`checkout.cy.js`): login → adiciona 2 produtos diferentes → confere que os produtos certos estão no carrinho → checkout → confirmação ("Thank you for your order!").
- **Ordenação de produtos** (`sorting.cy.js`): ordenação "Price (low to high)" produz a lista de preços em ordem crescente.

### Matriz de comportamento por usuário (diferencial)

`user-behavior-matrix.cy.js` é uma suíte adicional, além do que o desafio pede. Cada usuário no fixture `userScenarios.json` declara um `expectedError`: a mensagem que deve aparecer em tela se o login falhar, ou `null` se o login deve funcionar. O primeiro teste de cada usuário só compara a tela com esse valor — não tem lógica diferente por usuário, é sempre a mesma checagem rodando contra um dado diferente. É isso que permite escalar: pra cobrir um usuário novo (ou vários), basta uma linha nova no fixture, sem tocar no código do teste.

Para quem consegue logar, a suíte segue validando — para todo usuário de teste do SauceDemo — que o app **não apresenta nenhum dos bugs conhecidos** (imagens duplicadas, menu torto, botão "Add to cart" fora da grade, login lento, botão que não responde ao clique). A regra também é a mesma para todos: se o problema acontecer, o teste falha — é assim que um defeito real fica visível no relatório do Cypress, sem depender de "gabarito esperado" por usuário.

> **Ao rodar `npm run test:diagnostics`, alguns testes podem aparecer em vermelho — isso não é um problema na automação.** A suíte roda exatamente a mesma checagem para todo usuário, sem nenhuma expectativa fixada por usuário no código. Os bugs na tabela abaixo foram encontrados por essa própria suíte e depois confirmados manualmente, um a um, direto no navegador — não foram programados pra dar erro. É por isso que ela fica fora do `npm test` padrão: os testes obrigatórios do desafio precisam ficar 100% verdes, e essa suíte, por capturar defeitos reais do app, não fica.

| Usuário | Bug conhecido (confirmado manualmente) |
|---|---|
| `standard_user` | Nenhum |
| `locked_out_user` | Login bloqueado (comportamento esperado, não é bug) |
| `problem_user` | Imagens de produto duplicadas; 3 produtos com botão "Add to cart" que não responde ao clique |
| `performance_glitch_user` | Login perceptivelmente mais lento |
| `error_user` | Mesmos 3 produtos do `problem_user` com botão sem resposta ao clique |
| `visual_user` | Menu (hamburger) torto e botão "Add to cart" do último produto ultrapassando a borda do card |

O login de cada usuário acontece uma única vez (`before()` com `testIsolation: false`); as checagens em si ficam centralizadas em `cypress/support/commands.js` como comandos customizados, reutilizáveis em qualquer spec.

Cada verificação é registrada em `cypress/results/user-behavior-log.json` (gerado localmente a cada execução, não versionado):

```json
{
  "timestamp": "2026-07-31T20:45:00.000Z",
  "user": "error_user",
  "check": "brokenAddToCartButtons",
  "actual": true,
  "passed": false,
  "extra": { "unresponsiveButtonCount": 3, "unresponsiveProducts": ["Sauce Labs Bolt T-Shirt", "..."] }
}
```

Isso serve como evidência: dá pra abrir o log depois e ver, por usuário e por checagem, o que foi observado e se passou — o log é gravado antes da asserção, então fica salvo mesmo quando o teste falha.

> As checagens visuais (menu torto, posição do botão) usam propriedades computadas de CSS/DOM (`getComputedStyle`, `getBoundingClientRect`), já que o projeto não usa uma ferramenta de regressão visual dedicada.

### Escalando para um cenário real (ex.: ERP)

A matriz acima usa 6 usuários fixos porque é assim que o SauceDemo disponibiliza — não existe uma API pra criar contas novas nesse app de demonstração. Mas o padrão de teste já foi pensado pra ser **orientado a dados por papel/estado**, não por identidade individual: o `describe` itera uma lista e aplica a mesma checagem pra cada item, sem `if` por nome de usuário no meio da lógica de asserção (só o `expectedError`, que decide se o teste espera uma mensagem de erro em tela ou o redirecionamento pro inventário).

Isso importa porque num sistema real com usuários criados dinamicamente (um ERP, por exemplo, onde contas novas surgem todo dia), a mesma estrutura se aplica — só a origem do usuário muda, de um fixture estático pra criação sob demanda via API, com limpeza depois do teste:

```js
// cypress/support/commands.js (exemplo conceitual — não conectado a
// nenhum backend real, ilustra como esse mesmo padrão escalaria)
Cypress.Commands.add("createUserWithRole", (role) => {
  return cy
    .request("POST", "/api/test-users", { role })
    .then((res) => res.body); // { username, password, role }
});

Cypress.Commands.add("deleteTestUser", (username) => {
  return cy.request("DELETE", `/api/test-users/${username}`);
});

// cypress/e2e/permissions.cy.js
const ROLES = ["financeiro", "vendas", "admin", "bloqueado"];

ROLES.forEach((role) => {
  describe(`Usuário com papel: ${role}`, () => {
    let user;

    before(() => {
      cy.createUserWithRole(role).then((created) => {
        user = created;
        cy.login(user.username, user.password);
      });
    });

    after(() => {
      cy.deleteTestUser(user.username);
    });

    it("só acessa os módulos permitidos pro papel", () => {
      cy.checkAccessMatches(role); // mesma lógica de checagem, dado dinâmico
    });
  });
});
```

A lista de papéis e a lógica de checagem continuam sendo dados, iterados da mesma forma que `userScenarios.json` é hoje — só a fonte do usuário deixa de ser um fixture fixo e passa a ser criada (e descartada) a cada execução, isolando os dados de teste dos usuários reais criados no dia a dia.

## Uso de Inteligência Artificial

O histórico de prompts usados para estruturar este projeto está em [`PROMPTS.md`](./PROMPTS.md).
