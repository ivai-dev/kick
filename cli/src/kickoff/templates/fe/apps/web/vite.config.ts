/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// `vite build`                 -> dist/ (multi-file, served by `vite preview` for e2e)
// `vite build --mode artifact` -> dist-artifact/index.html: ONE self-contained file that
//                                 works from file:// and inside a sandboxed iframe.
export default defineConfig(({ mode }) => {
  const artifact = mode === "artifact";
  return {
    base: "./",
    plugins: [react(), tailwindcss(), ...(artifact ? [viteSingleFile({ removeViteModuleLoader: true })] : [])],
    build: {
      outDir: artifact ? "dist-artifact" : "dist",
      emptyOutDir: true,
      // The artifact must not reference any other file.
      ...(artifact ? { assetsInlineLimit: Number.MAX_SAFE_INTEGER, cssCodeSplit: false } : {}),
      chunkSizeWarningLimit: artifact ? 5000 : 1000,
    },
    test: {
      include: ["src/**/*.test.{ts,tsx}"],
    },
  };
});
