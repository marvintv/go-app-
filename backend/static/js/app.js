document.addEventListener('DOMContentLoaded', function() {
    const eventsContainer = document.getElementById('events');
    const operationTypeSelect = document.getElementById('operation-type');
    const workerIdInput = document.getElementById('worker-id');
    const fieldTypeSelect = document.getElementById('field-type');
    const oldValueInput = document.getElementById('old-value');
    const newValueInput = document.getElementById('new-value');
    const addEventButton = document.getElementById('add-event');
    
    // Search elements
    const employeeSearchInput = document.getElementById('employee-search');
    const searchButton = document.getElementById('search-button');
    const resetSearchButton = document.getElementById('reset-search');
    
    // Stats counters
    let totalEvents = 0;
    let insertCount = 0;
    let updateCount = 0;
    let deleteCount = 0;
    
    // Store all events for filtering
    let allEvents = [];
    
    // Connect to SSE endpoint
    const eventSource = new EventSource('/events');
    
    eventSource.addEventListener('message', function(e) {
        const event = JSON.parse(e.data);
        addEventToUI(event, true);
        updateStats(event.operationType);
        
        // Add to allEvents array for filtering
        allEvents.unshift(event);
        
        // Limit the size of allEvents to prevent memory issues
        if (allEvents.length > 500) {
            allEvents = allEvents.slice(0, 500);
        }
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
            
            // Note: We don't need to manually add the event to allEvents here
            // because it will come back through the SSE connection
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
        
        // Update coconut counter with every event
        const coconutElement = document.getElementById('coconut-count');
        coconutElement.textContent = totalEvents + ' 🥥';
        
        // Add animation class
        coconutElement.classList.add('coconut-animation');
        
        // Remove animation class after animation completes
        setTimeout(() => {
            coconutElement.classList.remove('coconut-animation');
        }, 500);
    }
    
    // Load initial events
    fetch('/api/events')
        .then(response => response.json())
        .then(events => {
            eventsContainer.innerHTML = '';
            allEvents = events; // Store all events for filtering
            events.forEach(event => {
                addEventToUI(event);
                updateStats(event.operationType);
            });
        })
        .catch(error => {
            console.error('Error loading events:', error);
        });
        
    // Search functionality
    searchButton.addEventListener('click', function() {
        filterEvents();
    });
    
    // Also trigger search on Enter key
    employeeSearchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            filterEvents();
        }
    });
    
    resetSearchButton.addEventListener('click', function() {
        // Clear search input
        employeeSearchInput.value = '';
        
        // Reset display to show all events
        displayFilteredEvents(allEvents);
    });
    
    // Function to filter events based on search criteria
    function filterEvents() {
        const searchTerm = employeeSearchInput.value.trim();
        
        // If no search term is provided, show all events
        if (!searchTerm) {
            displayFilteredEvents(allEvents);
            return;
        }
        
        // Build query URL - we'll just use workerId parameter for simplicity
        let queryUrl = `/api/events/query?workerId=${encodeURIComponent(searchTerm)}`;
        
        // Show loading state
        eventsContainer.innerHTML = '<div class="event"><div class="event-time">Loading results...</div></div>';
        
        // Fetch filtered events from server
        fetch(queryUrl)
            .then(response => response.json())
            .then(events => {
                displayFilteredEvents(events);
            })
            .catch(error => {
                console.error('Error querying events:', error);
                eventsContainer.innerHTML = '<div class="event"><div class="event-time">Error loading results. Please try again.</div></div>';
            });
    }
    
    // Function to display filtered events
    function displayFilteredEvents(events) {
        eventsContainer.innerHTML = '';
        
        if (events.length === 0) {
            const noResultsElement = document.createElement('div');
            noResultsElement.className = 'event';
            noResultsElement.innerHTML = '<div class="event-time">No matching events found</div>';
            eventsContainer.appendChild(noResultsElement);
            return;
        }
        
        // Sort events by timestamp (newest first)
        events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Display filtered events
        events.forEach(event => {
            addEventToUI(event, false);
        });
    }
    
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