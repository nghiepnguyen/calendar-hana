import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

// Test cần Firebase Emulator (chạy qua: npm run test:emulator).
export default defineConfig({
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['fake-indexeddb/auto'],
    include: ['src/**/*.emulator.test.ts', 'functions/src/**/*.emulator.test.ts'],
    testTimeout: 20_000,
    hookTimeout: 30_000,
    // Các file dùng chung một emulator: chạy lần lượt để không xóa dữ liệu của nhau.
    fileParallelism: false,
    env: { TZ: 'Asia/Ho_Chi_Minh' },
  },
})
