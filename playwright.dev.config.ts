import { defineConfig } from '@playwright/test'
import config from './playwright.config.ts'

/** Kiểm tra đường dẫn HTML công khai trên Vite dev, tách khỏi preview của bản build. */
export default defineConfig({
  ...config,
  testMatch: 'legal-pages.spec.ts',
  use: { ...config.use, baseURL: 'http://localhost:5174' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5174 --strictPort',
    url: 'http://localhost:5174',
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
