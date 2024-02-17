document.addEventListener('DOMContentLoaded', function() {
    navigator.geolocation.getCurrentPosition(async function(position) {
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;

        // Fetch the location data from BigDataCloud API
        let response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
        let data = await response.json();

        let city = data.city;
        let country = data.countryName;

        // Fetch the prayer times
        response = await fetch(`http://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=2`);
        data = await response.json();

        // Get the prayer times
        let times = data.data.timings;

        // Get the current date
        let now = new Date();
        let date = now.toISOString().split('T')[0];

        // Create Date objects for Fajr and Maghrib
        let fajr = new Date(date + 'T' + times.Fajr + ':00');
        let maghrib = new Date(date + 'T' + times.Maghrib + ':00');

        function updateProgressBar() {
            if (document.visibilityState === 'visible') {
                let progressCard = document.getElementById('PuasaProgressCard');

                // Calculate the progress
                now = new Date();
                let diff = now - fajr;
                let total = maghrib - fajr;
                let percent = (diff / total) * 100;

                progressCard.setAttribute('aria-valuenow', percent.toFixed(2) + "%");
                progressCard.style.width = percent.toFixed(2) + "%";
                console.log(percent.toFixed(2))
            }
        }
        
        updateProgressBar();
        setInterval(updateProgressBar, 60000);
    });
});
