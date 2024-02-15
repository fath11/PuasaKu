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
        },
    });
    calendar.render();
});

async function getCurrentFastingProgress(year, month) {
    console.log(`${month} and ${year}`)
    let response = await fetch(`https://api.aladhan.com/v1/gToHCalendar/${month}/${year}`);
    let data = await response.json();

    // Filter the data to get the dates for Ramadan
    let ramadanDates = data.data.filter(item => item.hijri.month.number == 9);
    console.log(ramadanDates)

    // Initialize the events array
    let events = [];

    // Loop through each day of Ramadan
    for (let i = 0; i < ramadanDates.length; i++) {
        // Get the date for the current day of Ramadan
        let ramadanToGregorian = ramadanDates[i].gregorian.date;
        let parts = ramadanToGregorian.split('-');
        let FullCalendarSupportableDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)


        // Create an event object
        let event = {
            "title": 'Day ' + (i + 1),
            "start": FullCalendarSupportableDate.toISOString().split("T")[0],
            "display": 'background',
            "color": 'red',
            "textColor": 'black',
        };

        // Add the event to the events array
        events.push(event);
    }

    return events;
}
