import { defineConfig } from 'vite';

import preview from '@seahax/vite-plugin-preview';

process.chdir(import.meta.dirname);

export default defineConfig({
  plugins: [preview({ debug: true })],
  preview: {
    host: '127.0.0.1',
  },
});
