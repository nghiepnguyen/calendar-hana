import { useEffect } from 'react'
import { useSettings } from '../hooks/useRepositoryData'

/** Đặt data-theme trên <html> theo cài đặt. 'system' thì bỏ thuộc tính để theo hệ điều hành. */
export function ThemeController() {
  const theme = useSettings()?.theme
  useEffect(() => {
    const root = document.documentElement
    if (!theme || theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
  }, [theme])
  return null
}
