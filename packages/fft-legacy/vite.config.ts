import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'fft_legacy',
      formats: ["es", "cjs", "umd", "iife", "system"],
      fileName: (format) => {
        if (format === "es") return "index.js";
        if (format === "cjs") return "index.cjs";
        if (format === "umd") return "index.umd.js";
        if (format === "iife") return "index.iife.js";
        if (format === "system") return "index.system.js";
        return `index.${format}.js`;
      }
    },
    outDir: 'dist',
    rollupOptions: {
      external: [],
    },
  },
});