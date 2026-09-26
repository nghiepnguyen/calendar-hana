import { act, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CalendarDatabase } from '../data/db'
import { LocalRepository } from '../data/localRepository'
import { RepositoryProvider } from '../data/RepositoryProvider'
import { BOLD_TEXT_STORAGE_KEY, TEXT_SIZE_STORAGE_KEY } from '../styles/textSize'
import { TextSizeController } from './TextSizeController'

let repo: LocalRepository
let counter = 0
const root = document.documentElement

beforeEach(() => {
  repo = new LocalRepository(new CalendarDatabase(`text-size-test-${++counter}`))
  localStorage.clear()
  root.removeAttribute('data-text-size')
  root.removeAttribute('data-bold-text')
})

afterEach(async () => {
  vi.restoreAllMocks()
  await repo.db.delete()
})

function renderController() {
  return render(
    <RepositoryProvider repository={repo}>
      <TextSizeController />
    </RepositoryProvider>,
  )
}

describe('TextSizeController', () => {
  it('mức mặc định thì bỏ thuộc tính và lưu bản sao', async () => {
    root.setAttribute('data-text-size', 'xlarge')
    root.setAttribute('data-bold-text', '')
    renderController()
    await waitFor(() => expect(root.hasAttribute('data-text-size')).toBe(false))
    expect(root.hasAttribute('data-bold-text')).toBe(false)
    expect(localStorage.getItem(TEXT_SIZE_STORAGE_KEY)).toBe('default')
    expect(localStorage.getItem(BOLD_TEXT_STORAGE_KEY)).toBe('0')
  })

  it('đặt thuộc tính theo cài đặt và cập nhật khi đổi', async () => {
    await repo.saveSettings({ textSize: 'large', boldText: true })
    renderController()
    await waitFor(() => expect(root.getAttribute('data-text-size')).toBe('large'))
    expect(root.hasAttribute('data-bold-text')).toBe(true)
    expect(localStorage.getItem(BOLD_TEXT_STORAGE_KEY)).toBe('1')

    await act(() => repo.saveSettings({ textSize: 'xlarge', boldText: false }))
    await waitFor(() => expect(root.getAttribute('data-text-size')).toBe('xlarge'))
    expect(root.hasAttribute('data-bold-text')).toBe(false)
    expect(localStorage.getItem(TEXT_SIZE_STORAGE_KEY)).toBe('xlarge')
  })

  it('giữ thuộc tính đang có khi cài đặt chưa tải xong', () => {
    root.setAttribute('data-text-size', 'xlarge')
    renderController()
    expect(root.getAttribute('data-text-size')).toBe('xlarge')
  })

  it('không lỗi khi localStorage bị chặn', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    await repo.saveSettings({ textSize: 'large' })
    renderController()
    await waitFor(() => expect(root.getAttribute('data-text-size')).toBe('large'))
  })
})
