var db = new Dexie('UsersProgress');
var Progress = {}
var Pending = ''; // Define Pending at the same level as Progress
var selectedDay = ''; // Add a variable to store the selected day

db.version(1).stores({
    users: 'username, progress, pending' // Add 'pending' to the database schema
});

db.open().catch(function(error) {
    console.error('Uh oh : ' + error);
});

db.users.get('testGuy').then(function(user) {
    if (user) {
        Progress = user.progress;
        Pending = user.pending; // Retrieve 'pending' from the database
    }
    generateListItems(Progress);
});

function generateListItems(UserProgress) {
    Progress = UserProgress;
    var list = document.querySelector('.list-group');
    list.innerHTML = '';

    for (var year in Progress) {

        var toDoItems = Progress[year].ToDo;

        if (toDoItems.length === 0) { break }  

        for (var i = 0; i < toDoItems.length; i++) {
            var listItem = document.createElement('button');
            listItem.type = 'button';
            listItem.className = 'list-group-item list-group-item-' + (Pending === toDoItems[i] ? 'primary' : '');
            listItem.id = toDoItems[i];
            
            var strongElement = document.createElement('strong');
            strongElement.textContent = toDoItems[i];
            listItem.appendChild(strongElement);
            listItem.appendChild(document.createTextNode(' ' + year + ' '));
        
            if (Pending === toDoItems[i]) {
                let badge = document.createElement('span');
                badge.className = 'badge bg-info rounded-pill';
                badge.textContent = 'Pending';
                listItem.appendChild(badge);
            }
            
            list.appendChild(listItem);
        
            // Use a closure to capture the current value of 'i'
            (function(i) {
                document.getElementById(listItem.id).addEventListener('click', function() {
                    var eventModal = new bootstrap.Modal(document.getElementById('todoSpecifier'));
                    document.getElementById('todoSpecifierLabel').textContent = toDoItems[i];
                    selectedDay = toDoItems[i]; // Store the selected day
                    eventModal.show();
                });
            })(i);
        }                
    }
}

document.getElementById('set-pending-btn').addEventListener('click', function(event) {
    if (selectedDay) { // Check if selectedDay has been set
        console.log(selectedDay);
        Pending = selectedDay; // Set Pending to the selected day

        db.users.update('testGuy', {progress: Progress, pending: Pending}) // Update 'pending' in the database
            .then(() => {
                generateListItems(Progress);
        });
    } else {
        console.log('No day has been selected.');
    }
});

document.getElementById('remove-pending-btn').addEventListener('click', function(event) {
    console.log(selectedDay);

    // Remove the day from Pending
    if (Pending === selectedDay) {
        Pending = '';
    }

    // Remove the day from Progress
    for (let year in Progress) {
        let indexInFinished = Progress[year].Finished.indexOf(selectedDay);
        let indexInToDo = Progress[year].ToDo.indexOf(selectedDay);
        if (indexInFinished !== -1) {
            Progress[year].Finished.splice(indexInFinished, 1);
        }
        if (indexInToDo !== -1) {
            Progress[year].ToDo.splice(indexInToDo, 1);
        }
    }

    db.users.update('testGuy', {progress: Progress, pending: Pending}) // Update 'pending' in the database
        .then(() => {
            generateListItems(Progress);
        });
});

export { generateListItems }
