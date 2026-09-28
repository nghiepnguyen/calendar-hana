import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

// Popup chào lần đầu và gợi ý vuốt che màn hình: coi như đã thấy, test của từng cái tự xoá cờ.
beforeEach(() => {
  localStorage.setItem('hana:welcome-seen', '1')
  localStorage.setItem('hana:swipe-hint-seen', '1')
})

afterEach(() => {
  cleanup()
})
