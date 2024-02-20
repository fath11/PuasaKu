import { generateListItems } from '../static/js/ramadanStatus.js';
import { calendar } from "../static/js/calendarManagement.js";


$(function(){
    $("#NavWidget").load("./Navigations/NavWidget.html", function() {
        _init_();
        newUserHandler()
    }); 
});

var db = new Dexie('UsersProgress');
db.version(1).stores({
    users: 'username, progress'
});
db.open().catch(function(error) {
    console.error('Uh oh : ' + error);
});
var Users = db.users
Users.orderBy('username').first().then(function(firstUser) {
    sessionStorage.setItem('currentUser', firstUser.username);
}).catch(function(error) {
    console.error('Error: ' + error);
});

var alphaContext;
var omegaContext;

function _init_() {
    alphaContext = document.getElementById('alphaContext');
    omegaContext = document.getElementById('omegaContext'); 

    // Call generateButtons() after omegaContext is defined
    generateButtons();
}


window.showMenu = function() {
    showAlphaContext()
    showOmegaContext()
}

function showAlphaContext() {
    if (alphaContext.classList.contains('hidden')) {
        alphaContext.classList.remove('hidden');
    } else {
        alphaContext.classList.add('hidden');
    }
}

function showOmegaContext() {
    if (omegaContext.classList.contains('hidden')) {
        omegaContext.classList.remove('hidden');
    } else {
        omegaContext.classList.add('hidden');
    }
}

document.addEventListener('click', function(event) {
    if (!event.target.closest('#NavWidget')) {
        if (!alphaContext.classList.contains('hidden')) {
            alphaContext.classList.add('hidden');
        }
        if (!omegaContext.classList.contains('hidden')) {
            omegaContext.classList.add('hidden');
        }
    }
});

function generateButtons() {
    // Clear the current buttons
    omegaContext.innerHTML = '';
    
    // Loop over each user in the Users table
    Users.each(function(user) {
        // Create a new button element
        var button = document.createElement('button');
        
        // Set the button's type to "button"
        button.type = 'button';
        
        // Add the "btn" and "btn-primary" classes to the button
        button.classList.add('btn', 'btn-primary');
        
        // Create a new i element for the icon
        var icon = document.createElement('i');
        
        // Add the "fa-solid" and "fa-person" classes to the icon
        icon.classList.add('fa-solid', 'fa-person');
        
        // Append the icon to the button
        button.appendChild(icon);
        
        // Add a space after the icon
        button.innerHTML += ' ';
        
        // Add the username to the button
        button.innerHTML += user.username;
        
        // Set the button's ID to the username
        button.id = user.username;
        
        // Add an event listener to the button
        button.addEventListener('click', function() {
            // Set the currentUser in session storage to the ID of the button
            sessionStorage.setItem('currentUser', this.id);
            calendar.destroy()
            calendar.render()
            Users.get(this.id).then(function(user) {
                generateListItems(user.progress)
            })
            document.querySelector('#statusNameDisplay').textContent = sessionStorage.getItem('currentUser') + "'s status";
        });
        
        // Append the button to the omegaContext element
        omegaContext.appendChild(button);
    }).catch(function(error) {
        console.error('Error: ' + error);
    });
}

function newUserHandler() {
    let button = document.querySelector('#newUser');
    let form = document.getElementById('usernameForm');
    let modal = new bootstrap.Modal((document.getElementById('usernameModal')))
    let newUser

    // Add an event listener to the button
    button.addEventListener('click', function() {
        modal.show()
    });

    // Add an event listener to the form
    form.addEventListener('submit', function(event) {
        // Prevent the form from being submitted normally
        event.preventDefault();

        // Get the username from the form
        var username = document.getElementById('username').value;

        // Create a new progress object
        var progress = {};
        var start = new Date();
        progress[start.getFullYear()] = {Finished: [], Pin: []};

        // Create a new user with the username and progress
        newUser = {username: username, progress: progress};

        // Add the new user to the Users table
        Users.put(newUser).then(function() {
            console.log('New user added to the database');
        }).catch(function(error) {
            console.error('Error: ' + error);
        });

        db.users.update(newUser.username, {progress: progress}).then(() => {
            generateButtons();
            sessionStorage.setItem('currentUser', newUser.username);
            calendar.destroy()
            calendar.render()
            generateListItems(progress)//From Pin list
            document.querySelector('#statusNameDisplay').textContent = sessionStorage.getItem('currentUser') + "'s status";
        });
        modal.hide();
    });
}