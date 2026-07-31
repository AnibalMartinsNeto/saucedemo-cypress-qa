const { defineConfig } = require("cypress");
const fs = require("fs");
const path = require("path");

module.exports = defineConfig({
  e2e: {
    baseUrl: "https://www.saucedemo.com",
    viewportWidth: 1280,
    viewportHeight: 720,
    setupNodeEvents(on, config) {
      on("task", {
        // Grava (append) o resultado de cada verificação da matriz de
        // comportamento por usuário em cypress/results/user-behavior-log.json.
        logCheckResult(entry) {
          const dir = path.join(__dirname, "cypress", "results");
          const filePath = path.join(dir, "user-behavior-log.json");

          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          let data = [];
          if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, "utf8");
            data = raw ? JSON.parse(raw) : [];
          }

          data.push(entry);
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

          return null;
        },
      });
    },
  },
});
