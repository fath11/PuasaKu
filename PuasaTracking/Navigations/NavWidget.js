$(function(){
    $("#NavWidget").load("./Navigations/NavWidget.html"); 
});

function showMenu() {
    let extraButtons = document.getElementById('extraButtons');
    if (extraButtons.classList.contains('hidden')) {
        extraButtons.classList.remove('hidden');
    } else {
        extraButtons.classList.add('hidden');
    }
}