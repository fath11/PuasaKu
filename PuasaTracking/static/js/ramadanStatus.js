import { calendar } from "./calendarManagement.js";

var db = new Dexie('UsersProgress');
var Progress = {}
var selectedDay = ''; // Add a variable to store the selected day

db.version(1).stores({
    users: 'username, progress'
});

db.open().catch(function(error) {
    console.error('Uh oh : ' + error);
});

db.users.get('testGuy').then(function(user) {
    if (user) {
        Progress = user.progress;
    }
    generateListItems(Progress);
});

function generateListItems(UserProgress) {
    Progress = UserProgress;
    var list = document.querySelector('.list-group');
    list.innerHTML = '';

    for (var year in Progress) {

        var pinItems = Progress[year].Pin;

        if (pinItems.length === 0) { break }  

        for (var i = 0; i < pinItems.length; i++) {
            var listItem = document.createElement('button');
            listItem.type = 'button';
            listItem.className = 'list-group-item'
            listItem.id = pinItems[i].Ramadan;
            
            var strongElement = document.createElement('strong');
            strongElement.textContent = pinItems[i].Ramadan;
            listItem.appendChild(strongElement);
            listItem.appendChild(document.createTextNode(' ' + year + ' '));
        
            let badge = document.createElement('span');
            badge.className = 'badge bg-info rounded-pill';
            badge.innerHTML = '<i class="fa-solid fa-pen"></i>'
            listItem.appendChild(badge);
            
            list.appendChild(listItem);
        
            // Use a closure to capture the current value of 'i'
            (function(i) {
                document.getElementById(listItem.id).addEventListener('click', function() {
                    var eventModal = new bootstrap.Modal(document.getElementById('pinSpecifier'));
                    document.getElementById('pinSpecifierLabel').textContent = pinItems[i].Ramadan;
                    selectedDay = pinItems[i].Ramadan; // Store the selected day
                    generateNote(eventModal)
                    eventModal.show();
                });
            })(i);
        }                
    }
}

document.getElementById('set-finished-btn').addEventListener('click', function(event) {
    if (selectedDay) { // Check if selectedDay has been set
        // Get the current date
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();

        today = mm + '/' + dd + '/' + yyyy;

        // Add the object to the year's array
        for (let year in Progress) {
            if (Progress[year].Pin.some(item => item.Ramadan === selectedDay)) {
                if (!Progress[year].Finished) {
                    Progress[year].Finished = [];
                }
                let note = document.querySelector('#pinSpecifier .form-control').value;
                Progress[year].Finished.push({Ramadan: selectedDay, finishedOn: today, note: note});
                let indexInPin = Progress[year].Pin.findIndex(item => item.Ramadan === selectedDay);
                if (indexInPin !== -1) {
                    Progress[year].Pin.splice(indexInPin, 1);
                }
            }
        }

        db.users.update('testGuy', {progress: Progress}) // Update 'pending' in the database
            .then(() => {
                calendar.destroy()
                calendar.render()
                generateListItems(Progress);
        });
    } else {
        console.log('No day has been selected.');
    }
});

document.getElementById('goto-pinned-ramadan-btn').addEventListener('click', async function() {
    let title = selectedDay
    console.log(title)

    // Extract the day from the title
    let parts = title.split(' ');
    let day = parts[1];

    let gregorianYear;

    // Loop through Progress to find the matching year
    for (let year in Progress) {
        let pinItems = Progress[year].Pin;
        for (let i = 0; i < pinItems.length; i++) {
            let item = pinItems[i];
            if (typeof item === 'string') {
                item = { Ramadan: item };
                pinItems[i] = item;
            }
            if (item.Ramadan === title) {
                gregorianYear = year; // Set the gregorianYear
                break;
            }
        }
        if (gregorianYear) {
            break;
        }
    }

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

document.getElementById('remove-pinned-btn').addEventListener('click', function(event) {
    // Remove the day from Progress
    for (let year in Progress) {
        let indexInFinished = Progress[year].Finished.findIndex(item => item.Ramadan === selectedDay);
        let indexInPin = Progress[year].Pin.findIndex(item => item.Ramadan === selectedDay);
        if (indexInFinished !== -1) {
            Progress[year].Finished.splice(indexInFinished, 1);
        }
        if (indexInPin !== -1) {
            Progress[year].Pin.splice(indexInPin, 1);
        }
    }

    db.users.update('testGuy', {progress: Progress}) // Update 'pending' in the database
        .then(() => {
            calendar.destroy()
            calendar.render()
            generateListItems(Progress);
        });
});

function generateNote(eventModal) {
    var noteInput;

    // Loop through progress to find the matching object
    for (let year in Progress) {
        let pinItems = Progress[year].Pin;
        for (let i = 0; i < pinItems.length; i++) {
            let item = pinItems[i];
            // Ensure all items are objects
            if (typeof item === 'string') {
                item = { Ramadan: item };
                pinItems[i] = item;
            }
            if (item.Ramadan === selectedDay) {
                document.getElementById('pinSpecifierLabel').textContent = selectedDay;
                noteInput = document.querySelector('#pinSpecifier .form-control');

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
                    db.users.update('testGuy', {progress: Progress});

                    calendar.destroy();
                    calendar.render();
                });

                eventModal.show();
                return;
            }
        }
    }
}

export { generateListItems }
