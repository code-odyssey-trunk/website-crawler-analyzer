import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import { AuthProvider } from '../hooks/useAuth'
import { vi } from 'vitest'

vi.mock('../services/api', () => {
  const mockUrls = [
    {
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
  ]
  return {
    urlAPI: {
      list: vi.fn().mockResolvedValue({
        urls: mockUrls,
        total: 1,
        page: 1,
        page_size: 10,
        total_pages: 1,
        stats: { pending: 0, running: 0, completed: 1, failed: 0 }
      }),
      add: vi.fn(),
      get: vi.fn(),
      rerun: vi.fn(),
      delete: vi.fn(),
      bulkDelete: vi.fn(),
      bulkRerun: vi.fn(),
    },
  }
})

describe('Dashboard Page', () => {
  it('renders stats and table (happy path)', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </AuthProvider>
    )

    // Wait for stats and table
    await waitFor(() => {
      expect(screen.getByText(/total urls/i)).toBeInTheDocument()
      expect(screen.getAllByText(/completed/i).length).toBeGreaterThan(0)
      expect(screen.getByText('https://example.com')).toBeInTheDocument()
    })
  })
}) 