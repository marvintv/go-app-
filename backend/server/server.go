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
    <title>Worker Change Stream Viewer</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f7fa;
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 30px;
        }
        .dashboard {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
        }
        #events {
            border-radius: 8px;
            padding: 15px;
            height: 600px;
            overflow-y: auto;
            background-color: #fff;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .event {
            margin-bottom: 15px;
            padding: 15px;
            background-color: #fff;
            border-left: 4px solid #3498db;
            box-shadow: 0 2px 4px rgba(0,0,0,0.08);
            border-radius: 4px;
            transition: transform 0.2s;
        }
        .event:hover {
            transform: translateY(-2px);
        }
        .event-new {
            animation: highlight 2s ease-out;
        }
        @keyframes highlight {
            0% { background-color: #e3f2fd; }
            100% { background-color: #fff; }
        }
        .event-time {
            color: #7f8c8d;
            font-size: 0.8em;
        }
        .event-type {
            font-weight: bold;
            color: #3498db;
            text-transform: uppercase;
            font-size: 0.9em;
            margin: 5px 0;
        }
        .event-type.insert { color: #2ecc71; }
        .event-type.update { color: #f39c12; }
        .event-type.delete { color: #e74c3c; }
        
        .control-panel {
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #2c3e50;
            font-weight: 500;
        }
        input, select, textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
            font-family: inherit;
        }
        textarea {
            min-height: 120px;
            resize: vertical;
        }
        button {
            background-color: #3498db;
            color: white;
            padding: 12px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
            transition: background-color 0.3s;
        }
        button:hover {
            background-color: #2980b9;
        }
        .stats {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            text-align: center;
        }
        .stat-box {
            background-color: #fff;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.08);
            flex: 1;
            margin: 0 5px;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #3498db;
        }
        .stat-label {
            font-size: 14px;
            color: #7f8c8d;
        }
        pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            font-size: 13px;
            max-height: 200px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <h1>Worker Change Stream Viewer</h1>
    
    <div class="stats">
        <div class="stat-box">
            <div class="stat-value" id="total-events">0</div>
            <div class="stat-label">Total Events</div>
        </div>
        <div class="stat-box">
            <div class="stat-value" id="insert-count">0</div>
            <div class="stat-label">Inserts</div>
        </div>
        <div class="stat-box">
            <div class="stat-value" id="update-count">0</div>
            <div class="stat-label">Updates</div>
        </div>
        <div class="stat-box">
            <div class="stat-value" id="delete-count">0</div>
            <div class="stat-label">Deletes</div>
        </div>
    </div>
    
    <div class="dashboard">
        <div id="events">
            <div class="event">
                <div class="event-time">Waiting for events...</div>
            </div>
        </div>
        
        <div class="control-panel">
            <h2>Add New Event</h2>
            <div class="form-group">
                <label for="operation-type">Operation Type:</label>
                <select id="operation-type">
                    <option value="insert">Insert</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="worker-id">Worker ID:</label>
                <input type="text" id="worker-id" placeholder="TS12345" value="TS87652">
            </div>
            
            <div class="form-group">
                <label for="field-type">Field to Change:</label>
                <select id="field-type">
                    <option value="JobTitle">Job Title</option>
                    <option value="Department">Department</option>
                    <option value="WorkLocation">Work Location</option>
                    <option value="Salary">Salary</option>
                    <option value="Manager">Manager</option>
                    <option value="EmploymentStatus">Employment Status</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="old-value">Old Value:</label>
                <input type="text" id="old-value" placeholder="Previous value">
            </div>
            
            <div class="form-group">
                <label for="new-value">New Value:</label>
                <input type="text" id="new-value" placeholder="New value">
            </div>
            
            <button id="add-event">Add Event</button>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const eventsContainer = document.getElementById('events');
            const operationTypeSelect = document.getElementById('operation-type');
            const workerIdInput = document.getElementById('worker-id');
            const fieldTypeSelect = document.getElementById('field-type');
            const oldValueInput = document.getElementById('old-value');
            const newValueInput = document.getElementById('new-value');
            const addEventButton = document.getElementById('add-event');
            
            // Stats counters
            let totalEvents = 0;
            let insertCount = 0;
            let updateCount = 0;
            let deleteCount = 0;
            
            // Connect to SSE endpoint
            const eventSource = new EventSource('/events');
            
            eventSource.addEventListener('message', function(e) {
                const event = JSON.parse(e.data);
                addEventToUI(event, true);
                updateStats(event.operationType);
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
                const operationType = operationTypeSelect.value;
                const workerId = workerIdInput.value.trim();
                const fieldType = fieldTypeSelect.value;
                const oldValue = oldValueInput.value.trim();
                const newValue = newValueInput.value.trim();
                
                if (!workerId) {
                    alert('Worker ID is required');
                    return;
                }
                
                const eventData = {
                    "EventID": "CE" + Math.floor(Math.random() * 1000000),
                    "WorkerID": workerId,
                    "EventType": "Update",
                    "EffectiveDate": new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
                    "ChangeDetails": {
                        "Field": fieldType,
                        "OldValue": oldValue,
                        "NewValue": newValue
                    },
                    "Metadata": {
                        "InitiatedBy": "user_interface",
                        "Timestamp": new Date().toISOString()
                    }
                };
                
                const event = {
                    operationType: operationType,
                    fullDocument: {
                        "WorkerChangeEvent": eventData
                    },
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
                    // Clear form fields
                    oldValueInput.value = '';
                    newValueInput.value = '';
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error adding event: ' + error);
                });
            });
            
            // Function to add an event to the UI
            function addEventToUI(event, isNew = false) {
                const eventElement = document.createElement('div');
                eventElement.className = 'event' + (isNew ? ' event-new' : '');
                
                const time = new Date(event.timestamp).toLocaleString();
                
                let content = '<div class="event-time">' + time + '</div>';
                content += '<div class="event-type ' + event.operationType + '">' + event.operationType + '</div>';
                
                if (event.fullDocument && event.fullDocument.WorkerChangeEvent) {
                    const workerEvent = event.fullDocument.WorkerChangeEvent;
                    content += '<div><strong>Worker ID:</strong> ' + workerEvent.WorkerID + '</div>';
                    
                    if (workerEvent.ChangeDetails) {
                        content += '<div><strong>Field:</strong> ' + workerEvent.ChangeDetails.Field + '</div>';
                        content += '<div><strong>Change:</strong> ' + workerEvent.ChangeDetails.OldValue + ' &rarr; ' + workerEvent.ChangeDetails.NewValue + '</div>';
                    }
                    
                    content += '<details><summary>View Details</summary><pre>' + JSON.stringify(workerEvent, null, 2) + '</pre></details>';
                } else {
                    content += '<pre>' + JSON.stringify(event.fullDocument, null, 2) + '</pre>';
                }
                
                eventElement.innerHTML = content;
                
                // Add to the top of the container
                if (eventsContainer.firstChild) {
                    eventsContainer.insertBefore(eventElement, eventsContainer.firstChild);
                } else {
                    eventsContainer.appendChild(eventElement);
                }
                
                // Limit the number of displayed events to prevent browser slowdown
                const maxEvents = 100;
                while (eventsContainer.children.length > maxEvents) {
                    eventsContainer.removeChild(eventsContainer.lastChild);
                }
            }
            
            // Function to update stats
            function updateStats(operationType) {
                totalEvents++;
                document.getElementById('total-events').textContent = totalEvents;
                
                if (operationType === 'insert') {
                    insertCount++;
                    document.getElementById('insert-count').textContent = insertCount;
                } else if (operationType === 'update') {
                    updateCount++;
                    document.getElementById('update-count').textContent = updateCount;
                } else if (operationType === 'delete') {
                    deleteCount++;
                    document.getElementById('delete-count').textContent = deleteCount;
                }
            }
            
            // Load initial events
            fetch('/api/events')
                .then(response => response.json())
                .then(events => {
                    eventsContainer.innerHTML = '';
                    events.forEach(event => {
                        addEventToUI(event);
                        updateStats(event.operationType);
                    });
                })
                .catch(error => {
                    console.error('Error loading events:', error);
                });
                
            // Populate field values based on selection
            fieldTypeSelect.addEventListener('change', function() {
                const field = this.value;
                let oldValue = '';
                let newValue = '';
                
                switch(field) {
                    case 'JobTitle':
                        oldValue = 'Software Engineer';
                        newValue = 'Senior Software Engineer';
                        break;
                    case 'Department':
                        oldValue = 'Engineering';
                        newValue = 'Research & Development';
                        break;
                    case 'WorkLocation':
                        oldValue = 'Remote';
                        newValue = 'Hybrid';
                        break;
                    case 'Salary':
                        oldValue = '$85000';
                        newValue = '$95000';
                        break;
                    case 'Manager':
                        oldValue = 'John Doe';
                        newValue = 'Jane Smith';
                        break;
                    case 'EmploymentStatus':
                        oldValue = 'Full-time';
                        newValue = 'Part-time';
                        break;
                }
                
                oldValueInput.value = oldValue;
                newValueInput.value = newValue;
            });
        });
    </script>
</body>
</html>
`))
}
