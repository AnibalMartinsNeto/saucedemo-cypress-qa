import scenarios from "../fixtures/userScenarios.json";

// Suíte diferencial: valida, para cada usuário de teste do SauceDemo, que
// o app não apresenta nenhum dos bugs conhecidos (imagens duplicadas,
// menu torto, botão fora da grade, login lento, clique sem resposta).
//
// IMPORTANTE: diferente da suíte obrigatória (login.cy.js), este spec pode
// ficar vermelho — a mesma checagem roda pra todo usuário, sem nenhuma
// expectativa fixada por usuário no código, e problem_user, error_user e
// visual_user têm bugs reais no app (confirmados manualmente, um a um).
// Por isso roda separado, via `npm run test:diagnostics`, e não faz parte
// do `npm test` padrão. Detalhes em README.md.

// O tempo aqui conta desde antes do clique em "Login" até o app confirmar
// o resultado na tela (form + clique + redirecionamento), então inclui a
// sobrecarga normal do Cypress rodando headless com gravação de vídeo —
// por isso o limite não pode ser 2000ms (login normal já beira isso).
// 4000ms ainda deixa uma margem folgada abaixo do delay proposital do
// performance_glitch_user (~6s), então continua detectando o caso real.
const PERFORMANCE_THRESHOLD_MS = 4000;

describe("Comportamento por tipo de usuário (matriz de cenários)", () => {
  scenarios.forEach((scenario) => {
    // Login único por usuário: o describe desliga o testIsolation, então
    // o Cypress não reseta cookies/DOM entre os "it"s seguintes — cada
    // verificação continua de onde a anterior parou, sem logar de novo.
    describe(`Usuário: ${scenario.username}`, { testIsolation: false }, () => {
      // Guarda a duração do login numa variável comum (closure), não num
      // alias do Cypress: na prática, alias criado com .as() não fica
      // disponível de forma confiável de um "it" para outro, mesmo com
      // testIsolation:false (só o estado da página persiste). Uma
      // variável JS normal funciona porque o describe roda uma vez só e
      // o before()/it()s abaixo compartilham esse mesmo escopo.
      let loginDurationMs;

      before(() => {
        const loginStartedAt = Date.now();
        cy.login(scenario.username, scenario.password);

        // Só medimos quando o login deve funcionar; se o cenário espera
        // erro, não existe redirecionamento pra esperar.
        if (!scenario.expectedError) {
          cy.url({ timeout: 15000 })
            .should("include", "/inventory.html")
            .then(() => {
              loginDurationMs = Date.now() - loginStartedAt;
            });
        }
      });

      // Checagem única, igual para qualquer usuário: compara a tela com o
      // que o fixture declarou em "expectedError" (a mensagem que deve
      // aparecer se o login falhar, ou null se deve completar o login).
      // Não existe if por nome de usuário aqui, só o dado muda.
      it("mensagem de login deve corresponder ao esperado", () => {
        if (scenario.expectedError) {
          cy.get('[data-test="error"]')
            .should("contain.text", scenario.expectedError)
            .then(($el) => {
              cy.logCheck({
                user: scenario.username,
                check: "loginMessage",
                actual: $el.text().trim(),
                passed: true,
                extra: { expected: scenario.expectedError },
              });
            });
        } else {
          cy.url().should("include", "/inventory.html");
        }
      });

      // Usuário que não consegue logar não tem tela de produtos pra
      // checar nos testes abaixo. Essa decisão vem do fixture (dado
      // estático definido antes da execução), não do resultado ao vivo
      // do teste anterior.
      if (scenario.expectedError) return;

      it("tempo de login deve ser compatível com o esperado", () => {
        const isSlow = loginDurationMs > PERFORMANCE_THRESHOLD_MS;

        cy.logCheck({
          user: scenario.username,
          check: "loginPerformance",
          actual: isSlow,
          passed: !isSlow,
          extra: { durationMs: loginDurationMs, thresholdMs: PERFORMANCE_THRESHOLD_MS },
        });

        expect(
          isSlow,
          `login demorou ${loginDurationMs}ms (limite: ${PERFORMANCE_THRESHOLD_MS}ms)`
        ).to.eq(false);
      });

      it("imagens de produto não devem estar duplicadas", () => {
        cy.hasDuplicateProductImages().then((hasDuplicates) => {
          cy.logCheck({
            user: scenario.username,
            check: "duplicateImages",
            actual: hasDuplicates,
            passed: !hasDuplicates,
          });

          expect(hasDuplicates, "imagens de produto duplicadas").to.eq(false);
        });
      });

      it("botão do menu (hamburger) não deve estar torto", () => {
        cy.isMenuButtonSkewed().then((isSkewed) => {
          cy.logCheck({
            user: scenario.username,
            check: "menuSkewed",
            actual: isSkewed,
            passed: !isSkewed,
          });

          expect(isSkewed, "botão do menu torto").to.eq(false);
        });
      });

      it('botão "Add to cart" não deve sair da grade do card', () => {
        cy.findAddToCartButtonsOutOfGrid().then(({ count, products }) => {
          const hasAny = count > 0;

          cy.logCheck({
            user: scenario.username,
            check: "buttonOutOfGrid",
            actual: hasAny,
            passed: !hasAny,
            extra: { outOfGridButtonCount: count, outOfGridProducts: products },
          });

          expect(
            hasAny,
            `botão "Add to cart" fora da grade${
              products.length ? ` (${products.join(", ")})` : ""
            }`
          ).to.eq(false);
        });
      });

      // Fica por último de propósito: clica em todos os botões, o que
      // muda o texto/estado deles e atrapalharia a checagem de posição
      // acima se rodasse antes.
      it('botões "Add to cart" devem responder ao clique', () => {
        cy.countUnresponsiveAddToCartButtons().then(({ count, products }) => {
          const hasBrokenButtons = count > 0;

          cy.logCheck({
            user: scenario.username,
            check: "brokenAddToCartButtons",
            actual: hasBrokenButtons,
            passed: !hasBrokenButtons,
            extra: { unresponsiveButtonCount: count, unresponsiveProducts: products },
          });

          expect(
            hasBrokenButtons,
            `botões "Add to cart" não responsivos${
              products.length ? ` (${products.join(", ")})` : ""
            }`
          ).to.eq(false);
        });
      });
    });
  });
});
