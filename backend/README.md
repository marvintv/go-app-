# MongoDB Change Stream Simulator

This is a Go backend service that simulates MongoDB change streams. It provides an HTTP API and a web interface to view and add events in real-time.

## Features

- Simulates MongoDB change stream events
- Provides Server-Sent Events (SSE) endpoint for real-time updates
- Includes a web interface to view and add events
- Automatically generates random events to simulate a real system
- Exposes REST API endpoints for programmatic access

## Getting Started

### Prerequisites

- Go 1.16 or higher

### Installation

1. Clone the repository
2. Navigate to the project directory
3. Run `go mod tidy` to install dependencies

### Running the Service

```bash
go run main.go
```

The server will start on port 8080. You can access the web interface at http://localhost:8080

## API Endpoints

### GET /events

Server-Sent Events (SSE) endpoint that provides a real-time stream of change events.

Example with curl:
```bash
curl -N http://localhost:8080/events
```

### GET /api/events

Returns all events as JSON.

Example with curl:
```bash
curl http://localhost:8080/api/events
```

### POST /api/events/add

Adds a new event to the change stream.

Example with curl:
```bash
curl -X POST -H "Content-Type: application/json" -d '{"operationType": "insert", "fullDocument": {"name": "John", "value": 42}}' http://localhost:8080/api/events/add
```

## Web Interface

The web interface is available at http://localhost:8080 and provides:

- Real-time view of all change events
- Form to add new events manually
- Automatic updates when new events are added

## How It Works

1. The service creates a mock change stream with some initial events
2. It starts an HTTP server with endpoints for viewing and adding events
3. A background goroutine periodically adds random events to simulate a real system
4. The web interface connects to the SSE endpoint to receive real-time updates

## Use Cases

- Testing applications that consume MongoDB change streams
- Developing UI components that display real-time data
- Simulating WorkdayAPI responses and database changes
- Learning about event-driven architectures 