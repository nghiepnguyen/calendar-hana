import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainMove } from './DomainMove'

const hasLocal = vi.hoisted(() => ({ value: false }))
vi.mock('./canonicalHost', () => ({
  CANONICAL_HOST: 'lich.thanhnghiep.top',
  canonicalUrl: () => 'https://lich.thanhnghiep.top/day/2026-09-23',
}))
vi.mock('../../data/hasLocalData', () => ({ hasLocalData: async () => hasLocal.value }))
vi.mock('../../data/repositoryContext', () => ({ getLocalRepository: () => ({}) }))

const replace = vi.fn()
beforeEach(() => {
  vi.stubGlobal('location', { ...window.location, replace })
})
afterEach(() => {
  vi.unstubAllGlobals()
  replace.mockReset()
})

describe('DomainMove', () => {
  it('máy không có dữ liệu local: chuyển thẳng sang tên miền mới', async () => {
    hasLocal.value = false
    render(<DomainMove />, { wrapper: MemoryRouter })
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith('https://lich.thanhnghiep.top/day/2026-09-23'),
    )
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('máy có dữ liệu local: không chuyển, hiện hướng dẫn xuất dữ liệu', async () => {
    hasLocal.value = true
    render(<DomainMove />, { wrapper: MemoryRouter })
    expect(await screen.findByRole('status')).toHaveTextContent('lich.thanhnghiep.top')
    expect(screen.getByRole('link', { name: 'Xuất dữ liệu' })).toHaveAttribute('href', '/settings')
    expect(replace).not.toHaveBeenCalled()
  })
})
