package main

import (
	"log"
	"time"

	"naru/backend/changestream"
	"naru/backend/server"
)

func main() {
	// Create some initial events
	initialEvents := []changestream.ChangeEvent{
		{
			OperationType: "insert",
			FullDocument: map[string]interface{}{
				"name":    "Alice",
				"email":   "alice@example.com",
				"role":    "admin",
				"created": time.Now().Add(-24 * time.Hour),
			},
			Timestamp: time.Now().Add(-24 * time.Hour),
		},
		{
			OperationType: "insert",
			FullDocument: map[string]interface{}{
				"name":    "Bob",
				"email":   "bob@example.com",
				"role":    "user",
				"created": time.Now().Add(-12 * time.Hour),
			},
			Timestamp: time.Now().Add(-12 * time.Hour),
		},
		{
			OperationType: "update",
			FullDocument: map[string]interface{}{
				"name":     "Alice",
				"email":    "alice.new@example.com",
				"role":     "admin",
				"created":  time.Now().Add(-24 * time.Hour),
				"modified": time.Now().Add(-6 * time.Hour),
			},
			Timestamp: time.Now().Add(-6 * time.Hour),
		},
	}

	// Create the mock change stream
	cs := changestream.NewMockChangeStream(initialEvents)

	// Create and start the server
	srv := server.NewServer(cs, ":8080")

	// Start a goroutine to periodically add random events (simulating WorkdayAPI)
	go simulateWorkdayAPI(cs)

	// Start the server (this blocks)
	log.Fatal(srv.Start())
}

// simulateWorkdayAPI periodically adds random events to the change stream
func simulateWorkdayAPI(cs *changestream.MockChangeStream) {
	// Wait a bit before starting to simulate events
	time.Sleep(5 * time.Second)

	// Sample operations and data
	operations := []string{"insert", "update", "delete"}
	names := []string{"Charlie", "Dave", "Eve", "Frank", "Grace", "Heidi"}
	roles := []string{"user", "admin", "manager", "developer", "tester"}

	// Periodically add events
	for {
		// Random operation
		opIndex := time.Now().UnixNano() % int64(len(operations))
		operation := operations[opIndex]

		// Random name
		nameIndex := time.Now().UnixNano() % int64(len(names))
		name := names[nameIndex]

		// Random role
		roleIndex := time.Now().UnixNano() % int64(len(roles))
		role := roles[roleIndex]

		// Create the event
		event := changestream.ChangeEvent{
			OperationType: operation,
			FullDocument: map[string]interface{}{
				"name":     name,
				"email":    name + "@example.com",
				"role":     role,
				"modified": time.Now(),
			},
			Timestamp: time.Now(),
		}

		// Add the event to the change stream
		cs.AddEvent(event)
		log.Printf("Added simulated event: %s for %s", operation, name)

		// Wait before adding the next event (random between 5-15 seconds)
		waitTime := 5 + (time.Now().UnixNano() % 10)
		time.Sleep(time.Duration(waitTime) * time.Second)
	}
}
