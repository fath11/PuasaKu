import { Spinner } from './spinner.js';
import { generateListItems } from './ramadanStatus.js';

// Initialize Dexie
var db = new Dexie('UsersProgress');
var progress = {};
var calendarInfo
var calendar

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
    calendar = new FullCalendar.Calendar(calendarEl, {
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
                    progress[start.getFullYear()] = {Finished: [], Pin: []};
                    db.users.put({username: 'testGuy', progress: progress});
                }
            });
        },
        eventClick: function(info) {
            calendarInfo = info;
            let Modal = info.event.title.includes("finished") ? 'finishedMarker' : 'eventSpecifier'
            let eventModal = new bootstrap.Modal(document.getElementById(Modal));
            document.getElementById(Modal + 'Label').textContent = info.event.title;
            generateNote(info, eventModal, Modal)
            eventModal.show();
        }
    });
    document.getElementById('finished-btn').addEventListener('click', function() {
        let start = calendar.view.currentStart;
        let title = calendarInfo.event.title;
        checkProgressStored(start, title);
    
        // Get the current date
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();
    
        today = mm + '/' + dd + '/' + yyyy;
    
        // Get the note from the input field
        var note = document.querySelector('.input-group .form-control').value;
    
        progress[start.getFullYear()].Finished.push({Ramadan: title, finishedOn: today, note: note});
        
        db.users.update('testGuy', {progress: progress}).then(() => {
            calendar.destroy()
            calendar.render()
            generateListItems(progress)//From Pin list
        });
    });    
    
    document.getElementById('pin-btn').addEventListener('click', function() {
        let start = calendar.view.currentStart;
        let title = calendarInfo.event.title;
        checkProgressStored(start, title);

        var note = document.querySelector('.input-group .form-control').value;
        progress[start.getFullYear()].Pin.push({Ramadan: title, note: note});
        
        db.users.update('testGuy', {progress: progress}).then(() => {
            calendar.destroy()
            calendar.render()
            generateListItems(progress)//From Pin list
        });
    });

    document.getElementById('goto-ramadan-btn').addEventListener('click', async function() {
        let title = calendarInfo.event.title;
        // Extract the day and year from the title
        let parts = title.split(' ');
        let day = parts[1];
        let gregorianYear = parts[2];
        let hijriYear = Math.floor((gregorianYear - 622) * (33 / 32));
    
        // Construct the Hijri date string
        let hijriDate = `${day}-09-${hijriYear}`;
    
        // Make a request to the API
        let response = await fetch(`https://api.aladhan.com/v1/hToG/${hijriDate}`);
        let data = await response.json();
    
        // Extract the Gregorian date from the API response
        let gregorianDate = data.data.gregorian.date;
    
        // Convert the Gregorian date string to a Date object
        parts = gregorianDate.split('-');
        let date = new Date(parts[2], parts[1] - 1, parts[0]);

        // Navigate to the date
        calendar.gotoDate(date);
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

    events.push(...await getFinishedEvents(start))
    return events;
}

function checkProgressStored(start, currentItem) {
    for (var year in progress) {
        if (progress.hasOwnProperty(year)) {
            // Remove all instances of currentItem from Finished array
            progress[year].Finished = progress[year].Finished.filter(item => item.Ramadan !== currentItem);
            // Remove all instances of currentItem from Pin array
            progress[year].Pin = progress[year].Pin.filter(item => item.Ramadan !== currentItem);

            if (progress[year].Finished.length === 0 && progress[year].Pin.length === 0) {
                delete progress[year];
            }
        }
    }

    if (!progress[start.getFullYear()]) {
        progress[start.getFullYear()] = {Finished: [], Pin: []};
    }
}

function getDayState(Day, start) {
    checkProgressStored(start)
    let fullYear = progress[start.getFullYear()];
    if (fullYear.Finished.some(item => item.Ramadan === Day)) {
        return 'green';
    } else if (fullYear.Pin.some(item => item.Ramadan === Day)) {
        return 'blue';
    }
    return 'red';
}

async function getFinishedEvents(start) {
    let fullYear = progress[start.getFullYear()];
    let finishedEvents = fullYear.Finished;

    let events = [];

    for (let i = 0; i < finishedEvents.length; i++) {
        let finishedOn = finishedEvents[i].finishedOn;
        let parts = finishedOn.split('/');
        let FullCalendarSupportableDate = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`)
        FullCalendarSupportableDate = FullCalendarSupportableDate.toISOString().split("T")[0]

        let currentRamadan = finishedEvents[i].Ramadan

        let event = {
            "title": currentRamadan + ' ' + start.getFullYear() + " finished",
            "start": FullCalendarSupportableDate,
            "display": 'background',
            "color": 'green',
            "textColor": 'black',
        };

        events.push(event);
    }

    return events;
}

function generateNote(info, eventModal, eventKind) {
    var noteInput;

    var title = info.event.title.split(" ", 2)
    title = title[0] + " " + title[1]

    // Loop through progress to find the matching object
    for (let year in progress) {
        ['Finished', 'Pin'].forEach(arrayName => {
            for (let i = 0; i < progress[year][arrayName].length; i++) {
                let item = progress[year][arrayName][i];
                // Ensure all items are objects
                if (typeof item === 'string') {
                    item = { Ramadan: item };
                    progress[year][arrayName][i] = item;
                }
                if (item.Ramadan === title) {
                    document.getElementById(eventKind + 'Label').textContent = title;
                    noteInput = document.querySelector('#' + eventKind + ' .form-control');

                    // Check if the object has a "note" key
                    if (item.note) {
                        // Edit the input to match the "note"
                        noteInput.value = item.note;
                    } else {
                        noteInput.value = ""; // Clear the input field
                    }

                    // Add an input event listener to the noteInput
                    noteInput.addEventListener('input', function() {
                        // Update the object to include "note"
                        item.note = noteInput.value;
                        db.users.update('testGuy', {progress: progress});
                    });

                    eventModal.show();
                    return;
                }
            }
        });
    }
}

export { calendar }