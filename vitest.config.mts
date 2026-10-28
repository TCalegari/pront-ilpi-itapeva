import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Apenas funções puras (escalas, datas, aprazamento...): ambiente node, sem DOM.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
