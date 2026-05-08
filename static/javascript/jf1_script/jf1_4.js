// ===== ANGLE PUZZLE GAME =====

// Shape definitions with SVG, name, and whether they have 90° angles
const ALL_SHAPES = [
    {
        name: 'Square',
        hasRightAngle: true,
        svg: '<svg viewBox="0 0 100 100"><rect x="15" y="15" width="70" height="70" fill="#4b7bec" stroke="#3867d6" stroke-width="3" rx="2"/><rect x="15" y="57" width="12" height="12" fill="none" stroke="#fff" stroke-width="2"/></svg>',
        hint: '4 right angles'
    },
    {
        name: 'Rectangle',
        hasRightAngle: true,
        svg: '<svg viewBox="0 0 100 100"><rect x="10" y="25" width="80" height="50" fill="#2ecc71" stroke="#27ae60" stroke-width="3" rx="2"/><rect x="10" y="47" width="12" height="12" fill="none" stroke="#fff" stroke-width="2"/></svg>',
        hint: '4 right angles'
    },
    {
        name: 'Right Triangle',
        hasRightAngle: true,
        svg: '<svg viewBox="0 0 100 100"><polygon points="20,80 80,80 20,20" fill="#e74c3c" stroke="#c0392b" stroke-width="3"/><rect x="20" y="68" width="12" height="12" fill="none" stroke="#fff" stroke-width="2"/></svg>',
        hint: '1 right angle'
    },
    {
        name: 'Plus Sign',
        hasRightAngle: true,
        svg: '<svg viewBox="0 0 100 100"><polygon points="35,10 65,10 65,35 90,35 90,65 65,65 65,90 35,90 35,65 10,65 10,35 35,35" fill="#9b59b6" stroke="#8e44ad" stroke-width="3"/><rect x="35" y="35" width="10" height="10" fill="none" stroke="#fff" stroke-width="2"/></svg>',
        hint: 'Multiple right angles'
    },
    {
        name: 'L-Shape',
        hasRightAngle: true,
        svg: '<svg viewBox="0 0 100 100"><polygon points="20,15 50,15 50,55 80,55 80,85 20,85" fill="#1abc9c" stroke="#16a085" stroke-width="3"/><rect x="20" y="73" width="12" height="12" fill="none" stroke="#fff" stroke-width="2"/></svg>',
        hint: 'Multiple right angles'
    },
    {
        name: 'Circle',
        hasRightAngle: false,
        svg: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="#e67e22" stroke="#d35400" stroke-width="3"/><text x="50" y="55" text-anchor="middle" fill="#fff" font-size="14" font-weight="bold">∞</text></svg>',
        hint: 'No angles at all'
    },
    {
        name: 'Equilateral Triangle',
        hasRightAngle: false,
        svg: '<svg viewBox="0 0 100 100"><polygon points="50,12 88,82 12,82" fill="#f39c12" stroke="#e67e22" stroke-width="3"/><text x="50" y="70" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">60°</text></svg>',
        hint: 'All angles are 60°'
    },
    {
        name: 'Diamond',
        hasRightAngle: false,
        svg: '<svg viewBox="0 0 100 100"><polygon points="50,10 90,50 50,90 10,50" fill="#e91e63" stroke="#c2185b" stroke-width="3"/><text x="50" y="55" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold">≠90°</text></svg>',
        hint: 'Acute & obtuse angles'
    },
    {
        name: 'Pentagon',
        hasRightAngle: false,
        svg: '<svg viewBox="0 0 100 100"><polygon points="50,10 93,38 76,85 24,85 7,38" fill="#3498db" stroke="#2980b9" stroke-width="3"/><text x="50" y="58" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold">108°</text></svg>',
        hint: 'All angles are 108°'
    },
    {
        name: 'Hexagon',
        hasRightAngle: false,
        svg: '<svg viewBox="0 0 100 100"><polygon points="50,8 90,28 90,72 50,92 10,72 10,28" fill="#8e44ad" stroke="#7d3c98" stroke-width="3"/><text x="50" y="55" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold">120°</text></svg>',
        hint: 'All angles are 120°'
    },
    {
        name: 'Star',
        hasRightAngle: false,
        svg: '<svg viewBox="0 0 100 100"><polygon points="50,5 61,38 97,38 68,59 79,93 50,72 21,93 32,59 3,38 39,38" fill="#f1c40f" stroke="#f39c12" stroke-width="2"/></svg>',
        hint: 'Acute angles only'
    },
    {
        name: 'Parallelogram',
        hasRightAngle: false,
        svg: '<svg viewBox="0 0 100 100"><polygon points="30,25 90,25 70,75 10,75" fill="#00bcd4" stroke="#0097a7" stroke-width="3"/><text x="50" y="55" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold">≠90°</text></svg>',
        hint: 'No right angles'
    }
];

let angleFound = 0;
let angleTotalCorrect = 0;
let angleAttempts = 1;
let angleGameActive = true;

// Fisher-Yates shuffle
function shuffleAngleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function initAngleGame() {
    angleFound = 0;
    angleAttempts = parseInt(document.getElementById('angleAttempts').innerText) || 1;
    angleGameActive = true;

    document.getElementById('angleCelebration').classList.remove('show');

    // Pick 9 shapes: mix of right-angle and non-right-angle
    const rightAngleShapes = ALL_SHAPES.filter(s => s.hasRightAngle);
    const noRightAngleShapes = ALL_SHAPES.filter(s => !s.hasRightAngle);

    // Shuffle both pools
    shuffleAngleArray(rightAngleShapes);
    shuffleAngleArray(noRightAngleShapes);

    // Pick 3 right-angle shapes and 6 non-right-angle shapes
    const correctCount = 3;
    const wrongCount = 6;
    const picked = [
        ...rightAngleShapes.slice(0, correctCount),
        ...noRightAngleShapes.slice(0, wrongCount)
    ];

    // Shuffle the 9 cards
    shuffleAngleArray(picked);

    angleTotalCorrect = correctCount;

    // Update status
    document.getElementById('angleFound').innerText = '0';
    document.getElementById('angleRemaining').innerText = angleTotalCorrect;

    // Build the grid
    const grid = document.getElementById('angleGrid');
    grid.innerHTML = '';

    picked.forEach(function (shape, index) {
        // Card wrapper (for 3D flip)
        const card = document.createElement('div');
        card.className = 'angle-card';
        card.dataset.hasRight = shape.hasRightAngle ? 'true' : 'false';
        card.dataset.index = index;

        // Inner container for flip
        const inner = document.createElement('div');
        inner.className = 'angle-card-inner';

        // Front face — shows shape
        const front = document.createElement('div');
        front.className = 'angle-card-front';
        front.innerHTML = `
                <div class="angle-shape-svg">${shape.svg}</div>
                <div class="angle-shape-name">${shape.name}</div>
            `;

        // Back face — smile or sad
        const back = document.createElement('div');
        back.className = 'angle-card-back';
        if (shape.hasRightAngle) {
            back.innerHTML = `
                    <div class="angle-face angle-smile">😊</div>
                    <div class="angle-face-text correct-text">Right Angle! ✅</div>
                    <div class="angle-face-hint">${shape.hint}</div>
                `;
            back.classList.add('angle-back-correct');
        } else {
            back.innerHTML = `
                    <div class="angle-face angle-sad">😢</div>
                    <div class="angle-face-text wrong-text">Not 90°!</div>
                    <div class="angle-face-hint">${shape.hint}</div>
                `;
            back.classList.add('angle-back-wrong');
        }

        inner.appendChild(front);
        inner.appendChild(back);
        card.appendChild(inner);

        card.addEventListener('click', function () {
            handleAngleCardClick(this);
        });

        grid.appendChild(card);
    });
}

function handleAngleCardClick(card) {
    if (!angleGameActive) return;
    if (card.classList.contains('angle-flipped')) return;

    const hasRight = card.dataset.hasRight === 'true';

    // Flip the card
    card.classList.add('angle-flipped');

    if (hasRight) {
        // CORRECT!
        card.classList.add('angle-correct');
        angleFound++;

        document.getElementById('angleFound').innerText = angleFound;
        document.getElementById('angleRemaining').innerText = (angleTotalCorrect - angleFound);

        // Check win
        if (angleFound === angleTotalCorrect) {
            angleGameActive = false;
            setTimeout(function () {
                document.getElementById('angleCelebration').classList.add('show');
                createAngleConfetti();
            }, 800);
        }
    } else {
        // WRONG — sad face, then restart
        card.classList.add('angle-wrong');
        angleGameActive = false;

        // Shake the card
        card.classList.add('angle-shake');

        setTimeout(function () {
            angleAttempts++;
            document.getElementById('angleAttempts').innerText = angleAttempts;

            // Brief pause, then restart
            setTimeout(function () {
                initAngleGame();
            }, 1200);
        }, 1000);
    }
}

// Confetti effect
function createAngleConfetti() {
    const colors = ['#6a1b9a', '#4b7bec', '#e67e22', '#2ecc71', '#e74c3c', '#f1c40f', '#ff6680', '#9b59b6'];
    const container = document.querySelector('.card1');

    for (let i = 0; i < 60; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'angle-confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = (Math.random() * 2) + 's';
        confetti.style.animationDuration = (2 + Math.random() * 3) + 's';
        confetti.style.width = (6 + Math.random() * 8) + 'px';
        confetti.style.height = (6 + Math.random() * 8) + 'px';
        container.appendChild(confetti);

        setTimeout(function () {
            confetti.remove();
        }, 5500);
    }
}

// Start the game
initAngleGame();

// ===== MOTOR DEGREE SIMULATOR =====
let degMotorAngle = 0;      // cumulative angle for CSS transform
let degTotalDegrees = 0;    // total degrees rotated (absolute sum)

/* Rotate by degree value from buttons */
function rotateDeg(degrees) {
    applyDegRotation(degrees);
}

/* Rotate from custom input */
function rotateFromDegInput() {
    const input = document.getElementById('degInput');
    const value = parseFloat(input.value);

    if (isNaN(value) || value === 0) {
        alert('⚠️ Please enter a valid non-zero number (e.g. 90, -45, 180)');
        input.value = '';
        return;
    }

    applyDegRotation(value);
    input.value = '';
}

/* Core rotation function */
function applyDegRotation(degrees) {
    degMotorAngle += degrees;
    degTotalDegrees += Math.abs(degrees);

    // Animate the motor wheel
    document.getElementById('degMotorWheel').style.transform = 'rotate(' + degMotorAngle + 'deg)';

    // Update direction display
    const dirDisplay = document.getElementById('degDirectionDisplay');
    if (degrees > 0) {
        dirDisplay.innerText = '↻ Clockwise (Right)';
        dirDisplay.style.color = '#4b7bec';
    } else {
        dirDisplay.innerText = '↺ Anticlockwise (Left)';
        dirDisplay.style.color = '#e74c3c';
    }

    // Update last rotation
    const sign = degrees > 0 ? '+' : '';
    document.getElementById('degLastRotation').innerText = sign + degrees + '°';

    // Update total rotation
    document.getElementById('degTotalRotation').innerText = degTotalDegrees + '°';

    // Show info text
    const infoEl = document.getElementById('degInfo');
    if (degrees > 0) {
        infoEl.innerText = '➡️ Rotated ' + degrees + '° clockwise (positive = right)';
        infoEl.style.color = '#4b7bec';
    } else {
        infoEl.innerText = '⬅️ Rotated ' + Math.abs(degrees) + '° anticlockwise (negative = left)';
        infoEl.style.color = '#e74c3c';
    }

    // Update progress circle
    updateDegProgressViz(degrees);
}

/* Update the rotation progress circle */
function updateDegProgressViz(degrees) {
    const absDeg = Math.abs(degrees);
    // Show progress within a single 360° circle
    const vizDeg = absDeg % 360 === 0 && absDeg > 0 ? 360 : absDeg % 360;
    const percent = Math.round((vizDeg / 360) * 100);

    const circle = document.getElementById('degProgressCircle');
    const label = document.getElementById('degProgressLabel');
    const percentEl = document.getElementById('degProgressPercent');
    const rotatedDot = document.querySelector('.deg-legend-rotated');

    // Blue for clockwise (positive), Red for anticlockwise (negative)
    const isClockwise = degrees > 0;
    const color = isClockwise ? '#4b7bec' : '#e74c3c';

    circle.style.background = 'conic-gradient(' + color + ' ' + vizDeg + 'deg, #e8e8f0 ' + vizDeg + 'deg)';
    // Flip circle for anticlockwise visual
    circle.style.transform = isClockwise ? 'scaleX(1)' : 'scaleX(-1)';

    label.innerText = absDeg + '°';
    label.style.color = color;
    // Counter-flip label so text stays readable
    label.style.transform = isClockwise ? 'scaleX(1)' : 'scaleX(-1)';

    percentEl.innerText = percent + '%';

    // Update legend dot color
    if (rotatedDot) {
        rotatedDot.style.background = color;
    }
}

/* Reset motor */
function resetDegMotor() {
    degMotorAngle = 0;
    degTotalDegrees = 0;

    document.getElementById('degMotorWheel').style.transform = 'rotate(0deg)';
    document.getElementById('degDirectionDisplay').innerText = '—';
    document.getElementById('degDirectionDisplay').style.color = '#333';
    document.getElementById('degLastRotation').innerText = '0°';
    document.getElementById('degTotalRotation').innerText = '0°';
    document.getElementById('degInfo').innerText = '🔄 Motor reset to starting position';
    document.getElementById('degInfo').style.color = '#888';
    document.getElementById('degInput').value = '';

    // Reset progress circle
    const circle = document.getElementById('degProgressCircle');
    circle.style.background = 'conic-gradient(#e8e8f0 0deg, #e8e8f0 360deg)';
    circle.style.transform = 'scaleX(1)';
    document.getElementById('degProgressLabel').innerText = '0°';
    document.getElementById('degProgressLabel').style.color = '#999';
    document.getElementById('degProgressLabel').style.transform = 'scaleX(1)';
    document.getElementById('degProgressPercent').innerText = '0%';

    const rotatedDot = document.querySelector('.deg-legend-rotated');
    if (rotatedDot) rotatedDot.style.background = '#4b7bec';
}