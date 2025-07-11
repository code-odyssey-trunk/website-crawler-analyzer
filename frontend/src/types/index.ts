export interface User {
  id: number
  email: string
  created_at: string
  updated_at: string
}

export interface HeadingCount {
  h1: number
  h2: number
  h3: number
  h4: number
  h5: number
  h6: number
}

export interface BrokenLink {
  url: string
  status_code: number
  error?: string
}

export interface Analysis {
  id: number
  url_id: number
  html_version: string
  title: string
  headings: string // JSON string
  internal_links: number
  external_links: number
  inaccessible_links: number
  has_login_form: boolean
  broken_links: string // JSON string
  created_at: string
  updated_at: string
}

export interface URL {
  id: number
  url: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  created_at: string
  updated_at: string
  user_id: number
  user: User
  analysis?: Analysis
}

export interface URLListResponse {
  urls: URL[]
  total: number
  page: number
  page_size: number
  total_pages: number
  stats: Stats
}

export interface Stats {
  pending: number
  running: number
  completed: number
  failed: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface AddURLRequest {
  url: string
}

export interface BulkActionRequest {
  url_ids: number[]
}

export interface WebSocketMessage {
  type: string
  payload: any
}

export interface CrawlStatus {
  url_id: number
  status: string
  error?: string
}

export interface AuthResponse {
  token: string
  user: User
} 