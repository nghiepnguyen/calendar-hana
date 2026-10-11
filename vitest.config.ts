import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'shared/**/*.test.ts', 'functions/src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/*.emulator.test.ts'],
    // Many sweep tests take 1–6 s locally and ~4× longer on a loaded CI shard; 5 s flaked twice.
    testTimeout: 30_000,
    // Mọi phép tính ngày giờ chạy theo giờ Việt Nam, kể cả khi CI ở múi giờ khác.
    env: { TZ: 'Asia/Ho_Chi_Minh' },
  },
})
