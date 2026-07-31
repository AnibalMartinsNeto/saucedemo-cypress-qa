import LoginPage from "../pages/LoginPage";
import InventoryPage from "../pages/InventoryPage";
import CartPage from "../pages/CartPage";
import CheckoutPage from "../pages/CheckoutPage";

describe("Fluxo de compra completo (E2E)", () => {
  const PRODUCTS = ["Sauce Labs Backpack", "Sauce Labs Bike Light"];

  beforeEach(function () {
    cy.fixture("users").as("users");
    cy.then(function () {
      LoginPage.login(this.users.standard.username, this.users.standard.password);
    });
  });

  it("deve completar uma compra com sucesso", () => {
    PRODUCTS.forEach((product) => InventoryPage.addProductToCart(product));

    InventoryPage.goToCart();

    CartPage.getCartItems().should("have.length", PRODUCTS.length);
    CartPage.getCartItemNames().should("have.members", PRODUCTS);

    CartPage.checkout();
    CheckoutPage.fillInfo("Ana", "Silva", "30000-000");
    CheckoutPage.finish();

    CheckoutPage.getSuccessMessage().should(
      "have.text",
      "Thank you for your order!"
    );
  });
});
