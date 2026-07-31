class CartPage {
  getCartItems() {
    return cy.get(".cart_item");
  }

  getCartItemNames() {
    return cy.get(".cart_item .inventory_item_name").then(($els) =>
      [...$els].map((el) => el.innerText.trim())
    );
  }

  checkout() {
    cy.get('[data-test="checkout"]').click();
  }
}

export default new CartPage();
