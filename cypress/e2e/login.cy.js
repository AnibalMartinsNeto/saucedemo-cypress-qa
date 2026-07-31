import LoginPage from "../pages/LoginPage";

describe("Login", () => {
  beforeEach(() => {
    cy.fixture("users").as("users");
  });

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
});
