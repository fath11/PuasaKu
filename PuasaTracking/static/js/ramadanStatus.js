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
        console.log(selectedDay);

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

document.getElementById('remove-pinned-btn').addEventListener('click', function(event) {
    console.log(selectedDay);

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
    console.log(selectedDay)

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
                });

                eventModal.show();
                return;
            }
        }
    }
}

export { generateListItems }
