import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.join(rootDir, 'playground'),
  // The interpreter is bundled into the page, so the build is a plain static site
  // with no server behind it. outDir sits at the repo root because Vite would
  // otherwise write inside playground/, next to the sources it just read.
  build: {
    outDir: path.join(rootDir, 'dist-playground'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    open: true,
    fs: {
      // Allow importing the language runtime from ../src
      allow: [rootDir],
    },
  },
  resolve: {
    alias: {
      '@ss': path.join(rootDir, 'src'),
    },
  },
});
