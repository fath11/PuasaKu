document.addEventListener('DOMContentLoaded', function() {
    function addProgressBar() {
        let progressCard = document.getElementsByClassName('PuasaProgressCard');
    
        for (let i = 0; i < progressCard.length; i++) {
            let progressBar = document.createElement('div');
            progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated';
            progressBar.role = 'progressbar';
            progressBar.setAttribute('aria-valuenow', '75');
            progressBar.setAttribute('aria-valuemin', '0');
            progressBar.setAttribute('aria-valuemax', '100');
            progressBar.style.width = (Math.random() * 100) + '%';
    
            let progress = document.createElement('div');
            progress.className = 'progress';
            progress.appendChild(progressBar);
    
            progressCard[i].appendChild(progress);
        }
    }
    
    addProgressBar();
})
