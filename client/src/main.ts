import { createApp } from "vue";
import "bootstrap-icons/font/bootstrap-icons.css";

import App from "./App.vue";
import { initializeApplication } from "@/init";
import { logger } from "@/logger.js";
import { router } from "@/router";

const registerServiceWorker = (): void => {
  if (!("serviceWorker" in navigator)) {
    return;
  }
  navigator.serviceWorker
    .register(`${import.meta.env.BASE_URL}service-worker.js`)
    .catch(error => logger.error(error));
};

const main = async () => {
  registerServiceWorker();
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
