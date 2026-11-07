/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// O site fica em https://thialison.github.io/AfinaTi/
export default defineConfig({
  base: '/AfinaTi/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // O registro é feito em src/atualizacao.ts, que também aplica as versões novas na hora.
      injectRegister: false,
      includeAssets: ['favicon-v2.svg', 'apple-touch-icon-v2.png'],
      manifest: {
        id: '/AfinaTi/',
        name: 'AfinaTi',
        short_name: 'AfinaTi',
        description: 'Afinador de violão, guitarra, ukulele e baixo. Funciona sem internet.',
        lang: 'pt-BR',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0F1318',
        theme_color: '#0F1318',
        categories: ['music', 'utilities'],
        icons: [
          { src: 'icon-192-v2.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512-v2.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512-v2.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        // A versão nova assume assim que baixa, sem esperar o app ser fechado.
        // (O plugin só liga isso sozinho quando ele mesmo faz o registro; aqui o registro é nosso.)
        skipWaiting: true,
        clientsClaim: true
      }
    })
  ],
  test: {
    environment: 'node'
  }
});
