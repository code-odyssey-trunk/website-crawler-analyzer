import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom'
import URLDetail from '../pages/URLDetail'
import { AuthProvider } from '../hooks/useAuth'
import { vi } from 'vitest'

vi.mock('../services/api', () => {
  const mockUrl = {
    id: 1,
    url: 'https://example.com',
    status: 'completed',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user_id: 1,
    user: { id: 1, email: 'test@example.com', created_at: '', updated_at: '' },
    analysis: {
      id: 1,
      url_id: 1,
      html_version: 'HTML5',
      title: 'Example',
      headings: '{"h1":1,"h2":0,"h3":0,"h4":0,"h5":0,"h6":0}',
      internal_links: 5,
      external_links: 2,
      inaccessible_links: 0,
      has_login_form: false,
      broken_links: '[]',
      created_at: '',
      updated_at: ''
    }
  }
  return {
    urlAPI: {
      get: vi.fn().mockResolvedValue(mockUrl),
      rerun: vi.fn(),
    },
  }
})

describe('URLDetail Page', () => {
  it('renders details (happy path)', async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={[`/url/1`]}>
          <Routes>
            <Route path="/url/:id" element={<URLDetail />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    )

    // Wait for details to appear
    await waitFor(() => {
      expect(screen.getByText(/url analysis/i)).toBeInTheDocument()
      expect(screen.getByText('https://example.com')).toBeInTheDocument()
      expect(screen.getByText('HTML5')).toBeInTheDocument()
      expect(screen.getByText('Example')).toBeInTheDocument()
    })
  })
}) 