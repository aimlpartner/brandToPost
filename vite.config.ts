import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.png'],
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
        },
        manifest: {
          name: 'BrandToPost',
          short_name: 'BrandToPost',
          description: 'Turn your Brand Position into weekly, platform-specific campaigns.',
          theme_color: '#0A0A0F',
          background_color: '#0A0A0F',
          display: 'standalone',
          icons: [
            {
              src: 'icon.png',
              sizes: '192x192 512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
