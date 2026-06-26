import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon-*.jpg', 'audio/**/*'],
        manifest: {
          name: 'BUGSMASHER — Tactical QA System',
          short_name: 'BUGSMASHER',
          description: 'Defend the core. Smash the swarm. Brutalist OS vs bio-luminescent bugs.',
          start_url: '/',
          display: 'standalone',
          background_color: '#050505',
          theme_color: '#050505',
          orientation: 'any',
          icons: [
            {
              src: '/icon-192.jpg',
              sizes: '192x192',
              type: 'image/jpeg',
              purpose: 'any',
            },
            {
              src: '/icon-512.jpg',
              sizes: '512x512',
              type: 'image/jpeg',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,jpg,png,wav}'],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === 'audio',
              handler: 'CacheFirst',
              options: {
                cacheName: 'audio-cache',
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
      }),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      // 600kB to accommodate firebase chunk (common for backend-integrated games); main app chunk now ~290kB thanks to splits
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) return 'react';
              if (id.includes('lucide-react')) return 'icons';
              if (id.includes('motion')) return 'motion';
              if (id.includes('firebase')) return 'firebase';
              return 'vendor';
            }
            // Future: split heavy game/ UI if desired (e.g. if (id.includes('game/rendering')) return 'rendering';)
          },
        },
      },
    },
  };
});
