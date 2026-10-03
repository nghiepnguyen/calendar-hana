import { afterEach, expect, it, vi } from 'vitest'
import { probeIndexedDb } from './indexedDbProbe'

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

it('báo ok khi IndexedDB mở được', async () => {
  await expect(probeIndexedDb()).resolves.toBe('ok')
})

it('báo timeout khi indexedDB.open treo mãi (lỗi IndexedDB của iOS)', async () => {
  vi.useFakeTimers()
  vi.spyOn(indexedDB, 'open').mockReturnValue({} as IDBOpenDBRequest)
  const result = probeIndexedDb(3000)
  await vi.advanceTimersByTimeAsync(3000)
  await expect(result).resolves.toBe('timeout')
})

it('báo error khi mở bị lỗi', async () => {
  vi.spyOn(indexedDB, 'open').mockImplementation(() => {
    throw new DOMException('Connection to Indexed Database server lost', 'UnknownError')
  })
  await expect(probeIndexedDb()).resolves.toBe('error')
})
