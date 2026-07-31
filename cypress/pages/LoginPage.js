class LoginPage {
  visit() {
    cy.visit("/");
  }

  fillUsername(username) {
    cy.get("#user-name").type(username);
  }

  fillPassword(password) {
    cy.get("#password").type(password);
  }

  submit() {
    cy.get("#login-button").click();
  }

  login(username, password) {
    // Reaproveita o comando customizado cy.login (cypress/support/commands.js),
    // que também limpa cookies/localStorage antes de visitar a página.
    cy.login(username, password);
  }

  getErrorMessage() {
    return cy.get('[data-test="error"]');
  }
}

export default new LoginPage();
