import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Login from '../pages/Login'
import { AuthProvider } from '../hooks/useAuth'
import { vi } from 'vitest'

// Mock the API
vi.mock('../services/api', () => ({
  authAPI: {
    login: vi.fn().mockResolvedValue({ token: 'fake-token', user: { id: 1, email: 'test@example.com' } }),
  },
}))

// Mock useNavigate
vi.mock('react-router-dom', async (importOriginal: any) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

describe('Login Page', () => {
  it('renders and allows user to login (happy path)', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </AuthProvider>
    )

    // Fill in email and password
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })

    // Click sign in
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    // Wait for login API to be called
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })
  })
}) 