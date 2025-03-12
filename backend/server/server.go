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
	http.HandleFunc("/", s.handleIndex)

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

// handleIndex serves the HTML page.
func (s *Server) handleIndex(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html")
	w.Write([]byte(`
<!DOCTYPE html>
<html>
<head>
    <title>MongoDB Change Stream Viewer</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            color: #333;
        }
        #events {
            border: 1px solid #ddd;
            padding: 10px;
            height: 400px;
            overflow-y: auto;
            margin-bottom: 20px;
            background-color: #f9f9f9;
        }
        .event {
            margin-bottom: 10px;
            padding: 10px;
            background-color: #fff;
            border-left: 4px solid #4CAF50;
            box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        }
        .event-time {
            color: #999;
            font-size: 0.8em;
        }
        .event-type {
            font-weight: bold;
            color: #4CAF50;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
        }
        input, textarea {
            width: 100%;
            padding: 8px;
            box-sizing: border-box;
        }
        button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 15px;
            border: none;
            cursor: pointer;
        }
        button:hover {
            background-color: #45a049;
        }
    </style>
</head>
<body>
    <h1>MongoDB Change Stream Viewer</h1>
    
    <div id="events">
        <div class="event">
            <div class="event-time">Waiting for events...</div>
        </div>
    </div>
    
    <h2>Add New Event</h2>
    <div>
        <div class="form-group">
            <label for="operation-type">Operation Type:</label>
            <input type="text" id="operation-type" placeholder="insert, update, delete, etc." value="insert">
        </div>
        
        <div class="form-group">
            <label for="document">Document (JSON):</label>
            <textarea id="document" rows="5" placeholder='{"name": "John", "value": 42}'></textarea>
        </div>
        
        <button id="add-event">Add Event</button>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const eventsContainer = document.getElementById('events');
            const operationTypeInput = document.getElementById('operation-type');
            const documentInput = document.getElementById('document');
            const addEventButton = document.getElementById('add-event');
            
            // Connect to SSE endpoint
            const eventSource = new EventSource('/events');
            
            eventSource.addEventListener('message', function(e) {
                const event = JSON.parse(e.data);
                addEventToUI(event);
            });
            
            eventSource.addEventListener('ping', function(e) {
                console.log('Received ping:', e.data);
            });
            
            eventSource.addEventListener('error', function(e) {
                console.error('EventSource error:', e);
                setTimeout(() => {
                    console.log('Reconnecting...');
                    eventSource.close();
                    location.reload();
                }, 5000);
            });
            
            // Add event button handler
            addEventButton.addEventListener('click', function() {
                const operationType = operationTypeInput.value.trim();
                let documentJson;
                
                try {
                    documentJson = JSON.parse(documentInput.value);
                } catch (e) {
                    alert('Invalid JSON document: ' + e.message);
                    return;
                }
                
                const event = {
                    operationType: operationType,
                    fullDocument: documentJson,
                    timestamp: new Date()
                };
                
                // Send the event to the server
                fetch('/api/events/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(event)
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Success:', data);
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error adding event: ' + error);
                });
            });
            
            // Function to add an event to the UI
            function addEventToUI(event) {
                const eventElement = document.createElement('div');
                eventElement.className = 'event';
                
                const time = new Date(event.timestamp).toLocaleString();
                
                eventElement.innerHTML = 
                    '<div class="event-time">' + time + '</div>' +
                    '<div class="event-type">' + event.operationType + '</div>' +
                    '<pre>' + JSON.stringify(event.fullDocument, null, 2) + '</pre>';
                
                eventsContainer.appendChild(eventElement);
                eventsContainer.scrollTop = eventsContainer.scrollHeight;
            }
            
            // Load initial events
            fetch('/api/events')
                .then(response => response.json())
                .then(events => {
                    eventsContainer.innerHTML = '';
                    events.forEach(addEventToUI);
                })
                .catch(error => {
                    console.error('Error loading events:', error);
                });
        });
    </script>
</body>
</html>
`))
}
