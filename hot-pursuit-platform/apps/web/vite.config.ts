import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Resolve workspace source packages directly (they ship TS source, no build step).
const workspaceAlias = {
  "@hotpursuit/config": fileURLToPath(
    new URL("../../packages/config/src/index.ts", import.meta.url),
  ),
  "@hotpursuit/shared": fileURLToPath(
    new URL("../../packages/shared/src/index.ts", import.meta.url),
  ),
  "@hotpursuit/types": fileURLToPath(
    new URL("../../packages/types/src/index.ts", import.meta.url),
  ),
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      ...workspaceAlias,
    },
  },
});
