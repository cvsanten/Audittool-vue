import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "./stores/auth";
import "./assets/main.css";

const pinia = createPinia();
const app = createApp(App).use(pinia).use(router);
useAuthStore(pinia).init();
app.mount("#app");
