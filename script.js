'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

class Workout {
    date = new Date();
    id = (Date.now() + '');
    constructor(coords, distance, duration) {
        this.coords = coords; // [lat, lng]
        this.distance = distance; // in km
        this.duration = duration; // in min
    }
}

class Running extends Workout {
    type = 'running';
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.pace;
    }
    calcPace() {
        // Returns pace in min/km 
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends Workout {
    type = 'cycling';
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
    }

    calcSpeed() {
        // Speed in km / h
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}

//////////////////////////////////////////////
// Class APP to store App logic 
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {

    #map;
    #mapEvent;
    #workouts = [];

    constructor() {
        this._getPosition();
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevation.bind(this));
    }

    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition( // Takes two arguments
                this._loadMap.bind(this),
                function () {
                    alert('Unable to get the current position');
                }
            )
        }
    }

    _loadMap(position) {
        const { latitude } = position.coords;
        const { longitude } = position.coords;
        const coords = [latitude, longitude];

        // console.log(`https://www.google.com/maps/@${latitude},${longitude},12z?entry=ttu`);

        this.#map = L.map('map').setView(coords, 13);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        // Trigger map event on clicking the map
        this.#map.on('click', this._showForm.bind(this));

    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        // Show the Form on click on the MAP
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _toggleElevation() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(e) {
        e.preventDefault();

        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
        const isPositive = (...inputs) => inputs.every(inp => inp > 0);
        let workout;

        // Get the data from the Form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;

        // Create running object if the workout is running
        if (type === 'running') {
            const cadence = +inputCadence.value;
            // Validate the incoming data
            if (!validInputs(distance, duration, cadence) || !isPositive(distance, duration, cadence))
                return alert('Input data must be a Positive Number');

            workout = new Running([lat, lng], distance, duration, cadence);
        }

        // Create cycling object if the workout is cycling
        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            // Validate the incoming data
            if (!validInputs(distance, duration, elevation) || !isPositive(distance, duration))
                return alert('Input data must be a Positive Number');

            workout = new Cycling([lat, lng], distance, duration, elevation);
        }
        this.#workouts.push(workout);

        // Render the data in map as marker
        this.renderWorkoutMarker(workout);

        // Render the data in sidebar

        // Clear the form fields 
        inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '';

        console.log(this.#mapEvent);

        // Point the marker on the clicked place

    }

    renderWorkoutMarker(workout) {
        L.marker(workout.coords).addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxwidth: 250,
                    minwidth: 50,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`,
                })
            )
            .setPopupContent('Workout')
            .openPopup();
    }
}

// Create a new app Instance 
const app = new App();