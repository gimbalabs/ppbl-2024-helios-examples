import { defineConfig } from "vite";

export default defineConfig({
  test: {
    include: ["test/*.test.ts"],
    exclude: ["test/*.config.*"],
  },
});
