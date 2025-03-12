package changestream

import (
	"context"
	"errors"
	"sync"
	"time"
)

// ChangeEvent represents a MongoDB change event.
type ChangeEvent struct {
	OperationType string                 `json:"operationType"`
	FullDocument  map[string]interface{} `json:"fullDocument"`
	Timestamp     time.Time              `json:"timestamp"`
}

// ChangeStream defines the methods you'll use.
type ChangeStream interface {
	Next(ctx context.Context) bool
	Decode(val interface{}) error
	Close(ctx context.Context) error
}

// MockChangeStream simulates a change stream.
type MockChangeStream struct {
	events     []ChangeEvent
	index      int
	mu         sync.Mutex
	subscribers []chan ChangeEvent
}

// NewMockChangeStream returns a mock with preloaded events.
func NewMockChangeStream(events []ChangeEvent) *MockChangeStream {
	return &MockChangeStream{
		events:      events,
		subscribers: make([]chan ChangeEvent, 0),
	}
}

// Next checks if there are more events to process.
func (m *MockChangeStream) Next(ctx context.Context) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.index < len(m.events)
}

// Decode retrieves the next event.
func (m *MockChangeStream) Decode(val interface{}) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	if m.index >= len(m.events) {
		return errors.New("no more events")
	}
	
	// Assume val is of type *ChangeEvent.
	if ce, ok := val.(*ChangeEvent); ok {
		*ce = m.events[m.index]
		m.index++
		return nil
	}
	return errors.New("unexpected type")
}

// Close closes the change stream.
func (m *MockChangeStream) Close(ctx context.Context) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	// Close all subscriber channels
	for _, ch := range m.subscribers {
		close(ch)
	}
	m.subscribers = nil
	
	return nil
}

// AddEvent adds a new event to the stream and notifies all subscribers.
func (m *MockChangeStream) AddEvent(event ChangeEvent) {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	// Add timestamp if not provided
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now()
	}
	
	m.events = append(m.events, event)
	
	// Notify all subscribers
	for _, ch := range m.subscribers {
		select {
		case ch <- event:
			// Event sent successfully
		default:
			// Channel is full or closed, skip
		}
	}
}

// Subscribe returns a channel that will receive all new events.
func (m *MockChangeStream) Subscribe() chan ChangeEvent {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	ch := make(chan ChangeEvent, 100) // Buffer size of 100 events
	m.subscribers = append(m.subscribers, ch)
	return ch
}

// Unsubscribe removes a subscription channel.
func (m *MockChangeStream) Unsubscribe(ch chan ChangeEvent) {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	for i, subCh := range m.subscribers {
		if subCh == ch {
			close(ch)
			// Remove from subscribers slice
			m.subscribers = append(m.subscribers[:i], m.subscribers[i+1:]...)
			break
		}
	}
} 