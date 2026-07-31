import { createApp } from "vue";
import App from "./App.vue";
import { initializeApplication } from "@/init";
import { logger } from "@/logger.js";

const main = async () => {
    await initializeApplication();
    createApp(App).mount("#app");
};

main().catch(error => {
    logger.error(error);
    document.body.innerHTML = `
        <h1>Startup failed</h1>
        <pre>${String(error)}</pre>
    `;
});