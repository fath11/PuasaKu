// Initialize Dexie
var db = new Dexie('UsersProgress');
var progress = {};

// Define your database schema
db.version(1).stores({
    users: 'username'
});

// Open the database
db.open().catch(function(error) {
    console.error('Uh oh : ' + error);
});

document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        height: 650,
        initialView: 'dayGridMonth',
        themeSystem: 'bootstrap',
        datesSet: function() {
            // Get the current view's date range
            var start = calendar.view.currentStart;

            // Fetch the events for the current view
            getCurrentFastingProgress(start.getFullYear(), start.getMonth() + 1)
                .then(events => {
                    calendar.removeAllEventSources();
                    calendar.addEventSource(events);
                });

            // Initialize the progress for the current year if not already done
            db.users.get('testGuy').then(function(user) {
                if (user) {
                    progress = user.progress;
                } else {
                    progress = {};
                    progress[start.getFullYear()] = {Finished: [], ToDo: []};
                    db.users.put({username: 'testGuy', progress: progress});
                }
            });
        },
        eventClick: function(info) {
            var eventModal = new bootstrap.Modal(document.getElementById('eventModal'));
            document.getElementById('eventModalLabel').textContent = info.event.title;
            eventModal.show();
        }
    });
    calendar.render();

    document.getElementById('finished-btn').addEventListener('click', function() {
        // Get the current view's date range
        var start = calendar.view.currentStart;

        // Add the current day to the Finished list
        progress[start.getFullYear()].Finished.push(start.getDate());

        // Save the updated progress
        db.users.update('testGuy', {progress: progress});

        alert('Finished button clicked!');
    });

    document.getElementById('todo-btn').addEventListener('click', function() {
        // Get the current view's date range
        var start = calendar.view.currentStart;

        // Add the current day to the ToDo list
        progress[start.getFullYear()].ToDo.push(start.getDate());

        // Save the updated progress
        db.users.update('testGuy', {progress: progress});

        alert('ToDo button clicked!');
    });
});

async function getCurrentFastingProgress(year, month) {
    let response = await fetch(`https://api.aladhan.com/v1/gToHCalendar/${month}/${year}`);
    let data = await response.json();

    // Filter the data to get the dates for Ramadan
    let ramadanDates = data.data.filter(item => item.hijri.month.number == 9);

    // Initialize the events array
    let events = [];

    // Loop through each day of Ramadan
    for (let i = 0; i < ramadanDates.length; i++) {
        // Get the date for the current day of Ramadan
        let ramadanToGregorian = ramadanDates[i].gregorian.date;
        let parts = ramadanToGregorian.split('-');
        let FullCalendarSupportableDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
        FullCalendarSupportableDate = FullCalendarSupportableDate.toISOString().split("T")[0]

        // Create an event object
        let event = {
            "title": 'Day ' + (i + 1),
            "start": FullCalendarSupportableDate,
            "display": 'background',
            "color": 'red',
            "textColor": 'black',
        };

        // Add the event to the events array
        events.push(event);
    }

    return events;
}
