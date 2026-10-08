import { defineConfig, devices } from '@playwright/test'

// Test end-to-end chạy trên bản build (có service worker), không đăng nhập.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    // WebKit Linux trên CI vẽ phần mềm ở deviceScaleFactor 3 (kèm backdrop-filter): mỗi thao tác
    // mất 2–3s, nên test nhiều bước vượt 30s dù không treo.
    { name: 'iphone', use: { ...devices['iPhone 15'] }, timeout: 90_000 },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
