
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/little-scholars/',
  plugins: [
    react(),

    VitePWA({
      registerType: 'prompt',

      includeAssets: [
        'favicon.svg',
        'icon-192.png',
        'icon-512.png'
      ],

      manifest: {
        name: 'Little Scholars',
        short_name: 'Little Scholars',
        description: 'Quality Education and Student Progress Tracking',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/little-scholars/',
        scope: '/little-scholars/',

        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
