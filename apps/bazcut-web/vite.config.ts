import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("./native", import.meta.url));
export default defineConfig({
  root,
  clearScreen: false,
  envPrefix: ["VITE_", "TAURI_"],
  server: {
    port: 3018,
    strictPort: true,
    host: process.env.TAURI_DEV_HOST || "127.0.0.1",
    fs: { allow: [fileURLToPath(new URL(".", import.meta.url))] },
  },
  build: { outDir: "../dist-native", emptyOutDir: true, target: "es2022" },
  esbuild: { jsx: "automatic" },
});
