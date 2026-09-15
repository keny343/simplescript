import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.join(rootDir, 'playground'),
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
