'use strict';



// Workout class representing a generic workout
class Workout {
    date = new Date();
    id = (Date.now() + '');


    constructor(coords, distance, duration) {
        this.coords = coords; // Array of coordinates [lat, lng]
        this.distance = distance; // Distance in km
        this.duration = duration; // Duration in minutes
    }

    _setDescription() {
        // Array of month names
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}

// Running class representing a running workout, inherits from Workout class
class Running extends Workout {
    type = 'running';

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence; // Cadence in steps per minute
        this.pace;
        this.calcPace();
        this._setDescription();
    }

    // Calculates the pace (min/km)
    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

// Cycling class representing a cycling workout, inherits from Workout class
class Cycling extends Workout {
    type = 'cycling';

    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain; // Elevation gain in meters
        this.calcSpeed();
        this._setDescription();
    }

    // Calculates the speed (km/h)
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}

// App class to store the application logic
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

        this._getLocalStorage();

        // Set event listeners
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevation.bind(this));
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    }

    // Get the current position
    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                this._loadMap.bind(this),
                function () {
                    alert('Unable to get the current position');
                }
            );
        }
    }

    // Load the map with given coordinates
    _loadMap(position) {
        const { latitude } = position.coords;
        const { longitude } = position.coords;
        const coords = [latitude, longitude];

        // Create and display the map
        this.#map = L.map('map').setView(coords, 13);

        // Add tile layer to the map
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        // Show form on map click
        this.#map.on('click', this._showForm.bind(this));

        this.#workouts.forEach(work => {
            this._renderWorkoutMarker(work);
        });
    }

    // Show the form on map click
    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _hideForm() {
        inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '';
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => {
            form.style.display = 'grid';
        }, 1000);
    }

    // Toggle the visibility of elevation and cadence input fields based on workout type
    _toggleElevation() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    // Create a new workout based on form input
    _newWorkout(e) {
        e.preventDefault();

        // Helper functions for input validation
        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
        const isPositive = (...inputs) => inputs.every(inp => inp > 0);

        let workout;

        // Get the data from the form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;

        // Create a running object if the workout is running
        if (type === 'running') {
            const cadence = +inputCadence.value;

            // Validate the input data
            if (!validInputs(distance, duration, cadence) || !isPositive(distance, duration, cadence)) {
                return alert('Input data must be a positive number');
            }

            workout = new Running([lat, lng], distance, duration, cadence);
        }

        // Create a cycling object if the workout is cycling
        if (type === 'cycling') {
            const elevation = +inputElevation.value;

            // Validate the input data
            if (!validInputs(distance, duration, elevation) || !isPositive(distance, duration)) {
                return alert('Input data must be a positive number');
            }

            workout = new Cycling([lat, lng], distance, duration, elevation);
        }

        // Add the workout to the list of workouts
        this.#workouts.push(workout);

        // Render the workout as a marker on the map
        this._renderWorkoutMarker(workout);

        // Clear the form fields and render workout
        this._renderWorkout(workout);

        // Hide the Form
        this._hideForm();

        // Set Local Storage
        this._setLocalStorage();
    }

    // Render a workout as a marker on the map
    _renderWorkoutMarker(workout) {
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

    _renderWorkout(workout) {
        let html = `
            <li class="workout workout--${workout.type}" data-id="${workout.id}">
                <h2 class="workout__title">${workout.description}</h2>
                <div class="workout__details">
                    <span class="workout__icon">${workout.type == 'running' ? '🏃‍♂️' : '🚴‍♂️'}</span>
                    <span class="workout__value">${workout.distance}</span>
                    <span class="workout__unit">km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⏱</span>
                    <span class="workout__value">${workout.duration}</span>
                    <span class="workout__unit">min</span>
                </div>
        `;

        if (workout.type === 'running') {
            html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
            `
        }

        if (workout.type === 'cycling') {
            html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
            `
        }

        form.insertAdjacentHTML('afterend', html);
    }

    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');
        if (!workoutEl) return;
        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);
        this.#map.setView(workout.coords, 13, {
            animate: true,
            pan: {
                duration: 1,
            }
        });
    }

    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));
        console.log(data);

        if (!data) return;

        this.#workouts = data;
        this.#workouts.forEach(work => {
            this._renderWorkout(work);
        });
    }

    reset() {
        localStorage.removeItem('workouts');
        location.reload();
    }
}

// Create a new app instance
const app = new App();
