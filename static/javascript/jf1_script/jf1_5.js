/* ========== LEARN MODE ========== */
// Build default 10x10 grid on page load
function buildDefaultGrid() {
    let grid = document.getElementById('visualGrid');
    let gridHTML = '';
    for (let r = 0; r < 10; r++) {
        gridHTML += '<div class="mul-grid-row">';
        for (let c = 0; c < 10; c++) {
            gridHTML += '<div class="mul-grid-dot" data-row="' + r + '" data-col="' + c + '"></div>';
        }
        gridHTML += '</div>';
    }
    grid.innerHTML = gridHTML;
}
buildDefaultGrid();

function updateLearnResult() {
    let firstNum = parseInt(document.getElementById('learnFirst').value);
    let secondNum = parseInt(document.getElementById('learnSecond').value);

    // Clamp values to 0-10
    if (!isNaN(firstNum) && firstNum > 10) { firstNum = 10; document.getElementById('learnFirst').value = 10; }
    if (!isNaN(secondNum) && secondNum > 10) { secondNum = 10; document.getElementById('learnSecond').value = 10; }

    // Reset all dots to default
    document.querySelectorAll('.mul-grid-dot').forEach(dot => {
        dot.classList.remove('mul-grid-dot-active');
    });

    if (!isNaN(firstNum) && !isNaN(secondNum) && firstNum >= 0 && secondNum >= 0) {
        let result = firstNum * secondNum;
        document.getElementById('resultDisplay').textContent = result;

        // Build repeated addition string
        if (firstNum === 0 || secondNum === 0) {
            document.getElementById('additionLine').textContent = firstNum + ' × ' + secondNum + ' = ' + result;
        } else {
            let parts = [];
            for (let i = 0; i < firstNum; i++) parts.push(secondNum);
            document.getElementById('additionLine').textContent = parts.join(' + ') + ' = ' + result;
        }

        // Highlight dots: firstNum rows × secondNum columns from top-left
        document.querySelectorAll('.mul-grid-dot').forEach(dot => {
            let r = parseInt(dot.dataset.row);
            let c = parseInt(dot.dataset.col);
            if (r < firstNum && c < secondNum) {
                dot.classList.add('mul-grid-dot-active');
            }
        });
    } else {
        document.getElementById('resultDisplay').textContent = '?';
        document.getElementById('additionLine').textContent = 'Enter both numbers to see the breakdown';
    }
}

/* ========== MODE SWITCHING ========== */
function switchMode(mode) {
    if (mode === 'learn') {
        document.getElementById('learnModePanel').style.display = 'block';
        document.getElementById('gameModePanel').style.display = 'none';
        document.getElementById('learnModeBtn').classList.add('mul-mode-active');
        document.getElementById('gameModeBtn').classList.remove('mul-mode-active');
    } else {
        document.getElementById('learnModePanel').style.display = 'none';
        document.getElementById('gameModePanel').style.display = 'block';
        document.getElementById('learnModeBtn').classList.remove('mul-mode-active');
        document.getElementById('gameModeBtn').classList.add('mul-mode-active');
    }
}

/* ========== GAME MODE ========== */
let gameNumA = 0, gameNumB = 0;
let gameScoreVal = 0, gameRoundVal = 0;
let gameActive = false;

function startGame() {
    gameScoreVal = 0;
    gameRoundVal = 0;
    gameActive = true;
    document.getElementById('gameStartBtn').style.display = 'none';
    document.getElementById('gameFeedback').innerHTML = '';
    nextRound();
}

function buildGameGrid() {
    let grid = document.getElementById('gameVisualGrid');
    let gridHTML = '';
    for (let r = 0; r < 10; r++) {
        gridHTML += '<div class="mul-grid-row">';
        for (let c = 0; c < 10; c++) {
            gridHTML += '<div class="mul-grid-dot" data-grow="' + r + '" data-gcol="' + c + '"></div>';
        }
        gridHTML += '</div>';
    }
    grid.innerHTML = gridHTML;
}
buildGameGrid();

function showGameHintGrid() {
    // Hide placeholder, show grid
    document.getElementById('gameHintPlaceholder').style.display = 'none';
    document.getElementById('gameVisualGrid').style.display = 'flex';

    // Reset all dots
    document.querySelectorAll('#gameVisualGrid .mul-grid-dot').forEach(dot => dot.classList.remove('mul-grid-dot-active'));

    // Highlight dots for the current question
    document.querySelectorAll('#gameVisualGrid .mul-grid-dot').forEach(dot => {
        let r = parseInt(dot.dataset.grow);
        let c = parseInt(dot.dataset.gcol);
        if (r < gameNumA && c < gameNumB) {
            dot.classList.add('mul-grid-dot-active');
        }
    });
}

function nextRound() {
    gameRoundVal++;
    gameNumA = Math.floor(Math.random() * 10) + 1;
    gameNumB = Math.floor(Math.random() * 10) + 1;

    document.getElementById('gameRound').textContent = 'Round: ' + gameRoundVal;
    document.getElementById('gameScore').textContent = 'Score: ' + gameScoreVal;
    document.getElementById('gameQuestion').innerHTML =
        '1. &nbsp; <span style="color:#ffd700;font-weight:800;">MULTIPLY</span> &nbsp; ' +
        '<span style="font-weight:900;">' + gameNumA + '</span> × <span style="font-weight:900;">' + gameNumB + '</span>';

    document.getElementById('gameAnswer').value = '';
    document.getElementById('gameAnswer').focus();
    document.getElementById('gameFeedback').innerHTML = '';
    document.getElementById('gameNextBtn').style.display = 'none';

    // Show the hint grid immediately for the new round
    showGameHintGrid();
    gameActive = true;
}

function checkGameAnswer() {
    if (!gameActive) return;

    let userAnswer = parseInt(document.getElementById('gameAnswer').value);
    let correct = gameNumA * gameNumB;

    if (isNaN(userAnswer)) {
        document.getElementById('gameFeedback').innerHTML =
            '<div class="mul-feedback-wrong">⚠️ Please enter a number!</div>';
        return;
    }

    gameActive = false;

    if (userAnswer === correct) {
        gameScoreVal++;
        document.getElementById('gameScore').textContent = 'Score: ' + gameScoreVal;
        document.getElementById('gameFeedback').innerHTML =
            '<div class="mul-feedback-correct">🎉 Correct! ' + gameNumA + ' × ' + gameNumB + ' = ' + correct + '</div>';
    } else {
        document.getElementById('gameFeedback').innerHTML =
            '<div class="mul-feedback-wrong">❌ Oops! The answer is ' + correct + ' (' + gameNumA + ' × ' + gameNumB + ')</div>';
    }

    document.getElementById('gameNextBtn').style.display = 'inline-block';
}

function resetGame() {
    gameScoreVal = 0;
    gameRoundVal = 0;
    gameActive = false;
    document.getElementById('gameScore').textContent = 'Score: 0';
    document.getElementById('gameRound').textContent = 'Round: 1';
    document.getElementById('gameQuestion').innerHTML = 'Press <b>Start</b> to begin!';
    document.getElementById('gameAnswer').value = '';
    document.getElementById('gameFeedback').innerHTML = '';
    document.getElementById('gameStartBtn').style.display = 'inline-block';
    document.getElementById('gameNextBtn').style.display = 'none';
    // Hide grid and show placeholder
    document.getElementById('gameVisualGrid').style.display = 'none';
    document.getElementById('gameHintPlaceholder').style.display = 'block';
    document.querySelectorAll('#gameVisualGrid .mul-grid-dot').forEach(dot => dot.classList.remove('mul-grid-dot-active'));
}

/* ========== CAR DISTANCE SIMULATOR ========== */
const CAR_MAX_DISTANCE = 50;
let carScoreVal = 0, carRoundVal = 0;
let carCorrectAnswer = 0;
let carGameActive = false;
let carNumA = 0, carNumB = 0;

// Story problem templates
const carStoryTemplates = [
    {
        icon: "🚗",
        title: "Road Trip!",
        text: (a, b) => `A car travels <b>${a} km</b> per trip. It makes <b>${b} trips</b>. How far does it travel in total?`
    },
    {
        icon: "🤖",
        title: "Robot Wheels!",
        text: (a, b) => `Each wheel of a robot spins <b>${a} times</b> per second. After <b>${b} seconds</b>, how many total spins?`
    },
    {
        icon: "📦",
        title: "Delivery Truck!",
        text: (a, b) => `A delivery truck carries <b>${a} boxes</b> per stop. It makes <b>${b} stops</b>. How many boxes in total?`
    },
    {
        icon: "🚀",
        title: "Space Mission!",
        text: (a, b) => `A rocket moves <b>${a} meters</b> every second. After <b>${b} seconds</b>, how far has it gone?`
    },
    {
        icon: "🚲",
        title: "Bicycle Ride!",
        text: (a, b) => `A bicycle covers <b>${a} blocks</b> per minute. After <b>${b} minutes</b>, how many blocks total?`
    },
    {
        icon: "🚂",
        title: "Train Journey!",
        text: (a, b) => `A train has <b>${b} carriages</b>. Each carriage has <b>${a} passengers</b>. How many passengers total?`
    },
    {
        icon: "🏎️",
        title: "Race Car!",
        text: (a, b) => `A race car drives <b>${a} laps</b>. Each lap is <b>${b} km</b> long. What is the total distance?`
    },
    {
        icon: "🚁",
        title: "Helicopter Drop!",
        text: (a, b) => `A helicopter drops <b>${a} supplies</b> at each location. It visits <b>${b} locations</b>. How many supplies total?`
    }
];

// Build distance markers on the road
function carBuildMarkers() {
    const markersEl = document.getElementById('carMarkers');
    let html = '';
    for (let i = 0; i <= CAR_MAX_DISTANCE; i += 5) {
        let pct = (i / CAR_MAX_DISTANCE) * 100;
        html += '<div class="car-sim-marker" style="left:' + pct + '%;">';
        html += '<div class="car-sim-marker-line"></div>';
        html += '<span class="car-sim-marker-label">' + i + '</span>';
        html += '</div>';
    }
    // Add small ticks for every unit
    for (let i = 0; i <= CAR_MAX_DISTANCE; i++) {
        if (i % 5 !== 0) {
            let pct = (i / CAR_MAX_DISTANCE) * 100;
            html += '<div class="car-sim-marker-small" style="left:' + pct + '%;"></div>';
        }
    }
    markersEl.innerHTML = html;
}
carBuildMarkers();

function carStartGame() {
    carScoreVal = 0;
    carRoundVal = 0;
    document.getElementById('carStartBtn').style.display = 'none';
    carNextRound();
}

function carNextRound() {
    carRoundVal++;
    carGameActive = true;

    // Generate random single-digit numbers, product ≤ 50
    carNumA = Math.floor(Math.random() * 9) + 1; // 1-9
    let maxB = Math.min(9, Math.floor(CAR_MAX_DISTANCE / carNumA));
    carNumB = Math.floor(Math.random() * maxB) + 1;
    carCorrectAnswer = carNumA * carNumB;

    // Pick a random story template
    let story = carStoryTemplates[Math.floor(Math.random() * carStoryTemplates.length)];

    document.getElementById('carStoryIcon').textContent = story.icon;
    document.getElementById('carStoryTitle').textContent = story.title;
    document.getElementById('carStoryText').innerHTML = story.text(carNumA, carNumB);
    document.getElementById('carEquation').innerHTML =
        '<span class="car-sim-eq-num">' + carNumA + '</span>' +
        '<span class="car-sim-eq-sign">×</span>' +
        '<span class="car-sim-eq-num">' + carNumB + '</span>' +
        '<span class="car-sim-eq-sign">=</span>' +
        '<span class="car-sim-eq-result">?</span>';

    document.getElementById('carRound').textContent = 'Round: ' + carRoundVal;
    document.getElementById('carScore').textContent = 'Score: ' + carScoreVal;

    // Reset car position instantly
    let car = document.getElementById('carVehicle');
    car.style.transition = 'none';
    car.style.left = '0%';
    // Force reflow
    car.offsetHeight;
    car.style.transition = 'left 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

    // Show flag at correct position
    let flag = document.getElementById('carFlag');
    flag.style.display = 'block';
    flag.style.left = (carCorrectAnswer / CAR_MAX_DISTANCE * 100) + '%';

    // Enable input
    document.getElementById('carAnswerInput').disabled = false;
    document.getElementById('carAnswerInput').value = '';
    document.getElementById('carAnswerInput').focus();
    document.getElementById('carGoBtn').disabled = false;

    // Hide next button and notification
    document.getElementById('carNextBtn').style.display = 'none';
    document.getElementById('carNotification').style.display = 'none';
}

function carCheckAnswer() {
    if (!carGameActive) return;

    let userAnswer = parseInt(document.getElementById('carAnswerInput').value);
    if (isNaN(userAnswer) || userAnswer < 0) {
        carShowNotification('⚠️ Please enter a valid number!', 'warning');
        return;
    }

    carGameActive = false;
    document.getElementById('carAnswerInput').disabled = true;
    document.getElementById('carGoBtn').disabled = true;

    // Clamp user answer to max distance for animation
    let animTarget = Math.min(userAnswer, CAR_MAX_DISTANCE);
    let car = document.getElementById('carVehicle');
    car.style.left = (animTarget / CAR_MAX_DISTANCE * 100) + '%';

    let isCorrect = (userAnswer === carCorrectAnswer);

    // Wait for car animation to finish, then show result
    setTimeout(() => {
        if (isCorrect) {
            carScoreVal++;
            document.getElementById('carScore').textContent = 'Score: ' + carScoreVal;
            carShowNotification(
                '🎉 Correct! ' + carNumA + ' × ' + carNumB + ' = ' + carCorrectAnswer + ' km',
                'correct'
            );
        } else {
            carShowNotification(
                '❌ Wrong! The correct answer is <b>' + carCorrectAnswer + '</b> (' + carNumA + ' × ' + carNumB + ')',
                'wrong'
            );
        }

        // Show equation result
        document.getElementById('carEquation').innerHTML =
            '<span class="car-sim-eq-num">' + carNumA + '</span>' +
            '<span class="car-sim-eq-sign">×</span>' +
            '<span class="car-sim-eq-num">' + carNumB + '</span>' +
            '<span class="car-sim-eq-sign">=</span>' +
            '<span class="car-sim-eq-result car-sim-eq-revealed">' + carCorrectAnswer + '</span>';

        // Reset car after a delay
        setTimeout(() => {
            car.style.left = '0%';
            document.getElementById('carFlag').style.display = 'none';
        }, 2000);

        document.getElementById('carNextBtn').style.display = 'inline-block';
    }, 1700);
}

function carShowNotification(message, type) {
    let notif = document.getElementById('carNotification');
    notif.innerHTML = message;
    notif.className = 'car-sim-notification';
    if (type === 'correct') notif.classList.add('car-sim-notif-correct');
    else if (type === 'wrong') notif.classList.add('car-sim-notif-wrong');
    else notif.classList.add('car-sim-notif-warning');
    notif.style.display = 'block';
}

function carResetGame() {
    carScoreVal = 0;
    carRoundVal = 0;
    carGameActive = false;
    document.getElementById('carScore').textContent = 'Score: 0';
    document.getElementById('carRound').textContent = 'Round: 1';
    document.getElementById('carStoryIcon').textContent = '📖';
    document.getElementById('carStoryTitle').textContent = 'Math Story Problem';
    document.getElementById('carStoryText').innerHTML = 'Press <b>Start</b> to get your first problem!';
    document.getElementById('carEquation').innerHTML = '';
    document.getElementById('carAnswerInput').value = '';
    document.getElementById('carAnswerInput').disabled = true;
    document.getElementById('carGoBtn').disabled = true;
    document.getElementById('carStartBtn').style.display = 'inline-block';
    document.getElementById('carNextBtn').style.display = 'none';
    document.getElementById('carNotification').style.display = 'none';
    document.getElementById('carFlag').style.display = 'none';
    let car = document.getElementById('carVehicle');
    car.style.transition = 'none';
    car.style.left = '0%';
    car.offsetHeight;
    car.style.transition = 'left 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
}