import { createApp } from "vue";
import App from "./App.vue";
import { loadConfig } from "./config/loadConfig";

async function main(): Promise<void> {
    await loadConfig();
    createApp(App).mount("#app");
}

main().catch((error) => {
    console.error(error);
    document.body.innerHTML = `
        <h1>Startup failed</h1>
        <pre>${String(error)}</pre>
    `;
});