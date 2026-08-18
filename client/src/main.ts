import { createApp } from "vue";
import App from "./App.vue";
import { initializeApplication } from "@/init";
import { logger } from "@/logger.js";
import { router } from "@/router";
import "@/styles/main.scss";

const main = async () => {
  await initializeApplication();
  createApp(App)
    .use(router)
    .mount("#app");
};

main().catch(error => {
  logger.error(error);
  document.body.innerHTML = `         <h1>Startup failed</h1>         <pre>${String(error)}</pre>
    `;
});
