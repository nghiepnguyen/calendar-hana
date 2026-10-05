import { useEffect, useState } from 'react'
import { useInstallStore } from '../store/installStore'
import { useMediaQuery } from './useMediaQuery'

const KEY = 'lichviet:install-invitation:v1'
const WEEK = 7 * 86400_000
// Navigation start includes time waiting for authentication/repository initialization.
const SESSION_START = performance.timeOrigin > 0 ? performance.timeOrigin : Date.now()
function recent(value: string | null): boolean {
  const timestamp = Number(value)
  return (
    value !== null &&
    Number.isFinite(timestamp) &&
    timestamp > 0 &&
    timestamp <= Date.now() &&
    Date.now() - timestamp < WEEK
  )
}
function dismissedRecently(): boolean {
  try {
    return recent(localStorage.getItem(KEY))
  } catch {
    return false
  }
}

export function useInstallInvitation(startedAt = SESSION_START) {
  const [closed, setClosed] = useState(dismissedRecently)
  const [visible, setVisible] = useState(false)
  const installed = useInstallStore((s) => s.installed)
  const standalone = useMediaQuery('(display-mode: standalone)')
  const iosStandalone = Boolean((navigator as Navigator & { standalone?: boolean }).standalone)

  useEffect(() => {
    if (closed || installed || standalone || iosStandalone) return
    const check = () => {
      const viewport = window.visualViewport
      const typing = document.activeElement?.matches('input, textarea, [contenteditable="true"]')
      const keyboard =
        typing && viewport && viewport.scale === 1 && window.innerHeight - viewport.height > 120
      const blocked = document.querySelector('[aria-modal="true"], [data-toast-region]:not(:empty)')
      const enoughRoom = (viewport?.height ?? window.innerHeight) > 400
      setVisible(
        Date.now() - startedAt >= 120_000 &&
          document.visibilityState !== 'hidden' &&
          !blocked &&
          !keyboard &&
          enoughRoom,
      )
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === KEY && recent(event.newValue)) setClosed(true)
    }
    const observer = new MutationObserver(check)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-modal'],
    })
    const timer = window.setTimeout(check, Math.max(0, 120_000 - (Date.now() - startedAt)))
    check()
    document.addEventListener('visibilitychange', check)
    document.addEventListener('focusin', check)
    document.addEventListener('focusout', check)
    window.addEventListener('resize', check)
    window.addEventListener('storage', onStorage)
    window.visualViewport?.addEventListener('resize', check)
    return () => {
      clearTimeout(timer)
      observer.disconnect()
      document.removeEventListener('visibilitychange', check)
      document.removeEventListener('focusin', check)
      document.removeEventListener('focusout', check)
      window.removeEventListener('resize', check)
      window.removeEventListener('storage', onStorage)
      window.visualViewport?.removeEventListener('resize', check)
    }
  }, [closed, installed, standalone, iosStandalone, startedAt])

  const dismiss = () => {
    setClosed(true)
    setVisible(false)
    try {
      localStorage.setItem(KEY, String(Date.now()))
    } catch {
      /* Session memory still closes the invitation. */
    }
  }
  return { visible: visible && !closed && !installed && !standalone && !iosStandalone, dismiss }
}
