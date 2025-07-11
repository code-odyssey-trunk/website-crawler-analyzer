import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { urlAPI } from '../services/api'
import type { URL, BrokenLink, HeadingCount } from '../types'

const URLDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [url, setUrl] = useState<URL | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rerunning, setRerunning] = useState(false)

  // Fetch URL details
  const fetchURL = async () => {
    if (!id) return
    
    try {
      setLoading(true)
      const urlData = await urlAPI.get(parseInt(id))
      setUrl(urlData)
    } catch (err) {
      console.error('Error fetching URL:', err)
      setError('Failed to fetch URL details')
    } finally {
      setLoading(false)
    }
  }

  // Rerun analysis
  const handleRerun = async () => {
    if (!id) return
    
    try {
      setRerunning(true)
      await urlAPI.rerun(parseInt(id))
      fetchURL() // Refresh data
    } catch (err) {
      setError('Failed to rerun analysis')
      console.error('Error rerunning analysis:', err)
    } finally {
      setRerunning(false)
    }
  }

  // Parse broken links
  const parseBrokenLinks = (): BrokenLink[] => {
    if (!url?.analysis?.broken_links) return []
    try {
      const parsed = JSON.parse(url.analysis.broken_links)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  // Parse headings
  const parseHeadings = (): HeadingCount => {
    if (!url?.analysis?.headings) return { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 }
    try {
      return JSON.parse(url.analysis.headings)
    } catch {
      return { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 }
    }
  }

  // Calculate total links
  const getTotalLinks = () => {
    if (!url?.analysis) return 0
    return (url.analysis.internal_links || 0) + (url.analysis.external_links || 0)
  }

  // Calculate internal links percentage
  const getInternalLinksPercentage = () => {
    const total = getTotalLinks()
    if (total === 0) return 0
    return Math.round(((url?.analysis?.internal_links || 0) / total) * 100)
  }

  // Calculate external links percentage
  const getExternalLinksPercentage = () => {
    const total = getTotalLinks()
    if (total === 0) return 0
    return Math.round(((url?.analysis?.external_links || 0) / total) * 100)
  }

  useEffect(() => {
    fetchURL()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !url) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
            <p className="mt-1 text-sm text-gray-500">{error || 'URL not found'}</p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const brokenLinks = parseBrokenLinks()
  const headings = parseHeadings()
  const totalLinks = getTotalLinks()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">URL Analysis</h1>
              <p className="text-gray-600 break-all">{url.url}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRerun}
                disabled={rerunning || url.status === 'running'}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rerunning ? 'Rerunning...' : 'Rerun Analysis'}
              </button>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-8">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            url.status === 'completed' ? 'bg-green-100 text-green-800' :
            url.status === 'running' ? 'bg-blue-100 text-blue-800' :
            url.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {url.status.charAt(0).toUpperCase() + url.status.slice(1)}
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Basic Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">HTML Version</p>
                <p className="text-2xl font-semibold text-gray-900">{url.analysis?.html_version || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Links</p>
                <p className="text-2xl font-semibold text-gray-900">{totalLinks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Broken Links</p>
                <p className="text-2xl font-semibold text-gray-900">{url.analysis?.inaccessible_links || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Login Form</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {url.analysis?.has_login_form ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Internal vs External Links Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Internal vs External Links</h3>
            {totalLinks > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Internal Links</span>
                  <span className="text-sm text-gray-500">{url.analysis?.internal_links || 0} ({getInternalLinksPercentage()}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${getInternalLinksPercentage()}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">External Links</span>
                  <span className="text-sm text-gray-500">{url.analysis?.external_links || 0} ({getExternalLinksPercentage()}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${getExternalLinksPercentage()}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No links found</p>
            )}
          </div>

          {/* Heading Distribution Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Heading Distribution</h3>
            <div className="space-y-3">
              {Object.entries(headings).map(([level, count]) => (
                <div key={level} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{level.toUpperCase()}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${count > 0 ? Math.max(10, (count / Math.max(...Object.values(headings))) * 100) : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Page Title */}
        {url.analysis?.title && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Page Title</h3>
            <p className="text-gray-700">{url.analysis.title}</p>
          </div>
        )}

        {/* Broken Links Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Broken Links ({brokenLinks?.length || 0})</h3>
          </div>
          <div className="overflow-x-auto">
            {brokenLinks && brokenLinks.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Error
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {brokenLinks.map((link, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 break-all max-w-md">
                          {link.url}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {link.status_code ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            link.status_code >= 500 ? 'bg-red-100 text-red-800' :
                            link.status_code >= 400 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {link.status_code}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-md">
                          {link.error || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No broken links found</h3>
                <p className="mt-1 text-sm text-gray-500">All links on this page are working correctly.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default URLDetail 