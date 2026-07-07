import { createApp } from "vue";
import App from "./App.vue";
import "material-design-icons-iconfont/dist/material-design-icons.css";

// Vom importa router-ul și store-ul imediat ce le creăm
import router from "./router";
import store from "./store";

const app = createApp(App);

app.use(router);
app.use(store);

app.mount("#app");
