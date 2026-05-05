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
        includeAssets: ['img/liflu-icon.png', 'img/app-icon.png'],
        manifest: {
          name: 'Liflu - Life OS',
          short_name: 'Liflu',
          description: 'Your personal Life OS for tasks, habits, and goals.',
          theme_color: '#0b0416',
          background_color: '#0b0416',
          display: 'standalone',
          display_override: ['standalone', 'minimal-ui', 'browser'],
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          id: '/',
          categories: ['productivity', 'lifestyle'],
          lang: 'ru',
          icons: [
            {
              src: '/img/liflu-icon.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/img/liflu-icon.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/img/liflu-icon.png',
              sizes: '180x180',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/img/liflu-icon.png',
              sizes: '167x167',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/img/liflu-icon.png',
              sizes: '152x152',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/img/liflu-icon.png',
              sizes: '120x120',
              type: 'image/png',
              purpose: 'any'
            }
          ],
          screenshots: [],
          prefer_related_applications: false
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: true
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'react-vendor': ['react', 'react-dom'],
            'charts': ['recharts'],
          }
        }
      },
      chunkSizeWarningLimit: 1000,
    },
  };
});
