import LoginPage from "../pages/LoginPage";
import scenarios from "../fixtures/userScenarios.json";

// Acima desse tempo (ms), consideramos o login "lento".
const PERFORMANCE_THRESHOLD_MS = 2000;

describe("Login", () => {
  beforeEach(() => {
    cy.fixture("users").as("users");
  });

  // Cenários obrigatórios do desafio
  it("deve logar com sucesso usando credenciais válidas", function () {
    LoginPage.login(this.users.standard.username, this.users.standard.password);
    cy.url().should("include", "/inventory.html");
    cy.get(".title").should("have.text", "Products");
  });

  it("deve exibir erro ao logar com usuário bloqueado", function () {
    LoginPage.login(this.users.locked.username, this.users.locked.password);
    LoginPage.getErrorMessage().should(
      "contain.text",
      "Sorry, this user has been locked out"
    );
  });

  // Matriz de comportamento por usuário (diferencial).
  //
  // Cada checagem abaixo é uma regra de aceite igual para todo usuário
  // logável: "o app não deve ter esse problema". Se o problema
  // acontecer, o teste falha — é assim que um defeito real (conhecido
  // em problem_user, performance_glitch_user, error_user e visual_user)
  // aparece no relatório.
  //
  // O login acontece uma única vez por usuário, no "before". Como o
  // describe desliga o testIsolation, o Cypress não reseta cookies/DOM
  // entre os "it"s seguintes — cada verificação continua de onde a
  // anterior parou, sem logar de novo.
  describe("Comportamento por tipo de usuário (matriz de cenários)", () => {
    scenarios.forEach((scenario) => {
      if (!scenario.canLogin) {
        describe(`Usuário: ${scenario.username}`, () => {
          it("deve ser bloqueado no login e exibir mensagem de erro", () => {
            cy.login(scenario.username, scenario.password);
            cy.get('[data-test="error"]')
              .should("contain.text", "Sorry, this user has been locked out")
              .then(($el) => {
                cy.logCheck({
                  user: scenario.username,
                  check: "loginBlocked",
                  actual: true,
                  passed: true,
                  extra: { errorMessage: $el.text().trim() },
                });
              });
          });
        });
        return;
      }

      describe(`Usuário: ${scenario.username}`, { testIsolation: false }, () => {
        before(() => {
          cy.loginAndMeasure(scenario.username, scenario.password);
        });

        it("tempo de login deve ser compatível com o esperado", () => {
          cy.get("@loginDuration").then((duration) => {
            const isSlow = duration > PERFORMANCE_THRESHOLD_MS;

            cy.logCheck({
              user: scenario.username,
              check: "loginPerformance",
              actual: isSlow,
              passed: !isSlow,
              extra: { durationMs: duration, thresholdMs: PERFORMANCE_THRESHOLD_MS },
            });

            expect(
              isSlow,
              `login demorou ${duration}ms (limite: ${PERFORMANCE_THRESHOLD_MS}ms)`
            ).to.eq(false);
          });
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
        // muda o texto/estado deles e atrapalharia a checagem de
        // posição acima se rodasse antes.
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
});
