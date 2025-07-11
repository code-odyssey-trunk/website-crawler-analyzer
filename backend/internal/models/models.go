package models

import (
	"time"
)

// User represents a user in the system
type User struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Email     string    `json:"email" gorm:"unique;not null"`
	Password  string    `json:"-" gorm:"not null"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// URL represents a URL to be analyzed
type URL struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	URL       string    `json:"url" gorm:"not null;unique"`
	Status    string    `json:"status" gorm:"default:'pending'"` // pending, running, completed, failed
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	UserID    uint      `json:"user_id" gorm:"not null"`
	User      User      `json:"user"`
	Analysis  Analysis  `json:"analysis,omitempty"`
}

// Analysis represents the analysis results for a URL
type Analysis struct {
	ID                uint      `json:"id" gorm:"primaryKey"`
	URLID             uint      `json:"url_id" gorm:"not null;index;constraint:OnDelete:CASCADE;"`
	HTMLVersion       string    `json:"html_version"`
	Title             string    `json:"title"`
	Headings          string    `json:"headings" gorm:"type:json"` // JSON string of heading counts
	InternalLinks     int       `json:"internal_links"`
	ExternalLinks     int       `json:"external_links"`
	InaccessibleLinks int       `json:"inaccessible_links"`
	HasLoginForm      bool      `json:"has_login_form"`
	BrokenLinks       string    `json:"broken_links" gorm:"type:json"` // JSON string of broken links
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// HeadingCount represents the count of headings by level
type HeadingCount struct {
	H1 int `json:"h1"`
	H2 int `json:"h2"`
	H3 int `json:"h3"`
	H4 int `json:"h4"`
	H5 int `json:"h5"`
	H6 int `json:"h6"`
}

// BrokenLink represents a broken link with its status code
type BrokenLink struct {
	URL        string `json:"url"`
	StatusCode int    `json:"status_code"`
	Error      string `json:"error,omitempty"`
}

// LoginRequest represents a login request
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// RegisterRequest represents a registration request
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// AddURLRequest represents a request to add a new URL
type AddURLRequest struct {
	URL string `json:"url" binding:"required,url"`
}

// URLListResponse represents a paginated list of URLs
type URLListResponse struct {
	URLs       []URL `json:"urls"`
	Total      int64 `json:"total"`
	Page       int   `json:"page"`
	PageSize   int   `json:"page_size"`
	TotalPages int   `json:"total_pages"`
	Stats      Stats `json:"stats"`
}

// Stats represents URL status statistics
type Stats struct {
	Pending   int64 `json:"pending"`
	Running   int64 `json:"running"`
	Completed int64 `json:"completed"`
	Failed    int64 `json:"failed"`
}

// BulkActionRequest represents a bulk action request
type BulkActionRequest struct {
	URLIDs []uint `json:"url_ids" binding:"required"`
}

// WebSocketMessage represents a WebSocket message
type WebSocketMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

// CrawlStatus represents the status of a crawl operation
type CrawlStatus struct {
	URLID  uint   `json:"url_id"`
	Status string `json:"status"`
	Error  string `json:"error,omitempty"`
}
