package server

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"naru/backend/changestream"
)

// Server represents the HTTP server for the change stream.
type Server struct {
	changeStream *changestream.MockChangeStream
	addr         string
	mu           sync.Mutex
	clients      map[chan changestream.ChangeEvent]bool
}

// NewServer creates a new server instance.
func NewServer(cs *changestream.MockChangeStream, addr string) *Server {
	return &Server{
		changeStream: cs,
		addr:         addr,
		clients:      make(map[chan changestream.ChangeEvent]bool),
	}
}

// Start starts the HTTP server.
func (s *Server) Start() error {
	// Set up routes
	http.HandleFunc("/events", s.handleSSE)
	http.HandleFunc("/api/events", s.handleGetEvents)
	http.HandleFunc("/api/events/add", s.handleAddEvent)

	// Serve static files
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	// Serve index.html for the root path
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		http.ServeFile(w, r, "static/index.html")
	})

	// Start the server
	log.Printf("Server starting on %s", s.addr)
	return http.ListenAndServe(s.addr, nil)
}

// handleSSE handles Server-Sent Events connections.
func (s *Server) handleSSE(w http.ResponseWriter, r *http.Request) {
	// Set headers for SSE
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Create a new client channel
	eventChan := s.changeStream.Subscribe()

	// Register this client
	s.mu.Lock()
	s.clients[eventChan] = true
	s.mu.Unlock()

	// Make sure we close the connection when the client disconnects
	// Using request context cancellation instead of deprecated CloseNotifier
	ctx := r.Context()
	go func() {
		<-ctx.Done()
		s.changeStream.Unsubscribe(eventChan)
		s.mu.Lock()
		delete(s.clients, eventChan)
		s.mu.Unlock()
	}()

	// Send initial heartbeat
	fmt.Fprintf(w, "event: ping\ndata: %s\n\n", time.Now().String())
	w.(http.Flusher).Flush()

	// Stream events to the client
	for event := range eventChan {
		// Check if the connection is still alive
		select {
		case <-ctx.Done():
			return
		default:
			// Connection is still alive, continue
		}

		data, err := json.Marshal(event)
		if err != nil {
			log.Printf("Error marshaling event: %v", err)
			continue
		}

		fmt.Fprintf(w, "event: message\ndata: %s\n\n", data)
		w.(http.Flusher).Flush()
	}
}

// handleGetEvents returns all events as JSON.
func (s *Server) handleGetEvents(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Get all events from the change stream
	var events []changestream.ChangeEvent
	ctx := r.Context()

	// Reset the index to read from the beginning
	s.changeStream.Next(ctx)
	for s.changeStream.Next(ctx) {
		var event changestream.ChangeEvent
		if err := s.changeStream.Decode(&event); err != nil {
			break
		}
		events = append(events, event)
	}

	// Return events as JSON
	json.NewEncoder(w).Encode(events)
}

// handleAddEvent adds a new event to the change stream.
func (s *Server) handleAddEvent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Parse the event from the request body
	var event changestream.ChangeEvent
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Add the event to the change stream
	s.changeStream.AddEvent(event)

	// Return success
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}
