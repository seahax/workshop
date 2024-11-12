import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

process.chdir(import.meta.dirname);

export default defineConfig({
  plugins: [
    react(),
  ],
});
