import { useCallback, useSyncExternalStore } from 'react'

/** Điện thoại: thanh điều hướng nằm dưới đáy màn hình. */
export const COMPACT_QUERY = '(max-width: 720px)'

/** Theo dõi một media query. Không có matchMedia (jsdom) thì coi như không khớp. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia?.(query)
      mql?.addEventListener('change', onChange)
      return () => mql?.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => window.matchMedia?.(query).matches ?? false)
}

export function useIsCompact(): boolean {
  return useMediaQuery(COMPACT_QUERY)
}
