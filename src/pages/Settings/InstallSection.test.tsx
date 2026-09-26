import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { listenForInstallPrompt, useInstallStore } from '../../store/installStore'
import { InstallSection } from './InstallSection'

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36'

function stubUserAgent(userAgent: string) {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent)
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  useInstallStore.setState({ canPrompt: false, installed: false })
})

describe('InstallSection', () => {
  it('iPhone: hiện sẵn hướng dẫn Thêm vào Màn hình chính', () => {
    stubUserAgent(IPHONE)
    render(<InstallSection />)
    expect(screen.getByText('iPhone, iPad').tagName).toBe('P')
    expect(screen.getByText(/Thêm vào Màn hình chính/)).toBeVisible()
    expect(screen.getByText('Android').tagName).toBe('SUMMARY')
  })

  it('Android: hướng dẫn Android hiện trước', () => {
    stubUserAgent(ANDROID)
    render(<InstallSection />)
    expect(screen.getByText('Android').tagName).toBe('P')
    expect(screen.getByText('iPhone, iPad').tagName).toBe('SUMMARY')
  })

  it('đang chạy dạng app: không hiện hướng dẫn', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(display-mode: standalone)',
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    render(<InstallSection />)
    expect(screen.getByTestId('install-status')).toBeInTheDocument()
    expect(screen.queryByText('Android')).not.toBeInTheDocument()
  })

  it('Chrome cho phép cài: nút Cài app mở hộp thoại cài', async () => {
    stubUserAgent(ANDROID)
    listenForInstallPrompt()
    const event = Object.assign(new Event('beforeinstallprompt'), {
      prompt: vi.fn(async () => {}),
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    })
    act(() => {
      window.dispatchEvent(event)
    })
    render(<InstallSection />)
    await userEvent.click(screen.getByRole('button', { name: 'Cài app' }))
    expect(event.prompt).toHaveBeenCalled()
    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })
    expect(screen.getByTestId('install-status')).toBeInTheDocument()
  })
})
