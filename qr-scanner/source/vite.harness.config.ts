import { defineConfig, type Plugin } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

const emulatorRoute = (): Plugin => ({
  name: "qr-scan-emulator-route",
  enforce: "post",
  generateBundle(_options, bundle) {
    const rootPage = bundle["index.html"];
    if (!rootPage || rootPage.type !== "asset") this.error("The emulator index was not emitted.");
    const source = typeof rootPage.source === "string"
      ? rootPage.source
      : new TextDecoder().decode(rootPage.source);
    this.emitFile({
      type: "asset",
      fileName: "emulator/index.html",
      source: source
        .replaceAll("./assets/", "../assets/")
        .replace('href="./skeleton/"', 'href="../skeleton/"'),
    });
  },
});

export default defineConfig({
  base: "./",
  plugins: [emulatorRoute()],
  optimizeDeps: {
    exclude: ["@zxing/library"],
  },
  build: {
    outDir: "dist/harness",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        emulator: resolve(root, "index.html"),
        skeleton: resolve(root, "skeleton/index.html"),
      },
    },
  },
});
