import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue()],
  root: resolve(__dirname, "tests/integration"),
  publicDir: resolve(__dirname, "playground/public"),
  resolve: {
    alias: { 'vue-onlyoffice-local': resolve(__dirname, 'src') },
  },
  server: {
    port: 5173,
    strictPort: true,
    open: false,
  },
});