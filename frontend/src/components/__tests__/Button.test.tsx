import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Button from '../Button'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('applies correct CSS classes', () => {
    render(<Button variant="primary" size="md">Test</Button>)
    const button = screen.getByText('Test')
    expect(button).toHaveClass('btn', 'btn-primary', 'btn-md')
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    screen.getByText('Click me').click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
}) 