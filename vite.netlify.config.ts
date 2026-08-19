import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.join(dir, "spa"),
  publicDir: path.join(dir, "public"),
  envDir: dir,
  plugins: [tailwindcss(), viteReact()],
  resolve: {
    alias: { "@": path.join(dir, "src") },
  },
  define: {
    "import.meta.env.VITE_AUTH_ENABLED": JSON.stringify("false"),
  },
  build: {
    outDir: path.join(dir, "site"),
    emptyOutDir: true,
    sourcemap: false,
  },
});
