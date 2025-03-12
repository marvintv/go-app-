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
    
    // Chart data
    const timeLabels = [];
    const insertData = [];
    const updateData = [];
    const deleteData = [];
    
    /* Commented out Field Types Distribution chart data
    // Field type data for pie chart
    const fieldTypeCounts = {
        'JobTitle': 0,
        'Department': 0,
        'WorkLocation': 0,
        'Salary': 0,
        'Manager': 0,
        'EmploymentStatus': 0
    };
    */
    
    // Initialize charts
    const operationsChartCtx = document.getElementById('operationsChart').getContext('2d');
    const operationsChart = new Chart(operationsChartCtx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [
                {
                    label: 'Inserts',
                    data: insertData,
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.2)',
                    tension: 0.4
                },
                {
                    label: 'Updates',
                    data: updateData,
                    borderColor: '#f39c12',
                    backgroundColor: 'rgba(243, 156, 18, 0.2)',
                    tension: 0.4
                },
                {
                    label: 'Deletes',
                    data: deleteData,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.2)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Operations Over Time',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Count'
                    }
                }
            }
        }
    });
    
    /* Commented out Field Types Distribution chart initialization
    const fieldTypesChartCtx = document.getElementById('fieldTypesChart').getContext('2d');
    const fieldTypesChart = new Chart(fieldTypesChartCtx, {
        type: 'pie',
        data: {
            labels: Object.keys(fieldTypeCounts),
            datasets: [{
                data: Object.values(fieldTypeCounts),
                backgroundColor: [
                    '#3498db',
                    '#2ecc71',
                    '#f39c12',
                    '#e74c3c',
                    '#9b59b6',
                    '#1abc9c'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Field Types Distribution',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    position: 'right'
                }
            }
        }
    });
    */
    
    // Connect to SSE endpoint
    const eventSource = new EventSource('/events');
    
    eventSource.addEventListener('message', function(e) {
        const event = JSON.parse(e.data);
        addEventToUI(event, true);
        updateStats(event.operationType);
        updateCharts(event);
        
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
    
    // Function to update charts with new event data
    function updateCharts(event) {
        // Update time-series data
        const now = new Date();
        const timeLabel = now.getHours() + ':' + 
                         (now.getMinutes() < 10 ? '0' : '') + now.getMinutes() + ':' + 
                         (now.getSeconds() < 10 ? '0' : '') + now.getSeconds();
        
        // Keep only the last 20 time points
        if (timeLabels.length >= 20) {
            timeLabels.shift();
            insertData.shift();
            updateData.shift();
            deleteData.shift();
        }
        
        timeLabels.push(timeLabel);
        
        // Update operation counts
        insertData.push(insertCount);
        updateData.push(updateCount);
        deleteData.push(deleteCount);
        
        // Update operations chart
        operationsChart.update();
        
        /* Commented out Field Types Distribution chart update
        // Update field type data for pie chart
        if (event.operationType === 'update' && 
            event.fullDocument && 
            event.fullDocument.WorkerChangeEvent) {
            
            const changeDetails = event.fullDocument.WorkerChangeEvent.ChangeDetails;
            if (changeDetails && changeDetails.Field) {
                const fieldType = changeDetails.Field;
                if (fieldTypeCounts.hasOwnProperty(fieldType)) {
                    fieldTypeCounts[fieldType]++;
                    fieldTypesChart.data.datasets[0].data = Object.values(fieldTypeCounts);
                    fieldTypesChart.update();
                }
            }
        }
        */
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
            
            // Process events in chronological order for charts
            events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            events.forEach(event => {
                addEventToUI(event);
                updateStats(event.operationType);
                updateCharts(event);
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