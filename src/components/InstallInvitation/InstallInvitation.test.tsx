import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { InstallInvitation } from './InstallInvitation'
import { useInstallStore } from '../../store/installStore'

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
  useInstallStore.setState({ installed: false, canPrompt: false })
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})
const advance = (ms = 120_000) => act(() => vi.advanceTimersByTime(ms))

it('waits two minutes, persists until closed, and saves dismissal', () => {
  render(<InstallInvitation startedAt={Date.now()} />)
  advance(119_999)
  expect(screen.queryByRole('region', { name: /Cài Lịch Việt/ })).toBeNull()
  advance(1)
  expect(screen.getByRole('region', { name: /Cài Lịch Việt/ })).toBeVisible()
  advance(600_000)
  fireEvent.click(screen.getByRole('button', { name: 'Đóng lời mời cài app' }))
  expect(screen.queryByRole('region', { name: /Cài Lịch Việt/ })).toBeNull()
  expect(localStorage.getItem('lichviet:install-invitation:v1')).toBe(String(Date.now()))
  advance(8 * 86400_000)
  expect(screen.queryByRole('region', { name: /Cài Lịch Việt/ })).toBeNull()
})
it('suppresses a recent dismissal but allows a new session at seven days', () => {
  localStorage.setItem('lichviet:install-invitation:v1', String(Date.now()))
  const view = render(<InstallInvitation startedAt={Date.now()} />)
  advance()
  expect(screen.queryByRole('region')).toBeNull()
  view.unmount()
  advance(7 * 86400_000)
  render(<InstallInvitation startedAt={Date.now()} />)
  advance()
  expect(screen.getByRole('region', { name: /Cài Lịch Việt/ })).toBeVisible()
})
it('catches up after a hidden tab and waits for a modal to close', async () => {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
  render(<InstallInvitation startedAt={Date.now()} />)
  advance(150_000)
  expect(screen.queryByRole('region')).toBeNull()
  const modal = document.createElement('div')
  modal.setAttribute('aria-modal', 'true')
  document.body.append(modal)
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
  fireEvent(document, new Event('visibilitychange'))
  expect(screen.queryByRole('region')).toBeNull()
  await act(async () => {
    modal.remove()
  })
  expect(screen.getByRole('region', { name: /Cài Lịch Việt/ })).toBeVisible()
})
it('shows guidance, ignores outside clicks and closes via focused Escape', () => {
  render(<InstallInvitation startedAt={Date.now()} />)
  advance()
  fireEvent.click(document.body)
  fireEvent.click(screen.getByRole('button', { name: 'Xem cách cài' }))
  expect(screen.getByText('Cách cài trên máy tính')).toBeVisible()
  const close = screen.getByRole('button', { name: 'Đóng lời mời cài app' })
  close.focus()
  fireEvent.keyDown(close, { key: 'Escape' })
  expect(screen.queryByRole('region')).toBeNull()
})
it('responds to cross-tab dismissal and installation', () => {
  const view = render(<InstallInvitation startedAt={Date.now()} />)
  advance()
  fireEvent(
    window,
    new StorageEvent('storage', {
      key: 'lichviet:install-invitation:v1',
      newValue: String(Date.now()),
    }),
  )
  expect(screen.queryByRole('region')).toBeNull()
  view.unmount()
  render(<InstallInvitation startedAt={Date.now()} />)
  advance()
  act(() => useInstallStore.setState({ installed: true }))
  expect(screen.queryByRole('region')).toBeNull()
})
it('handles corrupted or unavailable storage', () => {
  localStorage.setItem('lichviet:install-invitation:v1', 'broken')
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  render(<InstallInvitation startedAt={Date.now()} />)
  advance()
  fireEvent.click(screen.getByRole('button', { name: 'Đóng lời mời cài app' }))
  expect(screen.queryByRole('region')).toBeNull()
})

it('keeps the invitation after cancelling installation and prevents repeated calls', async () => {
  let finish!: (accepted: boolean) => void
  const prompt = vi.fn(
    () =>
      new Promise<boolean>((resolve) => {
        finish = resolve
      }),
  )
  const original = useInstallStore.getState().prompt
  useInstallStore.setState({ canPrompt: true, prompt })
  try {
    render(<InstallInvitation startedAt={Date.now()} />)
    advance()
    const button = screen.getByRole('button', { name: 'Cài app' })
    fireEvent.click(button)
    fireEvent.click(button)
    expect(prompt).toHaveBeenCalledTimes(1)
    await act(async () => {
      useInstallStore.setState({ canPrompt: false })
      finish(false)
    })
    expect(screen.getByRole('button', { name: 'Xem cách cài' })).toBeVisible()
    expect(localStorage.getItem('lichviet:install-invitation:v1')).toBeNull()
  } finally {
    useInstallStore.setState({ prompt: original })
  }
})
it('temporarily hides for task notifications', async () => {
  render(<InstallInvitation startedAt={Date.now()} />)
  advance()
  const region = document.createElement('div')
  region.dataset.toastRegion = ''
  region.append(document.createElement('div'))
  await act(async () => {
    document.body.append(region)
  })
  expect(screen.queryByRole('region', { name: /Cài Lịch Việt/ })).toBeNull()
  await act(async () => {
    region.remove()
  })
  expect(screen.getByRole('region', { name: /Cài Lịch Việt/ })).toBeVisible()
})
it('temporarily hides with a mobile keyboard and restores without dismissal', () => {
  const viewport = new EventTarget() as EventTarget & { height: number; scale: number }
  viewport.height = window.innerHeight
  viewport.scale = 1
  vi.stubGlobal('visualViewport', viewport)
  const input = document.createElement('input')
  document.body.append(input)
  render(<InstallInvitation startedAt={Date.now()} />)
  advance()
  act(() => {
    input.focus()
    viewport.height = 350
    viewport.dispatchEvent(new Event('resize'))
  })
  expect(screen.queryByRole('region', { name: /Cài Lịch Việt/ })).toBeNull()
  act(() => {
    input.blur()
    viewport.height = window.innerHeight
    viewport.dispatchEvent(new Event('resize'))
  })
  expect(screen.getByRole('region', { name: /Cài Lịch Việt/ })).toBeVisible()
  expect(localStorage.getItem('lichviet:install-invitation:v1')).toBeNull()
  input.remove()
  vi.unstubAllGlobals()
})

it('never invites in standalone mode', () => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(display-mode: standalone)',
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  render(<InstallInvitation startedAt={Date.now()} />)
  advance()
  expect(screen.queryByRole('region', { name: /Cài Lịch Việt/ })).toBeNull()
  vi.unstubAllGlobals()
})
it('recovers from a failed native prompt with manual guidance', async () => {
  const original = useInstallStore.getState().prompt
  useInstallStore.setState({
    canPrompt: true,
    prompt: async () => {
      throw new Error('unavailable')
    },
  })
  try {
    render(<InstallInvitation startedAt={Date.now()} />)
    advance()
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Cài app' })))
    expect(screen.getByText(/Chưa mở được hộp thoại cài/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Quay lại' })).toBeVisible()
  } finally {
    useInstallStore.setState({ prompt: original })
  }
})
it('does not restart the timer on rerender and respects focus outside the card', () => {
  const startedAt = Date.now()
  const view = render(<InstallInvitation startedAt={startedAt} />)
  advance(60_000)
  view.rerender(<InstallInvitation startedAt={startedAt} />)
  advance(60_000)
  expect(screen.getByRole('region', { name: /Cài Lịch Việt/ })).toBeVisible()
  fireEvent.keyDown(document.body, { key: 'Escape' })
  expect(screen.getByRole('region', { name: /Cài Lịch Việt/ })).toBeVisible()
})

it.each([
  ['iPhone', 'Mở bằng Safari', 'Bấm Chia sẻ', 4],
  ['Android', 'Mở bằng Chrome', 'Mở menu ⋮', 4],
  ['Desktop', 'Mở Chrome hoặc Edge', 'Tìm nút cài app', 3],
])('provides scannable action titles and numbered steps on %s', (agent, first, second, count) => {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(agent)
  render(<InstallInvitation startedAt={Date.now()} />)
  advance()
  fireEvent.click(screen.getByRole('button', { name: 'Xem cách cài' }))
  expect(screen.getByText(first)).toBeVisible()
  expect(screen.getByText(second)).toBeVisible()
  expect(screen.getAllByRole('listitem')).toHaveLength(count)
  expect(screen.getByRole('button', { name: 'Quay lại' })).toBeVisible()
})

// setTimeout keeps delays in a signed 32-bit int; a longer delay fires at once (Node warns).
const MAX_TIMEOUT_MS = 2_147_483_647
const region = () => screen.queryByRole('region', { name: /Cài Lịch Việt/ })
const timerDelays = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls.map((c) => c[1] as number)

it('shows at once when the two minutes have already passed', () => {
  render(<InstallInvitation startedAt={Date.now() - 120_000} />)
  expect(region()).toBeVisible()
})
it.each([
  ['exactly the timer limit', 0],
  ['one past the timer limit', 1],
  ['weeks past the timer limit (clock behind the session start)', 40 * 86400_000],
])('waits the full two minutes when the wait is %s', (_, extra) => {
  const wait = MAX_TIMEOUT_MS + extra
  const setTimeoutSpy = vi.spyOn(window, 'setTimeout')
  render(<InstallInvitation startedAt={Date.now() + wait - 120_000} />)
  advance(wait - 1)
  expect(region()).toBeNull()
  advance(1)
  expect(region()).toBeVisible()
  for (const delay of timerDelays(setTimeoutSpy))
    expect(Number.isFinite(delay) && delay >= 0 && delay <= MAX_TIMEOUT_MS, String(delay)).toBe(true)
})
it('clears its pending timer on unmount', () => {
  const view = render(<InstallInvitation startedAt={Date.now() + 40 * 86400_000} />)
  advance(MAX_TIMEOUT_MS)
  expect(vi.getTimerCount()).toBeGreaterThan(0)
  view.unmount()
  expect(vi.getTimerCount()).toBe(0)
})
