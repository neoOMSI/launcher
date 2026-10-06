import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    outDir: 'dist-electron',
    emptyOutDir: true,
    ssr: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'electron/main.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        format: 'esm',
      },
      external: ['electron'],
    },
  },
});
