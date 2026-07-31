class CheckoutPage {
  fillInfo(firstName, lastName, postalCode) {
    cy.get('[data-test="firstName"]').type(firstName);
    cy.get('[data-test="lastName"]').type(lastName);
    cy.get('[data-test="postalCode"]').type(postalCode);
    cy.get('[data-test="continue"]').click();
  }

  finish() {
    cy.get('[data-test="finish"]').click();
  }

  getSuccessMessage() {
    return cy.get(".complete-header");
  }
}

export default new CheckoutPage();
