import LoginPage from "../pages/LoginPage";
import InventoryPage from "../pages/InventoryPage";

describe("Ordenação de produtos", () => {
  beforeEach(function () {
    cy.fixture("users").as("users");
    cy.then(function () {
      LoginPage.login(this.users.standard.username, this.users.standard.password);
    });
  });

  it("deve ordenar produtos por preço (Low to High)", () => {
    InventoryPage.sortBy("lohi");

    InventoryPage.getProductPrices().then((prices) => {
      const sorted = [...prices].sort((a, b) => a - b);
      expect(prices).to.deep.equal(sorted);
    });
  });
});
