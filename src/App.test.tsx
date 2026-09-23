import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('hiển thị tên app', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Lịch Hana' })).toBeInTheDocument()
  })
})
