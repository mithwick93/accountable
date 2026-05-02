import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // 👈 use existing manifest.json
      includeAssets: ['favicon.ico', 'logo.png', 'robots.txt'],
    }),
  ],
});
