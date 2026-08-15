import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    lib: {
      entry: "src/index.ts",
      name: "QrScanCore",
      formats: ["es"],
      fileName: () => "qr-scan-core.js",
      cssFileName: "qr-scan-core",
    },
    sourcemap: true,
    emptyOutDir: false,
  },
});

