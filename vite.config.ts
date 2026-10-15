import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { prerenderDays } from './scripts/prerenderDays.ts'
import { publicLegalPages } from './scripts/publicLegalPages.ts'
import packageJson from './package.json' with { type: 'json' }

// Định danh bản build: commit SHA của CI (GitHub Actions), chạy máy thì lấy giờ build.
const builtAt = new Date()
const buildInfo = {
  version: packageJson.version,
  build:
    process.env.GITHUB_SHA?.slice(0, 7) || builtAt.toISOString().replace(/\D/g, '').slice(0, 14),
  builtAt: builtAt.toISOString(),
}

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  define: { __BUILD_INFO__: JSON.stringify(buildInfo) },
  plugins: [
    publicLegalPages(),
    {
      // /version.json: build mới nhất trên server, app so với build đang chạy (src/buildInfo.ts).
      name: 'version-json',
      apply: 'build',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify(buildInfo),
        })
      },
    },
    react(),
    VitePWA({
      // Tự viết service worker (src/sw.ts) để xử lý Web Push và bấm thông báo.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false,
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Trang ngày tạo sẵn cho máy tìm kiếm (prerenderDays): app cài rồi dùng index.html.
        globIgnores: ['day/**'],
      },
      devOptions: {
        enabled: false,
        type: 'module',
      },
      includeAssets: ['favicon.ico', 'logo.png', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Lịch Việt — Lịch Dương & Âm',
        short_name: 'Lịch Việt',
        description:
          'Lịch âm dương Việt Nam: Can Chi, ngày hoàng đạo, ngày lễ, nhắc giỗ, rằm, mùng 1 theo ngày âm.',
        lang: 'vi',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#eef0f5',
        theme_color: '#cc2b22',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
    prerenderDays(),
  ],
})
