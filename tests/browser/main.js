// Isolated visual verification. No Firebase credentials, reads or writes are used.
import { createApp, h } from "vue";
import TaxView from "../../src/views/TaxView.vue";
import "../../src/style.css";
window.taxFixture = { failExpenses: false, delay: 0 };
const app = createApp(TaxView);
app.component("RouterLink", { props: ["to"], render() { return h("a", { href: this.to }, this.$slots.default?.()); } });
app.mount("#app");
