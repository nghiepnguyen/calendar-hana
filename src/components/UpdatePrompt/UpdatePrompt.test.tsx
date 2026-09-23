import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAppUpdateStore } from '../../store/appUpdateStore'
import { UpdatePrompt } from './UpdatePrompt'

afterEach(() => {
  vi.useRealTimers()
  act(() => useAppUpdateStore.setState({ needRefresh: false, offlineReady: false }))
})

describe('UpdatePrompt', () => {
  it('có bản mới: bấm Cập nhật thì kích hoạt bản mới', async () => {
    const update = vi.fn()
    useAppUpdateStore.setState({ needRefresh: true, update })
    render(<UpdatePrompt />)
    expect(screen.getByText('Có phiên bản mới.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cập nhật' }))
    expect(update).toHaveBeenCalledTimes(1)
  })

  it('Để sau thì ẩn thông báo', async () => {
    useAppUpdateStore.setState({ needRefresh: true })
    render(<UpdatePrompt />)
    await userEvent.click(screen.getByRole('button', { name: 'Để sau' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('đã dùng được offline: tự ẩn sau vài giây', () => {
    vi.useFakeTimers()
    useAppUpdateStore.setState({ offlineReady: true })
    render(<UpdatePrompt />)
    expect(screen.getByText('App đã dùng được khi không có mạng.')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(5000))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
