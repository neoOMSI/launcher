import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function cspPlugin(): Plugin {
  return {
    name: 'html-csp-transform',
    transformIndexHtml(html, ctx) {
      const isDev = Boolean(ctx.server);
      const connectSrc = isDev
        ? "connect-src 'self' blob: ws://localhost:* http://localhost:* ws://127.0.0.1:* http://127.0.0.1:*;"
        : "connect-src 'self' blob:;";

      return html.replace(/__CSP_CONNECT_SRC__/g, connectSrc);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), cspPlugin()],
  base: './',
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
