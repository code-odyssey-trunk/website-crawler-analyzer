package crawler

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"website-crawler/internal/models"

	"github.com/PuerkitoBio/goquery"
)

// CrawlerService handles website crawling and analysis
type CrawlerService struct {
	client *http.Client
}

// NewCrawlerService creates a new crawler service
func NewCrawlerService() *CrawlerService {
	return &CrawlerService{
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

// CrawlWebsite crawls a website and returns analysis results
func (c *CrawlerService) CrawlWebsite(ctx context.Context, targetURL string) (*models.Analysis, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", targetURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; WebsiteCrawler/1.0)")
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch URL: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(body)))
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %w", err)
	}

	baseURL, _ := url.Parse(targetURL)
	analysis := &models.Analysis{
		HTMLVersion:  c.detectHTMLVersion(doc),
		Title:        c.extractTitle(doc),
		Headings:     c.countHeadings(doc),
		HasLoginForm: c.detectLoginForm(doc),
	}

	internalLinks, externalLinks, brokenLinks := c.analyzeLinks(doc, baseURL)
	analysis.InternalLinks = internalLinks
	analysis.ExternalLinks = externalLinks
	analysis.InaccessibleLinks = len(brokenLinks)

	if brokenLinksJSON, err := json.Marshal(brokenLinks); err == nil {
		analysis.BrokenLinks = string(brokenLinksJSON)
	}

	return analysis, nil
}

func (c *CrawlerService) detectHTMLVersion(doc *goquery.Document) string {
	if doc.Find("header, nav, main, section, article, aside, footer").Length() > 0 {
		return "HTML5"
	}
	if doc.Find("html[xmlns]").Length() > 0 {
		return "XHTML"
	}
	return "HTML4"
}

func (c *CrawlerService) extractTitle(doc *goquery.Document) string {
	return strings.TrimSpace(doc.Find("title").Text())
}

func (c *CrawlerService) countHeadings(doc *goquery.Document) string {
	headings := models.HeadingCount{}
	for i := 1; i <= 6; i++ {
		selector := fmt.Sprintf("h%d", i)
		count := doc.Find(selector).Length()
		switch i {
		case 1:
			headings.H1 = count
		case 2:
			headings.H2 = count
		case 3:
			headings.H3 = count
		case 4:
			headings.H4 = count
		case 5:
			headings.H5 = count
		case 6:
			headings.H6 = count
		}
	}
	if jsonData, err := json.Marshal(headings); err == nil {
		return string(jsonData)
	}
	return "{}"
}

func (c *CrawlerService) detectLoginForm(doc *goquery.Document) bool {
	loginIndicators := []string{
		"input[type='password']",
		"form[action*='login']",
		"form[action*='signin']",
		".login-form",
		"#login-form",
	}
	for _, selector := range loginIndicators {
		if doc.Find(selector).Length() > 0 {
			return true
		}
	}
	return false
}

func (c *CrawlerService) analyzeLinks(doc *goquery.Document, baseURL *url.URL) (int, int, []models.BrokenLink) {
	var internalLinks, externalLinks int
	var brokenLinks []models.BrokenLink

	doc.Find("a[href]").Each(func(i int, s *goquery.Selection) {
		href, exists := s.Attr("href")
		if !exists {
			return
		}

		linkURL, err := url.Parse(href)
		if err != nil {
			return
		}

		if !linkURL.IsAbs() {
			linkURL = baseURL.ResolveReference(linkURL)
		}

		if linkURL.Scheme != "http" && linkURL.Scheme != "https" {
			return
		}

		if linkURL.Hostname() == baseURL.Hostname() {
			internalLinks++
		} else {
			externalLinks++
		}

		// Check link accessibility with timeout
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		req, err := http.NewRequestWithContext(ctx, "GET", linkURL.String(), nil)
		if err != nil {
			brokenLinks = append(brokenLinks, models.BrokenLink{
				URL:   linkURL.String(),
				Error: err.Error(),
			})
			return
		}

		req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; WebsiteCrawler/1.0)")
		resp, err := c.client.Do(req)
		if err != nil {
			brokenLinks = append(brokenLinks, models.BrokenLink{
				URL:   linkURL.String(),
				Error: err.Error(),
			})
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode >= 400 {
			brokenLinks = append(brokenLinks, models.BrokenLink{
				URL:        linkURL.String(),
				StatusCode: resp.StatusCode,
			})
		}
	})

	return internalLinks, externalLinks, brokenLinks
}
