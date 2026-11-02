import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "node:url";
const here = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig({
  root: here,
  plugins: [vue()],
  resolve: { alias: [
    { find: /.*\/services\/salesService\.js$/, replacement: `${here}sales.js` },
    { find: /.*\/services\/expenseService\.js$/, replacement: `${here}expenses.js` },
  ] },
  server: { host: "127.0.0.1", port: 5174, strictPort: true, fs: { allow: [fileURLToPath(new URL("../../", import.meta.url))] } },
});
