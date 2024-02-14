document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        height: 650,
        initialView: 'dayGridMonth',
        events: [
            ...getCurrentFastingProgress()
        ],
        themeSystem: 'bootstrap',
        datesSet: function() { // Use 'datesRender' if you're using FullCalendar v4
            updateTodaysButton();
        }
    });
    calendar.render();
});

function getCurrentFastingProgress() {
    // Initialize the start date
    let startDate = new Date('2024-03-11');

    // Initialize the events array
    let events = [];

    // Loop 30 times
    for (let i = 0; i < 30; i++) {
        // Create a new date object for the start date plus i days
        let eventDate = new Date(startDate.getTime());
        eventDate.setDate(startDate.getDate() + i);

        // Format the date as a string in the format 'yyyy-mm-dd'
        let eventDateString = eventDate.toISOString().split('T')[0];

        // Create an event object
        let event = {
            "title": 'Day' + (i + 1),
            "start": eventDateString,
            "display": 'background',
            "color": 'red',
            "textColor": 'black',
        };

        // Add the event to the events array
        events.push(event);
    }

    return events;
}

window.addEventListener('resize', function(event) {
    updateTodaysButton();
});

function updateTodaysButton() {
    let todayButton = document.getElementsByClassName("fc-today-button fc-button fc-button-primary")[0];
    todayButton.innerHTML = '';
    todayButton.innerText = '';
    if (todayButton) {
        if (window.innerWidth <= 600) {
            todayButton.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            todayButton.innerHTML = "today";
        }
    }
}