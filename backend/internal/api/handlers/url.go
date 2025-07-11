package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"website-crawler/internal/crawler"
	"website-crawler/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// URLHandler handles URL-related requests
type URLHandler struct {
	db      *gorm.DB
	crawler *crawler.CrawlerService
	ws      *WebSocketHandler
}

// NewURLHandler creates a new URL handler
func NewURLHandler(db *gorm.DB, ws *WebSocketHandler) *URLHandler {
	return &URLHandler{
		db:      db,
		crawler: crawler.NewCrawlerService(),
		ws:      ws,
	}
}

// ListURLs returns a paginated list of URLs
func (h *URLHandler) ListURLs(c *gin.Context) {
	user := c.MustGet("user").(models.User)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	search := c.Query("search")
	sortBy := c.DefaultQuery("sort_by", "created_at")
	sortOrder := c.DefaultQuery("sort_order", "desc")

	offset := (page - 1) * pageSize

	var urls []models.URL
	var total int64

	query := h.db.Where("user_id = ?", user.ID)

	if search != "" {
		query = query.Where("url LIKE ?", "%"+search+"%")
	}

	// Count total
	query.Model(&models.URL{}).Count(&total)

	// Get URLs with pagination and sorting
	orderClause := sortBy + " " + sortOrder
	if err := query.Preload("Analysis").Order(orderClause).Offset(offset).Limit(pageSize).Find(&urls).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch URLs"})
		return
	}

	totalPages := (int(total) + pageSize - 1) / pageSize

	c.JSON(http.StatusOK, models.URLListResponse{
		URLs:       urls,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	})
}

// AddURL adds a new URL for analysis
func (h *URLHandler) AddURL(c *gin.Context) {
	user := c.MustGet("user").(models.User)

	var req models.AddURLRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if URL already exists for this user
	var existingURL models.URL
	if err := h.db.Where("url = ? AND user_id = ?", req.URL, user.ID).First(&existingURL).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "URL already exists"})
		return
	}

	url := models.URL{
		URL:    req.URL,
		Status: "pending",
		UserID: user.ID,
	}

	if err := h.db.Create(&url).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create URL"})
		return
	}

	// Start crawling in background
	go h.crawlURL(url.ID, req.URL)

	c.JSON(http.StatusCreated, url)
}

// GetURL returns detailed information about a specific URL
func (h *URLHandler) GetURL(c *gin.Context) {
	user := c.MustGet("user").(models.User)

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid URL ID"})
		return
	}

	var url models.URL
	if err := h.db.Where("id = ? AND user_id = ?", id, user.ID).Preload("Analysis").First(&url).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "URL not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch URL"})
		}
		return
	}

	c.JSON(http.StatusOK, url)
}

// RerunAnalysis re-runs the analysis for a URL
func (h *URLHandler) RerunAnalysis(c *gin.Context) {
	user := c.MustGet("user").(models.User)

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid URL ID"})
		return
	}

	var url models.URL
	if err := h.db.Where("id = ? AND user_id = ?", id, user.ID).First(&url).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "URL not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch URL"})
		}
		return
	}

	// Update status to running
	h.db.Model(&url).Update("status", "running")

	// Start crawling in background
	go h.crawlURL(url.ID, url.URL)

	c.JSON(http.StatusOK, gin.H{"message": "Analysis started"})
}

// DeleteURL deletes a URL
func (h *URLHandler) DeleteURL(c *gin.Context) {
	user := c.MustGet("user").(models.User)

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid URL ID"})
		return
	}

	result := h.db.Where("id = ? AND user_id = ?", id, user.ID).Delete(&models.URL{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete URL"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "URL not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "URL deleted successfully"})
}

// BulkDelete deletes multiple URLs
func (h *URLHandler) BulkDelete(c *gin.Context) {
	user := c.MustGet("user").(models.User)

	var req models.BulkActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result := h.db.Where("id IN ? AND user_id = ?", req.URLIDs, user.ID).Delete(&models.URL{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete URLs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "URLs deleted successfully",
		"deleted_count": result.RowsAffected,
	})
}

// BulkRerun re-runs analysis for multiple URLs
func (h *URLHandler) BulkRerun(c *gin.Context) {
	user := c.MustGet("user").(models.User)

	var req models.BulkActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var urls []models.URL
	if err := h.db.Where("id IN ? AND user_id = ?", req.URLIDs, user.ID).Find(&urls).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch URLs"})
		return
	}

	// Update status and start crawling for each URL
	for _, url := range urls {
		h.db.Model(&url).Update("status", "running")
		go h.crawlURL(url.ID, url.URL)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Analysis started for selected URLs",
		"url_count": len(urls),
	})
}

// crawlURL performs the actual crawling and analysis
func (h *URLHandler) crawlURL(urlID uint, targetURL string) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	// Update status to running
	h.db.Model(&models.URL{ID: urlID}).Update("status", "running")

	// Broadcast running status
	if h.ws != nil {
		h.ws.BroadcastStatus(models.CrawlStatus{
			URLID:  urlID,
			Status: "running",
		})
	}

	// Perform crawling
	analysis, err := h.crawler.CrawlWebsite(ctx, targetURL)
	if err != nil {
		h.db.Model(&models.URL{ID: urlID}).Update("status", "failed")

		// Broadcast failed status
		if h.ws != nil {
			h.ws.BroadcastStatus(models.CrawlStatus{
				URLID:  urlID,
				Status: "failed",
				Error:  err.Error(),
			})
		}
		return
	}

	// Save analysis results
	analysis.URLID = urlID
	if err := h.db.Save(analysis).Error; err != nil {
		h.db.Model(&models.URL{ID: urlID}).Update("status", "failed")

		// Broadcast failed status
		if h.ws != nil {
			h.ws.BroadcastStatus(models.CrawlStatus{
				URLID:  urlID,
				Status: "failed",
				Error:  err.Error(),
			})
		}
		return
	}

	// Update URL status to completed
	h.db.Model(&models.URL{ID: urlID}).Update("status", "completed")

	// Broadcast completed status
	if h.ws != nil {
		h.ws.BroadcastStatus(models.CrawlStatus{
			URLID:  urlID,
			Status: "completed",
		})
	}
}
