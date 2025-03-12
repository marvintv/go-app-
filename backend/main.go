package main

import (
	"fmt"
	"log"
	"math/rand"
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
	time.Sleep(2 * time.Second)

	// Use worker change events from the JSON file
	workerEvents := []map[string]interface{}{
		{
			"EventID":       "CE123456789",
			"WorkerID":      "TS87652",
			"EventType":     "Update",
			"EffectiveDate": "2025-04-01",
			"ChangeDetails": map[string]interface{}{
				"Field":    "JobTitle",
				"OldValue": "Software Engineer",
				"NewValue": "Senior Software Engineer",
			},
			"Metadata": map[string]interface{}{
				"InitiatedBy": "admin",
				"Timestamp":   "2025-03-12T15:30:00Z",
			},
		},
		{
			"EventID":       "CE987654321",
			"WorkerID":      "TS87652",
			"EventType":     "Update",
			"EffectiveDate": "2025-05-15",
			"ChangeDetails": map[string]interface{}{
				"Field":    "Department",
				"OldValue": "Development",
				"NewValue": "Research & Development",
			},
			"Metadata": map[string]interface{}{
				"InitiatedBy": "hr_manager",
				"Timestamp":   "2025-03-15T09:45:00Z",
			},
		},
		{
			"EventID":       "CE192837465",
			"WorkerID":      "TS87652",
			"EventType":     "Update",
			"EffectiveDate": "2025-06-01",
			"ChangeDetails": map[string]interface{}{
				"Field":    "WorkLocation",
				"OldValue": "Remote",
				"NewValue": "Onsite",
			},
			"Metadata": map[string]interface{}{
				"InitiatedBy": "system",
				"Timestamp":   "2025-03-20T11:20:00Z",
			},
		},
	}

	// Generate additional worker IDs for more variety
	workerIDs := []string{"TS87652", "TS12345", "TS54321", "TS98765", "TS24680", "TS13579"}

	// Fields that can be updated
	fields := []string{"JobTitle", "Department", "WorkLocation", "Salary", "Manager", "EmploymentStatus", "WorkSchedule", "Benefits", "PerformanceRating"}

	// Operations to simulate
	operations := []string{"insert", "update", "delete"}

	// Periodically add events
	for {
		// Random operation
		opIndex := time.Now().UnixNano() % int64(len(operations))
		operation := operations[opIndex]

		// Either use a predefined event or generate a new one
		var eventData map[string]interface{}

		if rand.Intn(2) == 0 && len(workerEvents) > 0 {
			// Use a predefined event
			eventIndex := rand.Intn(len(workerEvents))
			eventData = workerEvents[eventIndex]
		} else {
			// Generate a new random event
			workerID := workerIDs[rand.Intn(len(workerIDs))]
			field := fields[rand.Intn(len(fields))]

			// Generate random values based on field type
			oldValue, newValue := generateRandomValues(field)

			eventData = map[string]interface{}{
				"EventID":       fmt.Sprintf("CE%d", rand.Intn(1000000)),
				"WorkerID":      workerID,
				"EventType":     "Update",
				"EffectiveDate": time.Now().AddDate(0, rand.Intn(6), rand.Intn(30)).Format("2006-01-02"),
				"ChangeDetails": map[string]interface{}{
					"Field":    field,
					"OldValue": oldValue,
					"NewValue": newValue,
				},
				"Metadata": map[string]interface{}{
					"InitiatedBy": []string{"admin", "hr_manager", "system", "self_service"}[rand.Intn(4)],
					"Timestamp":   time.Now().Format(time.RFC3339),
				},
			}
		}

		// Create the event
		event := changestream.ChangeEvent{
			OperationType: operation,
			FullDocument: map[string]interface{}{
				"WorkerChangeEvent": eventData,
			},
			Timestamp: time.Now(),
		}

		// Add the event to the change stream
		cs.AddEvent(event)
		log.Printf("Added simulated worker event: %s for Worker %s", operation, eventData["WorkerID"])

		// Wait before adding the next event (random between 1-5 seconds for more frequent updates)
		waitTime := 1 + (rand.Intn(4))
		time.Sleep(time.Duration(waitTime) * time.Second)
	}
}

// generateRandomValues returns appropriate random old and new values based on the field type
func generateRandomValues(field string) (string, string) {
	switch field {
	case "JobTitle":
		titles := []string{"Software Engineer", "Senior Software Engineer", "Tech Lead", "Engineering Manager", "Product Manager", "QA Engineer", "DevOps Engineer"}
		return titles[rand.Intn(len(titles))], titles[rand.Intn(len(titles))]

	case "Department":
		departments := []string{"Engineering", "Product", "Marketing", "Sales", "HR", "Finance", "Research & Development", "Customer Support"}
		return departments[rand.Intn(len(departments))], departments[rand.Intn(len(departments))]

	case "WorkLocation":
		locations := []string{"Remote", "Onsite", "Hybrid", "New York", "San Francisco", "London", "Tokyo", "Berlin"}
		return locations[rand.Intn(len(locations))], locations[rand.Intn(len(locations))]

	case "Salary":
		oldSalary := 50000 + rand.Intn(100000)
		newSalary := oldSalary + rand.Intn(20000)
		return fmt.Sprintf("$%d", oldSalary), fmt.Sprintf("$%d", newSalary)

	case "Manager":
		managers := []string{"Alice Smith", "Bob Johnson", "Carol Williams", "David Brown", "Emma Davis", "Frank Miller"}
		return managers[rand.Intn(len(managers))], managers[rand.Intn(len(managers))]

	case "EmploymentStatus":
		statuses := []string{"Full-time", "Part-time", "Contract", "Temporary", "Probation", "Permanent"}
		return statuses[rand.Intn(len(statuses))], statuses[rand.Intn(len(statuses))]

	case "WorkSchedule":
		schedules := []string{"9-5", "Flexible", "4-day week", "Night shift", "Weekend", "Rotating"}
		return schedules[rand.Intn(len(schedules))], schedules[rand.Intn(len(schedules))]

	case "Benefits":
		benefits := []string{"Standard", "Premium", "Basic", "Executive", "Custom", "International"}
		return benefits[rand.Intn(len(benefits))], benefits[rand.Intn(len(benefits))]

	case "PerformanceRating":
		ratings := []string{"Exceeds Expectations", "Meets Expectations", "Needs Improvement", "Outstanding", "Satisfactory"}
		return ratings[rand.Intn(len(ratings))], ratings[rand.Intn(len(ratings))]

	default:
		return "Previous Value", "New Value"
	}
}
