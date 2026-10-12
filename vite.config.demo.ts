import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import pkg from './package.json';

/**
 * Build config for the public demo (https://onlyoffice.zkhi.top).
 *
 * Differences from the library build:
 *  - root is `demo/` and it is a normal SPA build, not a library build
 *  - the OnlyOffice 9.x offline vendor tree is NOT bundled. It is served from
 *    the same origin under /vendor/ at deploy time, because it is ~700 MB of
 *    fonts, wasm and editor chunks that must be copied verbatim.
 */
export default defineConfig({
  plugins: [vue()],
  root: 'demo',
  publicDir: 'public',
  define: {
    __DEMO_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      // Build against the library source so a demo change is visible without
      // a separate `npm run build` of the dist/ output.
      'vue-onlyoffice-local': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5174,
    host: '127.0.0.1',
  },
  preview: {
    port: 5174,
  },
  build: {
    // Resolved relative to `root` (demo/), so this lands at the repo root.
    outDir: '../demo-dist',
    emptyOutDir: true,
    // The demo's own JS is tiny; the 700 MB vendor tree lives outside the build.
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue'],
        },
      },
    },
  },
});