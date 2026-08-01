// cypress/support/commands.js
// Comandos customizados usados nas specs, principalmente na suíte de
// comportamento por usuário (cypress/e2e/user-behavior-matrix.cy.js).
// Centralizar essas verificações aqui evita duplicar lógica nas specs
// e deixa cada teste declarativo.

// Grava o resultado de uma verificação em cypress/results/user-behavior-log.json.
Cypress.Commands.add("logCheck", (entry) => {
  cy.task(
    "logCheckResult",
    { timestamp: new Date().toISOString(), ...entry },
    { log: false }
  );
});

// Limpa cookies/localStorage antes de visitar a página: sem isso, o
// carrinho pode "vazar" de uma sessão anterior do mesmo usuário e
// contaminar o estado inicial do teste.
Cypress.Commands.add("login", (username, password) => {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.visit("/");
  cy.get("#user-name").clear().type(username);
  cy.get("#password").clear().type(password);
  cy.get("#login-button").click();
});

// true se houver imagens de produto duplicadas na listagem.
Cypress.Commands.add("hasDuplicateProductImages", () => {
  return cy.get(".inventory_item_img img").then(($imgs) => {
    const srcs = [...$imgs].map((img) => img.getAttribute("src"));
    return new Set(srcs).size < srcs.length;
  });
});

// true se o botão do menu (ou algum elemento dentro dele) tiver uma
// transformação CSS aplicada (rotação, skew, etc.). Checamos o container
// inteiro (.bm-burger-button), não só o <button>, porque o bug costuma
// estar no <img class="bm-icon"> interno, não no botão em si.
Cypress.Commands.add("isMenuButtonSkewed", () => {
  return cy.get(".bm-burger-button, .bm-burger-button *").then(($els) => {
    return [...$els].some((el) => {
      const transform = window.getComputedStyle(el).transform;
      return Boolean(transform) && transform !== "none";
    });
  });
});

// Verifica, em todos os produtos, se o botão "Add to cart" sai dos
// limites do próprio card ou se desalinha em relação aos demais.
// Retorna { count, products }.
Cypress.Commands.add("findAddToCartButtonsOutOfGrid", () => {
  // Espera as imagens carregarem antes de medir — a altura dos cards
  // (e portanto a posição dos botões) só fica definitiva depois disso.
  cy.get(".inventory_item_img img").should(($imgs) => {
    const allLoaded = [...$imgs].every(
      (img) => img.complete && img.naturalWidth > 0
    );
    expect(allLoaded, "todas as imagens de produto carregadas").to.be.true;
  });

  return cy.get(".inventory_item").then(($items) => {
    const overflowTolerance = 1;
    const alignmentTolerance = 3;

    const entries = [...$items]
      .map((itemEl, i) => {
        const nameEl = itemEl.querySelector(".inventory_item_name");
        const productName = nameEl ? nameEl.textContent.trim() : `item ${i}`;
        const button = itemEl.querySelector("button");
        if (!button) return null;
        return {
          productName,
          itemRect: itemEl.getBoundingClientRect(),
          btnRect: button.getBoundingClientRect(),
        };
      })
      .filter(Boolean);

    const overflowsOwnCard = ({ itemRect, btnRect }) =>
      btnRect.right > itemRect.right + overflowTolerance ||
      btnRect.bottom > itemRect.bottom + overflowTolerance ||
      btnRect.left < itemRect.left - overflowTolerance;

    // Distância do botão até a base do próprio card: deve ser igual
    // para todos os produtos num grid bem-formado (usamos a base, não
    // o topo, porque a descrição de cada produto tem tamanho diferente).
    const offsets = entries.map(
      ({ itemRect, btnRect }) => itemRect.bottom - btnRect.bottom
    );
    const sorted = [...offsets].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const medianOffset =
      sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];

    const misalignedFromPeers = ({ itemRect, btnRect }) =>
      Math.abs(itemRect.bottom - btnRect.bottom - medianOffset) >
      alignmentTolerance;

    const offending = entries
      .filter((e) => overflowsOwnCard(e) || misalignedFromPeers(e))
      .map((e) => e.productName);

    return { count: offending.length, products: offending };
  });
});

// Clica no botão de cada produto e verifica se o TEXTO MUDOU depois do
// clique (não se terminou especificamente em "Remove" — o botão pode já
// carregar como "Remove" por estado residual, então comparar com o
// próprio texto de antes cobre as duas direções do toggle).
// Retorna { count, products }.
Cypress.Commands.add("countUnresponsiveAddToCartButtons", () => {
  const results = [];

  const waitForChange = (i, productName, textBefore, attemptsLeft) => {
    return cy
      .get(".inventory_item")
      .eq(i)
      .find("button")
      .invoke("text")
      .then((textNow) => {
        const trimmed = textNow.trim();
        const changed = trimmed !== textBefore;
        if (changed || attemptsLeft <= 0) {
          results.push({ index: i, productName, changed });
          return;
        }
        cy.wait(150);
        return waitForChange(i, productName, textBefore, attemptsLeft - 1);
      });
  };

  return cy
    .get(".inventory_item")
    .its("length")
    .then((total) => {
      Cypress._.times(total, (i) => {
        cy.get(".inventory_item")
          .eq(i)
          .then(($item) => {
            const productName = $item.find(".inventory_item_name").text().trim();
            const textBefore = $item.find("button").text().trim();

            cy.get(".inventory_item").eq(i).find("button").click({ force: true });
            waitForChange(i, productName, textBefore, 40); // até ~6s de tolerância
          });
      });
    })
    .then(() => {
      const unresponsive = results.filter((r) => r.changed === false);
      return {
        count: unresponsive.length,
        products: unresponsive.map((r) => r.productName),
      };
    });
});
