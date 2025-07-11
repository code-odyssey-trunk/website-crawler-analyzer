package handlers

import (
	"encoding/json"
	"net/http"
	"sync"

	"website-crawler/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// WebSocketHandler handles WebSocket connections
type WebSocketHandler struct {
	clients    map[*websocket.Conn]bool
	broadcast  chan models.WebSocketMessage
	register   chan *websocket.Conn
	unregister chan *websocket.Conn
	mutex      sync.RWMutex
}

// NewWebSocketHandler creates a new WebSocket handler
func NewWebSocketHandler() *WebSocketHandler {
	handler := &WebSocketHandler{
		clients:    make(map[*websocket.Conn]bool),
		broadcast:  make(chan models.WebSocketMessage),
		register:   make(chan *websocket.Conn),
		unregister: make(chan *websocket.Conn),
	}

	go handler.run()
	return handler
}

// HandleWebSocket handles WebSocket connections
func (h *WebSocketHandler) HandleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	h.register <- conn

	// Handle incoming messages
	go func() {
		defer func() {
			h.unregister <- conn
			conn.Close()
		}()

		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				break
			}

			var wsMessage models.WebSocketMessage
			if err := json.Unmarshal(message, &wsMessage); err != nil {
				continue
			}

			h.broadcast <- wsMessage
		}
	}()
}

// run handles the WebSocket hub
func (h *WebSocketHandler) run() {
	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			h.clients[client] = true
			h.mutex.Unlock()

		case client := <-h.unregister:
			h.mutex.Lock()
			delete(h.clients, client)
			h.mutex.Unlock()

		case message := <-h.broadcast:
			h.mutex.RLock()
			for client := range h.clients {
				err := client.WriteJSON(message)
				if err != nil {
					client.Close()
					delete(h.clients, client)
				}
			}
			h.mutex.RUnlock()
		}
	}
}

// BroadcastStatus broadcasts crawl status updates to all connected clients
func (h *WebSocketHandler) BroadcastStatus(status models.CrawlStatus) {
	message := models.WebSocketMessage{
		Type:    "crawl_status",
		Payload: status,
	}

	h.broadcast <- message
}

// BroadcastURLUpdate broadcasts URL updates to all connected clients
func (h *WebSocketHandler) BroadcastURLUpdate(url models.URL) {
	message := models.WebSocketMessage{
		Type:    "url_update",
		Payload: url,
	}

	h.broadcast <- message
}
