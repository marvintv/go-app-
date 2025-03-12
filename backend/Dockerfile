FROM golang:1.22-alpine AS builder

WORKDIR /build

# Copy go.mod and go.sum files
COPY go.mod ./

# Download dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o backend .

# Create a minimal production image
FROM alpine:latest

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /build/backend /app/
COPY static/ /app/static/

# Expose the port
EXPOSE 8080

# Run the application
CMD ["/app/backend"] 