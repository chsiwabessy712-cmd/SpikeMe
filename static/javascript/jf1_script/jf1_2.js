// ===== PUZZLE CONFIGURATION =====
const GRID_SIZE = 3;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;

let nextExpected = 1;
let mistakes = 0;
let completed = 0;

// Get the image URL from the Django static tag
const PUZZLE_IMAGE = document.getElementById('puzzleImageUrl').dataset.url;

// ===== SHUFFLE ARRAY (Fisher-Yates) =====
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ===== INITIALIZE PUZZLE =====
function initPuzzle() {

    nextExpected = 1;
    mistakes = 0;
    completed = 0;

    document.getElementById('nextNumber').innerText = '1';
    document.getElementById('progressText').innerText = '0 / 9';
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('mistakeCount').innerText = '0';
    document.getElementById('celebration').classList.remove('show');

    // Create numbers 1-9 and shuffle
    let numbers = [];
    for (let i = 1; i <= TOTAL_TILES; i++) {
        numbers.push(i);
    }
    numbers = shuffleArray(numbers);

    // Build the grid
    const grid = document.getElementById('puzzleGrid');
    grid.innerHTML = '';

    for (let i = 0; i < TOTAL_TILES; i++) {

        let num = numbers[i];

        // Use the GRID POSITION (i) for the image piece, not the number
        // This ensures when all tiles are revealed, the image assembles correctly
        // Position 0 = top-left piece, 1 = top-center, ... 8 = bottom-right
        let imgRow = Math.floor(i / GRID_SIZE);
        let imgCol = i % GRID_SIZE;

        // Create tile
        let tile = document.createElement('div');
        tile.className = 'puzzle-tile';
        tile.dataset.number = num;

        // Front face (shows the number)
        let front = document.createElement('div');
        front.className = 'tile-front';
        front.innerHTML = '<span class="tile-number">' + num + '</span>';

        // Back face (shows image piece)
        let back = document.createElement('div');
        back.className = 'tile-back';
        back.style.backgroundImage = 'url(' + PUZZLE_IMAGE + ')';
        back.style.backgroundSize = (GRID_SIZE * 100) + '%';
        back.style.backgroundPosition = (imgCol * 50) + '% ' + (imgRow * 50) + '%';

        tile.appendChild(front);
        tile.appendChild(back);

        tile.addEventListener('click', function () {
            handleTileClick(this);
        });

        grid.appendChild(tile);
    }
}

// ===== HANDLE TILE CLICK =====
function handleTileClick(tile) {

    // Ignore if already revealed
    if (tile.classList.contains('revealed')) return;

    let num = parseInt(tile.dataset.number);

    if (num === nextExpected) {
        // CORRECT! Reveal this tile
        tile.classList.add('revealed');
        tile.classList.add('correct-flash');
        completed++;
        nextExpected++;

        // Update UI
        document.getElementById('progressText').innerText = completed + ' / 9';
        document.getElementById('progressFill').style.width = (completed / TOTAL_TILES * 100) + '%';

        if (completed < TOTAL_TILES) {
            document.getElementById('nextNumber').innerText = nextExpected;
        } else {
            document.getElementById('nextNumber').innerText = '✓';
        }

        // Remove flash after animation
        setTimeout(function () {
            tile.classList.remove('correct-flash');
        }, 600);

        // Check if puzzle complete
        if (completed === TOTAL_TILES) {
            setTimeout(showCelebration, 800);
        }

    } else {
        // WRONG! Shake the tile
        tile.classList.add('wrong-shake');
        mistakes++;
        document.getElementById('mistakeCount').innerText = mistakes;

        // Remove shake after animation
        setTimeout(function () {
            tile.classList.remove('wrong-shake');
        }, 500);
    }
}

// ===== SHOW CELEBRATION =====
function showCelebration() {
    document.getElementById('celebration').classList.add('show');

    // Launch confetti particles
    createConfetti();
}

// ===== CONFETTI EFFECT =====
function createConfetti() {
    const colors = ['#6a1b9a', '#4b7bec', '#e67e22', '#2ecc71', '#e74c3c', '#f1c40f', '#ff6680'];
    const card = document.querySelector('.card');

    for (let i = 0; i < 50; i++) {
        let confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = (Math.random() * 2) + 's';
        confetti.style.animationDuration = (2 + Math.random() * 3) + 's';
        card.appendChild(confetti);

        // Remove after animation
        setTimeout(function () {
            confetti.remove();
        }, 5000);
    }
}

// ===== START GAME =====
initPuzzle();

const ticksContainer = document.getElementById("ticks");

for (let i = -5; i <= 5; i++) {
    const tick = document.createElement("div");
    tick.classList.add("tick");

    if (i === 0) {
        tick.classList.add("zero");
    } else if (i < 0) {
        tick.classList.add("negative");
    } else {
        tick.classList.add("positive");
    }

    const line = document.createElement("div");
    line.className = "tick-line";

    const label = document.createElement("div");
    label.className = "tick-label";
    label.textContent = i;

    tick.appendChild(line);
    tick.appendChild(label);
    ticksContainer.appendChild(tick);
}


// ===== MOTOR ROTATION SIMULATOR =====
let motorAngle = 0;
let motorTotalRotations = 0;
let motorDirection = 'forward'; // 'forward' or 'backward'

/* Set direction */
function setDirection(dir) {
    motorDirection = dir;

    const fwdBtn = document.getElementById('btnForward');
    const bwdBtn = document.getElementById('btnBackward');

    if (dir === 'forward') {
        fwdBtn.classList.add('dir-active');
        bwdBtn.classList.remove('dir-active');
        document.getElementById('directionDisplay').innerText = '⬆️ Forward';
    } else {
        bwdBtn.classList.add('dir-active');
        fwdBtn.classList.remove('dir-active');
        document.getElementById('directionDisplay').innerText = '⬇️ Backward';
    }
}

// Set forward as default active
setDirection('forward');

// ===== CAR POSITION =====
let carPosition = 0;
const CAR_MAX_ROTATIONS = 5; // road shows 0–5

/* Update car visual position */
function updateCarPosition() {
    const car = document.getElementById('roadCar');
    const distDisplay = document.getElementById('carDistValue');

    // Convert position to percentage of road (0–5 rotations mapped to 0–100%)
    let percent = (carPosition / CAR_MAX_ROTATIONS) * 100;
    percent = Math.max(0, Math.min(100, percent));

    car.style.left = percent + '%';
    distDisplay.innerText = carPosition % 1 === 0 ? carPosition : carPosition.toFixed(1);
}

/* Show/hide car warning */
function showCarWarning() {
    const warn = document.getElementById('carWarning');
    warn.classList.add('show');
    setTimeout(function () {
        warn.classList.remove('show');
    }, 2000);
}

/* Reset motor */
function resetMotor() {
    motorAngle = 0;
    motorTotalRotations = 0;
    document.getElementById('motorWheel').style.transform = 'rotate(0deg)';
    document.getElementById('totalRotations').innerText = '0';
    document.getElementById('motorInfo').innerText = '🔄 Motor reset to starting position';
    document.getElementById('rotationInput').value = '';
    updateRotationViz(0, motorDirection);

    // Reset car
    carPosition = 0;
    updateCarPosition();
}

/* Rotate from student input */
function rotateFromStudentInput() {
    const input = document.getElementById('rotationInput');
    let value = parseFloat(input.value);

    if (isNaN(value) || value < 0.1 || value > 1) {
        alert('⚠️ Please enter a number between 0.1 and 1 (e.g. 0.5, 0.75, 1)');
        input.value = '';
        return;
    }

    applyMotorRotation(value);
}

/* Apply rotation */
function applyMotorRotation(rotations) {
    // ===== BOUNDARY CHECK: block backward at start =====
    if (motorDirection === 'backward' && carPosition <= 0) {
        showCarWarning();
        return; // Block everything
    }

    // If going backward, clamp so car doesn't go below 0
    let carMove = rotations;
    if (motorDirection === 'backward') {
        carMove = Math.min(rotations, carPosition); // can't go below 0
        rotations = carMove; // use clamped value for motor too
    }

    // Calculate degrees based on direction
    let degrees = rotations * 360;
    if (motorDirection === 'backward') {
        degrees = -degrees;
    }

    motorAngle += degrees;
    motorTotalRotations += rotations;

    // Animate the wheel
    document.getElementById('motorWheel').style.transform = 'rotate(' + motorAngle + 'deg)';

    // Update total rotations display
    document.getElementById('totalRotations').innerText = motorTotalRotations.toFixed(1);

    // Show info
    const dirText = motorDirection === 'forward' ? 'Forward → Clockwise ↻' : 'Backward → Anticlockwise ↺';
    document.getElementById('motorInfo').innerText =
        dirText + '  |  Rotated ' + rotations + ' turn(s)';

    // Update rotation visualizer
    updateRotationViz(rotations, motorDirection);

    // Update car position
    if (motorDirection === 'forward') {
        carPosition += rotations;
    } else {
        carPosition -= rotations;
    }
    carPosition = Math.max(0, carPosition); // safety clamp
    // Round to avoid floating point drift
    carPosition = Math.round(carPosition * 100) / 100;
    updateCarPosition();
}

// Prevent negative input via keyboard
document.getElementById('rotationInput').addEventListener('input', function () {
    if (this.value < 0) {
        this.value = Math.abs(this.value);
    }
});

/* Update rotation progress circle */
function updateRotationViz(rotations, direction) {
    // rotations is 0 to 1 (the last input amount)
    let degrees = rotations * 360;
    // Clamp to 360 max
    if (degrees > 360) degrees = 360;
    let percent = Math.round((degrees / 360) * 100);

    const circle = document.getElementById('rotationCircle');
    const label = document.getElementById('rotationCircleLabel');
    const degreesEl = document.getElementById('rotationDegrees');
    const completedDot = document.querySelector('.legend-completed');

    // Blue for forward (clockwise), Red for backward (anticlockwise)
    const isForward = direction === 'forward';
    const color = isForward ? '#4b7bec' : '#e74c3c';

    circle.style.background = `conic-gradient(${color} ${degrees}deg, #e8e8f0 ${degrees}deg)`;
    // Flip circle for backward (anticlockwise visual)
    circle.style.transform = isForward ? 'scaleX(1)' : 'scaleX(-1)';

    label.innerText = percent + '%';
    label.style.color = color;
    // Counter-flip label so text stays readable
    label.style.transform = isForward ? 'scaleX(1)' : 'scaleX(-1)';
    degreesEl.innerText = Math.round(degrees) + '°';

    // Update legend color to match
    if (completedDot) {
        completedDot.style.background = color;
    }
}

// Initialize viz
updateRotationViz(0, 'forward');

// Initialize car position
updateCarPosition();