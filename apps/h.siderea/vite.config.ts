import prefetch from '@seahax/vite-plugin-prefetch';
import { defineConfig } from 'vite';

process.chdir(import.meta.dirname);

export default defineConfig((env) => ({
  mode: process.env.VITE_MODE === 'development' ? 'development' : env.mode,
  plugins: [prefetch()],
  server: {
    host: '127.0.0.1',
  },
  build: {
    sourcemap: true,
    modulePreload: false,
    chunkSizeWarningLimit: 1000,
  },
}));
