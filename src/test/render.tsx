// render() của Testing Library, bọc sẵn MemoryRouter cho component có <Link>.
import type { ReactElement } from 'react'
import { render as rtlRender, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

export function render(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return rtlRender(ui, { wrapper: MemoryRouter, ...options })
}
