import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

// Read version from package.json
const packageJson = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8"),
);

export default defineConfig({
  plugins: [vue()],
  base: "/manowzab-sales/", // สำหรับ GitHub Pages
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
});
