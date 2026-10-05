import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 5180 },
  build: { chunkSizeWarningLimit: 1600 }, // Phaser 引擎本身約 1.2 MB
});
