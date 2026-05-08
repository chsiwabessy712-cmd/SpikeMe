/* ========== DIVISION EXPLORER — LEARN MODE ========== */

function updateDivLearnResult() {
    let dividend = parseInt(document.getElementById('divLearnFirst').value);
    let divisor = parseInt(document.getElementById('divLearnSecond').value);

    // Clamp values
    if (!isNaN(dividend) && dividend > 100) { dividend = 100; document.getElementById('divLearnFirst').value = 100; }
    if (!isNaN(divisor) && divisor > 10) { divisor = 10; document.getElementById('divLearnSecond').value = 10; }
    if (!isNaN(divisor) && divisor < 1) { divisor = 1; document.getElementById('divLearnSecond').value = 1; }

    const visualArea = document.getElementById('divVisualArea');
    const subLine = document.getElementById('divSubtractionLine');
    const remLine = document.getElementById('divRemainderLine');

    if (!isNaN(dividend) && !isNaN(divisor) && dividend >= 0 && divisor >= 1) {
        let quotient = Math.floor(dividend / divisor);
        let remainder = dividend % divisor;

        // Show result
        if (remainder === 0) {
            document.getElementById('divResultDisplay').textContent = quotient;
        } else {
            document.getElementById('divResultDisplay').textContent = quotient + ' R' + remainder;
        }

        // Build repeated subtraction string
        if (dividend === 0) {
            subLine.textContent = '0 ÷ ' + divisor + ' = 0 (nothing to share!)';
            remLine.textContent = '';
        } else if (quotient === 0) {
            subLine.textContent = dividend + ' ÷ ' + divisor + ' = 0 (not enough to make a group)';
            remLine.textContent = remainder > 0 ? '🔸 Remainder: ' + remainder + ' left over' : '';
        } else {
            let parts = [];
            let remaining = dividend;
            for (let i = 0; i < quotient; i++) {
                parts.push(remaining);
                remaining -= divisor;
            }
            let subText = parts.join(' - ' + divisor + ' → ');
            subText += ' - ' + divisor + ' → ' + remaining;
            subLine.textContent = subText + '  (subtracted ' + quotient + ' times)';
            remLine.textContent = remainder > 0 ? '🔸 Remainder: ' + remainder + ' left over' : '✅ Divides evenly!';
            remLine.style.color = remainder > 0 ? '#ff9f43' : '#a8e6cf';
        }

        // Build visual groups
        buildDivVisual(dividend, divisor, quotient, remainder, visualArea);
    } else {
        document.getElementById('divResultDisplay').textContent = '?';
        subLine.textContent = 'Enter both numbers to see the breakdown';
        remLine.textContent = '';
        visualArea.innerHTML = '<div class="div-visual-placeholder">Enter numbers to see the groups</div>';
    }
}

function buildDivVisual(dividend, divisor, quotient, remainder, container, showSummary) {
    if (showSummary === undefined) showSummary = true;
    if (dividend === 0 || divisor === 0) {
        container.innerHTML = '<div class="div-visual-placeholder">Nothing to show</div>';
        return;
    }

    let html = '';
    // Limit visual to reasonable size
    if (dividend > 60) {
        container.innerHTML = '<div class="div-visual-placeholder">Number too large for visual (max 60)</div>';
        return;
    }

    html += '<div class="div-groups-container">';

    // Show each group
    for (let g = 0; g < quotient; g++) {
        html += '<div class="div-group">';
        html += '<div class="div-group-label">Group ' + String.fromCharCode(65 + g) + '</div>';
        html += '<div class="div-group-dots">';
        for (let d = 0; d < divisor; d++) {
            html += '<div class="div-dot div-dot-active"></div>';
        }
        html += '</div>';
        html += '<div class="div-group-count">' + divisor + '</div>';
        html += '</div>';
    }

    // Show remainder if any
    if (remainder > 0) {
        html += '<div class="div-group div-group-remainder">';
        html += '<div class="div-group-label">Left over</div>';
        html += '<div class="div-group-dots">';
        for (let d = 0; d < remainder; d++) {
            html += '<div class="div-dot div-dot-remainder"></div>';
        }
        html += '</div>';
        html += '<div class="div-group-count">' + remainder + '</div>';
        html += '</div>';
    }

    html += '</div>';

    // Summary (only in Learn Mode)
    if (showSummary) {
        html += '<div class="div-visual-summary">';
        html += '<span class="div-summary-total">' + dividend + ' total</span>';
        html += '<span class="div-summary-arrow">→</span>';
        html += '<span class="div-summary-groups">' + quotient + ' group' + (quotient !== 1 ? 's' : '') + ' of ' + divisor + '</span>';
        if (remainder > 0) {
            html += '<span class="div-summary-rem">+ ' + remainder + ' left</span>';
        }
        html += '</div>';
    }

    container.innerHTML = html;
}

/* ========== MODE SWITCHING ========== */
function divSwitchMode(mode) {
    if (mode === 'learn') {
        document.getElementById('divLearnModePanel').style.display = 'block';
        document.getElementById('divGameModePanel').style.display = 'none';
        document.getElementById('divLearnModeBtn').classList.add('div-mode-active');
        document.getElementById('divGameModeBtn').classList.remove('div-mode-active');
    } else {
        document.getElementById('divLearnModePanel').style.display = 'none';
        document.getElementById('divGameModePanel').style.display = 'block';
        document.getElementById('divLearnModeBtn').classList.remove('div-mode-active');
        document.getElementById('divGameModeBtn').classList.add('div-mode-active');
    }
}

/* ========== GAME MODE ========== */
let divGameA = 0, divGameB = 0, divGameCorrect = 0;
let divScoreVal = 0, divRoundVal = 0;
let divGameActive = false;

// Generate clean division pairs (no remainder)
function divGenerateProblem() {
    // Pick divisor 1-9, quotient 1-10, compute dividend
    let divisor = Math.floor(Math.random() * 9) + 1; // 1-9
    let quotient = Math.floor(Math.random() * 10) + 1; // 1-10
    let dividend = divisor * quotient;

    // Keep dividend reasonable (≤ 60 for visual)
    if (dividend > 60) {
        quotient = Math.floor(Math.random() * 5) + 1;
        dividend = divisor * quotient;
    }

    return { dividend: dividend, divisor: divisor, quotient: quotient };
}

function divStartGame() {
    divScoreVal = 0;
    divRoundVal = 0;
    divGameActive = true;
    document.getElementById('divGameStartBtn').style.display = 'none';
    document.getElementById('divGameFeedback').innerHTML = '';
    divNextRound();
}

function divNextRound() {
    divRoundVal++;
    let problem = divGenerateProblem();
    divGameA = problem.dividend;
    divGameB = problem.divisor;
    divGameCorrect = problem.quotient;

    document.getElementById('divGameRound').textContent = 'Round: ' + divRoundVal;
    document.getElementById('divGameScore').textContent = 'Score: ' + divScoreVal;
    document.getElementById('divGameQuestion').innerHTML =
        '1. &nbsp; <span style="color:#ffd700;font-weight:800;">DIVIDE</span> &nbsp; ' +
        '<span style="font-weight:900;">' + divGameA + '</span> ÷ <span style="font-weight:900;">' + divGameB + '</span>';

    document.getElementById('divGameAnswer').value = '';
    document.getElementById('divGameAnswer').focus();
    document.getElementById('divGameFeedback').innerHTML = '';
    document.getElementById('divGameNextBtn').style.display = 'none';

    // Show visual hint
    showDivGameHint();
    divGameActive = true;
}

function showDivGameHint() {
    document.getElementById('divGameHintPlaceholder').style.display = 'none';
    let container = document.getElementById('divGameVisualArea');
    container.style.display = 'block';
    buildDivVisual(divGameA, divGameB, divGameCorrect, 0, container, false);
}

function divCheckGameAnswer() {
    if (!divGameActive) return;

    let userAnswer = parseInt(document.getElementById('divGameAnswer').value);

    if (isNaN(userAnswer)) {
        document.getElementById('divGameFeedback').innerHTML =
            '<div class="div-feedback-wrong">⚠️ Please enter a number!</div>';
        return;
    }

    divGameActive = false;

    if (userAnswer === divGameCorrect) {
        divScoreVal++;
        document.getElementById('divGameScore').textContent = 'Score: ' + divScoreVal;
        document.getElementById('divGameFeedback').innerHTML =
            '<div class="div-feedback-correct">🎉 Correct! ' + divGameA + ' ÷ ' + divGameB + ' = ' + divGameCorrect + '</div>';
    } else {
        document.getElementById('divGameFeedback').innerHTML =
            '<div class="div-feedback-wrong">❌ Oops! The answer is ' + divGameCorrect + ' (' + divGameA + ' ÷ ' + divGameB + ')</div>';
    }

    document.getElementById('divGameNextBtn').style.display = 'inline-block';
}

function divResetGame() {
    divScoreVal = 0;
    divRoundVal = 0;
    divGameActive = false;
    document.getElementById('divGameScore').textContent = 'Score: 0';
    document.getElementById('divGameRound').textContent = 'Round: 1';
    document.getElementById('divGameQuestion').innerHTML = 'Press <b>Start</b> to begin!';
    document.getElementById('divGameAnswer').value = '';
    document.getElementById('divGameFeedback').innerHTML = '';
    document.getElementById('divGameStartBtn').style.display = 'inline-block';
    document.getElementById('divGameNextBtn').style.display = 'none';
    document.getElementById('divGameVisualArea').style.display = 'none';
    document.getElementById('divGameVisualArea').innerHTML = '';
    document.getElementById('divGameHintPlaceholder').style.display = 'block';
}
/* ========== CAR DISTANCE SIMULATOR (DIVISION) ========== */
const DIV_CAR_MAX = 50;
let divCarScoreVal = 0, divCarRoundVal = 0;
let divCarCorrectAnswer = 0;
let divCarActive = false;
let divCarDividend = 0, divCarDivisor = 0;

const divCarStoryTemplates = [
    {
        icon: "🚗",
        title: "Road Trip!",
        text: (a, b) => `A car traveled <b>${a} km</b> total over <b>${b} equal trips</b>. How far did it go each trip?`
    },
    {
        icon: "🤖",
        title: "Robot Battery!",
        text: (a, b) => `A robot has <b>${a} battery units</b> shared equally across <b>${b} motors</b>. How many units per motor?`
    },
    {
        icon: "📦",
        title: "Delivery Truck!",
        text: (a, b) => `A truck delivered <b>${a} boxes</b> equally to <b>${b} stores</b>. How many boxes per store?`
    },
    {
        icon: "🚀",
        title: "Space Mission!",
        text: (a, b) => `A rocket covered <b>${a} meters</b> in <b>${b} equal bursts</b>. How far per burst?`
    },
    {
        icon: "🚲",
        title: "Bicycle Ride!",
        text: (a, b) => `A cyclist rode <b>${a} blocks</b> in <b>${b} equal laps</b>. How many blocks per lap?`
    },
    {
        icon: "🚂",
        title: "Train Journey!",
        text: (a, b) => `A train carried <b>${a} passengers</b> in <b>${b} carriages</b> equally. How many per carriage?`
    },
    {
        icon: "🏎️",
        title: "Race Car!",
        text: (a, b) => `A race car drove <b>${a} km</b> total in <b>${b} equal laps</b>. How long was each lap?`
    },
    {
        icon: "🍕",
        title: "Pizza Party!",
        text: (a, b) => `You have <b>${a} pizza slices</b> shared equally among <b>${b} friends</b>. How many slices each?`
    }
];

function divCarBuildMarkers() {
    const markersEl = document.getElementById('divCarMarkers');
    let html = '';
    for (let i = 0; i <= DIV_CAR_MAX; i += 5) {
        let pct = (i / DIV_CAR_MAX) * 100;
        html += '<div class="car-sim-marker" style="left:' + pct + '%;">';
        html += '<div class="car-sim-marker-line"></div>';
        html += '<span class="car-sim-marker-label">' + i + '</span>';
        html += '</div>';
    }
    for (let i = 0; i <= DIV_CAR_MAX; i++) {
        if (i % 5 !== 0) {
            let pct = (i / DIV_CAR_MAX) * 100;
            html += '<div class="car-sim-marker-small" style="left:' + pct + '%;"></div>';
        }
    }
    markersEl.innerHTML = html;
}
divCarBuildMarkers();

function divCarStartGame() {
    divCarScoreVal = 0;
    divCarRoundVal = 0;
    document.getElementById('divCarStartBtn').style.display = 'none';
    divCarNextRound();
}

function divCarNextRound() {
    divCarRoundVal++;
    divCarActive = true;

    // Generate clean division: pick divisor 2-9, quotient 1-9, dividend = divisor * quotient
    divCarDivisor = Math.floor(Math.random() * 8) + 2; // 2-9
    let maxQ = Math.min(9, Math.floor(DIV_CAR_MAX / divCarDivisor));
    divCarCorrectAnswer = Math.floor(Math.random() * maxQ) + 1;
    divCarDividend = divCarDivisor * divCarCorrectAnswer;

    let story = divCarStoryTemplates[Math.floor(Math.random() * divCarStoryTemplates.length)];

    document.getElementById('divCarStoryIcon').textContent = story.icon;
    document.getElementById('divCarStoryTitle').textContent = story.title;
    document.getElementById('divCarStoryText').innerHTML = story.text(divCarDividend, divCarDivisor);
    document.getElementById('divCarEquation').innerHTML =
        '<span class="car-sim-eq-num">' + divCarDividend + '</span>' +
        '<span class="car-sim-eq-sign">÷</span>' +
        '<span class="car-sim-eq-num">' + divCarDivisor + '</span>' +
        '<span class="car-sim-eq-sign">=</span>' +
        '<span class="car-sim-eq-result">?</span>';

    document.getElementById('divCarRound').textContent = 'Round: ' + divCarRoundVal;
    document.getElementById('divCarScore').textContent = 'Score: ' + divCarScoreVal;

    // Reset car position instantly
    let car = document.getElementById('divCarVehicle');
    car.style.transition = 'none';
    car.style.left = '0%';
    car.offsetHeight;
    car.style.transition = 'left 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

    // Show flag at correct position
    let flag = document.getElementById('divCarFlag');
    flag.style.display = 'block';
    flag.style.left = (divCarCorrectAnswer / DIV_CAR_MAX * 100) + '%';

    // Enable input
    document.getElementById('divCarAnswerInput').disabled = false;
    document.getElementById('divCarAnswerInput').value = '';
    document.getElementById('divCarAnswerInput').focus();
    document.getElementById('divCarGoBtn').disabled = false;

    document.getElementById('divCarNextBtn').style.display = 'none';
    document.getElementById('divCarNotification').style.display = 'none';
}

function divCarCheckAnswer() {
    if (!divCarActive) return;

    let userAnswer = parseInt(document.getElementById('divCarAnswerInput').value);
    if (isNaN(userAnswer) || userAnswer < 0) {
        divCarShowNotification('⚠️ Please enter a valid number!', 'warning');
        return;
    }

    divCarActive = false;
    document.getElementById('divCarAnswerInput').disabled = true;
    document.getElementById('divCarGoBtn').disabled = true;

    let animTarget = Math.min(userAnswer, DIV_CAR_MAX);
    let car = document.getElementById('divCarVehicle');
    car.style.left = (animTarget / DIV_CAR_MAX * 100) + '%';

    let isCorrect = (userAnswer === divCarCorrectAnswer);

    setTimeout(() => {
        if (isCorrect) {
            divCarScoreVal++;
            document.getElementById('divCarScore').textContent = 'Score: ' + divCarScoreVal;
            divCarShowNotification(
                '🎉 Correct! ' + divCarDividend + ' ÷ ' + divCarDivisor + ' = ' + divCarCorrectAnswer,
                'correct'
            );
        } else {
            divCarShowNotification(
                '❌ Wrong! The correct answer is <b>' + divCarCorrectAnswer + '</b> (' + divCarDividend + ' ÷ ' + divCarDivisor + ')',
                'wrong'
            );
        }

        document.getElementById('divCarEquation').innerHTML =
            '<span class="car-sim-eq-num">' + divCarDividend + '</span>' +
            '<span class="car-sim-eq-sign">÷</span>' +
            '<span class="car-sim-eq-num">' + divCarDivisor + '</span>' +
            '<span class="car-sim-eq-sign">=</span>' +
            '<span class="car-sim-eq-result car-sim-eq-revealed">' + divCarCorrectAnswer + '</span>';

        setTimeout(() => {
            car.style.left = '0%';
            document.getElementById('divCarFlag').style.display = 'none';
        }, 2000);

        document.getElementById('divCarNextBtn').style.display = 'inline-block';
    }, 1700);
}

function divCarShowNotification(message, type) {
    let notif = document.getElementById('divCarNotification');
    notif.innerHTML = message;
    notif.className = 'car-sim-notification';
    if (type === 'correct') notif.classList.add('car-sim-notif-correct');
    else if (type === 'wrong') notif.classList.add('car-sim-notif-wrong');
    else notif.classList.add('car-sim-notif-warning');
    notif.style.display = 'block';
}

function divCarResetGame() {
    divCarScoreVal = 0;
    divCarRoundVal = 0;
    divCarActive = false;
    document.getElementById('divCarScore').textContent = 'Score: 0';
    document.getElementById('divCarRound').textContent = 'Round: 1';
    document.getElementById('divCarStoryIcon').textContent = '📖';
    document.getElementById('divCarStoryTitle').textContent = 'Math Story Problem';
    document.getElementById('divCarStoryText').innerHTML = 'Press <b>Start</b> to get your first problem!';
    document.getElementById('divCarEquation').innerHTML = '';
    document.getElementById('divCarAnswerInput').value = '';
    document.getElementById('divCarAnswerInput').disabled = true;
    document.getElementById('divCarGoBtn').disabled = true;
    document.getElementById('divCarStartBtn').style.display = 'inline-block';
    document.getElementById('divCarNextBtn').style.display = 'none';
    document.getElementById('divCarNotification').style.display = 'none';
    document.getElementById('divCarFlag').style.display = 'none';
    let car = document.getElementById('divCarVehicle');
    car.style.transition = 'none';
    car.style.left = '0%';
    car.offsetHeight;
    car.style.transition = 'left 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
}