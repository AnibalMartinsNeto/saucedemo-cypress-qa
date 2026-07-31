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

## Arquitetura do projeto

O projeto segue o padrão **Page Object Model (POM)**: os seletores e ações de cada página ficam isolados em classes próprias (`cypress/pages/`), então uma mudança de seletor exige alteração em um único lugar.

```
cypress/
├── e2e/                # Specs de teste
│   ├── login.cy.js        # Login obrigatório + matriz de comportamento por usuário
│   ├── sorting.cy.js       # Ordenação por preço
│   └── checkout.cy.js      # Fluxo de compra completo (E2E)
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

Além dos cenários obrigatórios, `login.cy.js` roda uma suíte adicional que valida, para todo usuário de teste do SauceDemo, que o app **não apresenta nenhum dos bugs conhecidos** (imagens duplicadas, menu torto, botão "Add to cart" fora da grade, login lento, botão que não responde ao clique). A regra é a mesma para todos: se o problema acontecer, o teste falha — é assim que um defeito real fica visível no relatório do Cypress, sem depender de "gabarito esperado" por usuário.

| Usuário | Bug conhecido (confirmado manualmente) |
|---|---|
| `standard_user` | Nenhum |
| `locked_out_user` | Login bloqueado (comportamento esperado, não é bug) |
| `problem_user` | 3 produtos com botão "Add to cart" que não responde ao clique |
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

## Uso de Inteligência Artificial

O histórico de prompts usados para estruturar este projeto está em [`PROMPTS.md`](./PROMPTS.md).
