import { Spinner } from './spinner.js';
import { generateListItems } from './ToDoList.js';

// Initialize Dexie
var db = new Dexie('UsersProgress');
var progress = {};
var calendarInfo

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
    var spinner = new Spinner().spin(calendarEl); // Spin the spinner on the calendarEl
    var calendar = new FullCalendar.Calendar(calendarEl, {
        height: 650,
        initialView: 'dayGridMonth',
        themeSystem: 'bootstrap',
        datesSet: function() {
            let start = calendar.view.currentStart;

            spinner.spin(calendarEl); // Spin the spinner on the calendarEl
            getCurrentFastingProgress(start.getFullYear(), start.getMonth() + 1, start)
                .then(events => {
                    calendar.removeAllEventSources();
                    calendar.addEventSource(events);
                    spinner.stop(); // Stop the spinner
                });

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
            calendarInfo = info;
            var eventModal = new bootstrap.Modal(document.getElementById('eventSpecifier'));
            document.getElementById('eventSpecifierLabel').textContent = info.event.title;
            eventModal.show();
        }
    });
    document.getElementById('finished-btn').addEventListener('click', function() {
        let start = calendar.view.currentStart;
        let title = calendarInfo.event.title;
        checkProgressStored(start, title);
        progress[start.getFullYear()].Finished.push(title);
    
        db.users.update('testGuy', {progress: progress}).then(() => {
            calendar.destroy()
            calendar.render()
            generateListItems(progress)//From ToDo list
        });
    });
    
    document.getElementById('todo-btn').addEventListener('click', function() {
        let start = calendar.view.currentStart;
        let title = calendarInfo.event.title;
        checkProgressStored(start, title);
        progress[start.getFullYear()].ToDo.push(title);
    
        db.users.update('testGuy', {progress: progress}).then(() => {
            calendar.destroy()
            calendar.render()
            generateListItems(progress)//From ToDo list
        });
    });    

    calendar.render();
});

async function getCurrentFastingProgress(year, month, start) {
    let response = await fetch(`https://api.aladhan.com/v1/gToHCalendar/${month}/${year}`);
    let data = await response.json();

    let ramadanDates = data.data.filter(item => item.hijri.month.number == 9);

    let events = [];

    for (let i = 0; i < ramadanDates.length; i++) {
        let ramadanToGregorian = ramadanDates[i].gregorian.date;
        let parts = ramadanToGregorian.split('-');
        let FullCalendarSupportableDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
        FullCalendarSupportableDate = FullCalendarSupportableDate.toISOString().split("T")[0]

        let currentRamadan = 'Ramadan ' + ramadanDates[i].hijri.day

        let event = {
            "title": currentRamadan,
            "start": FullCalendarSupportableDate,
            "display": 'background',
            "color": getDayState(currentRamadan, start),
            "textColor": 'black',
        };

        events.push(event);
    }

    return events;
}

function checkProgressStored(start, currentItem) {
    for (var year in progress) {
        if (progress.hasOwnProperty(year)) {
            // Remove all instances of currentItem from Finished array
            progress[year].Finished = progress[year].Finished.filter(item => item !== currentItem);
            // Remove all instances of currentItem from ToDo array
            progress[year].ToDo = progress[year].ToDo.filter(item => item !== currentItem);

            if (progress[year].Finished.length === 0 && progress[year].ToDo.length === 0) {
                delete progress[year];
            }
        }
    }

    if (!progress[start.getFullYear()]) {
        progress[start.getFullYear()] = {Finished: [], ToDo: []};
    }
}

function getDayState(Day, start) {
    checkProgressStored(start)
    let fullYear = progress[start.getFullYear()];
    if (fullYear.Finished.includes(Day)) {
        return 'green';
    } else if (fullYear.ToDo.includes(Day)) {
        return 'blue';
    }
    return 'red';
}
