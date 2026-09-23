import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Sinh icon PWA từ public/favicon.svg vào public/ (chạy: npm run generate-icons).
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: {
      ...minimal2023Preset.maskable,
      padding: 0.3,
      resizeOptions: { background: '#ffffff' },
    },
    apple: { ...minimal2023Preset.apple, padding: 0.3, resizeOptions: { background: '#ffffff' } },
  },
  images: ['public/favicon.svg'],
})
