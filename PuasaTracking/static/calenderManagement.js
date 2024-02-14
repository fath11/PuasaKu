document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        height: 650,
        initialView: 'dayGridMonth',
        events: [
            ...getCurrentFastingProgress()
        ],
        themeSystem: 'bootstrap'
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