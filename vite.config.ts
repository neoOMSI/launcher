import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function cspPlugin(): Plugin {
  return {
    name: 'html-csp-transform',
    transformIndexHtml(html, ctx) {
      const isDev = Boolean(ctx.server);
      const connectSrc = isDev
        ? "connect-src 'self' ws://localhost:* http://localhost:* ws://127.0.0.1:* http://127.0.0.1:*;"
        : "connect-src 'self';";

      return html.replace(/__CSP_CONNECT_SRC__/g, connectSrc);
    },
  };
}

export default defineConfig({
  plugins: [react(), cspPlugin()],
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
