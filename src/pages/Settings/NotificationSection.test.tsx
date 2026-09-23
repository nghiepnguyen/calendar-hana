import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useNotificationStore } from '../../reminders/notifications'
import { NotificationSection } from './NotificationSection'

function stubNotification(permission: NotificationPermission) {
  const Notification = vi.fn() as unknown as typeof globalThis.Notification
  Object.assign(Notification, { permission, requestPermission: vi.fn(async () => permission) })
  vi.stubGlobal('Notification', Notification)
  useNotificationStore.setState({ permission })
  return Notification
}

afterEach(() => {
  vi.unstubAllGlobals()
  useNotificationStore.setState({ permission: 'unsupported' })
})

describe('NotificationSection', () => {
  it('bị chặn: hiện trạng thái và hướng dẫn bật lại', () => {
    stubNotification('denied')
    render(<NotificationSection />)
    expect(screen.getByTestId('notification-status')).toHaveTextContent('Đang bị chặn')
    expect(screen.getByText('Trong trình duyệt')).toBeInTheDocument()
    expect(screen.getByText('Nếu vẫn không thấy thông báo')).toBeInTheDocument()
  })

  it('chưa hỏi: nút Bật thông báo xin quyền', async () => {
    const Notification = stubNotification('default')
    render(<NotificationSection />)
    await userEvent.click(screen.getByRole('button', { name: 'Bật thông báo' }))
    expect(Notification.requestPermission).toHaveBeenCalled()
  })

  it('đã bật: gửi thử rồi hướng dẫn kiểm tra hệ điều hành', async () => {
    const Notification = stubNotification('granted')
    render(<NotificationSection />)
    await userEvent.click(screen.getByRole('button', { name: 'Gửi thông báo thử' }))
    expect(Notification).toHaveBeenCalledWith('Lịch Việt', expect.any(Object))
    expect(await screen.findByText(/Đã gửi thông báo thử/)).toBeInTheDocument()
  })
})
