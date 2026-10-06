import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    outDir: 'dist-electron',
    emptyOutDir: false,
    ssr: true,
    rollupOptions: {
      input: {
        preload: resolve(import.meta.dirname, 'electron/preload.ts'),
      },
      output: {
        entryFileNames: '[name].cjs',
        format: 'cjs',
      },
      external: ['electron'],
    },
  },
});
