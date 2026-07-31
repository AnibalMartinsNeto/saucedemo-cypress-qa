class InventoryPage {
  addProductToCart(productName) {
    cy.contains(".inventory_item", productName)
      .find("button")
      .click();
  }

  goToCart() {
    cy.get(".shopping_cart_link").click();
  }

  sortBy(optionValue) {
    cy.get(".product_sort_container").select(optionValue);
  }

  getProductPrices() {
    return cy.get(".inventory_item_price").then(($els) => {
      return [...$els].map((el) =>
        parseFloat(el.innerText.replace("$", ""))
      );
    });
  }
}

export default new InventoryPage();
