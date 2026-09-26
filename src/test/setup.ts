import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

// Popup chào lần đầu che mọi màn hình: coi như đã chào, test của Welcome tự xoá cờ.
beforeEach(() => {
  localStorage.setItem('hana:welcome-seen', '1')
})

afterEach(() => {
  cleanup()
})
