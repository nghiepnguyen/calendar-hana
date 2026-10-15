import { afterEach, describe, expect, it, vi } from 'vitest'
import { BUILD_VERSION } from '../buildInfo'
import { checkForUpdate } from './updateCheck'

function serverReturns(body: unknown, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok, json: async () => body })),
  )
}

function registration() {
  return { update: vi.fn(async () => {}) } as unknown as ServiceWorkerRegistration & {
    update: ReturnType<typeof vi.fn>
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('checkForUpdate', () => {
  it('server cùng build: không cập nhật', async () => {
    serverReturns({ build: BUILD_VERSION })
    const reg = registration()
    expect(await checkForUpdate(reg)).toBe(false)
    expect(reg.update).not.toHaveBeenCalled()
  })

  it('server có build khác: nhờ trình duyệt tải service worker mới', async () => {
    serverReturns({ build: 'bf229c7' })
    const reg = registration()
    expect(await checkForUpdate(reg)).toBe(true)
    expect(reg.update).toHaveBeenCalledTimes(1)
    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({ cache: 'no-store' })
  })

  it.each([
    ['mất mạng', () => vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))],
    ['lỗi server', () => serverReturns({}, false)],
    ['file hỏng', () => serverReturns({ build: 42 })],
  ])('%s: không báo bản mới, không lỗi', async (_name, setup) => {
    setup()
    const reg = registration()
    expect(await checkForUpdate(reg)).toBe(false)
    expect(reg.update).not.toHaveBeenCalled()
  })

  it('service worker update lỗi: không làm app lỗi', async () => {
    serverReturns({ build: 'bf229c7' })
    const reg = registration()
    reg.update.mockRejectedValue(new Error('install failed'))
    await expect(checkForUpdate(reg)).resolves.toBe(true)
  })
})
