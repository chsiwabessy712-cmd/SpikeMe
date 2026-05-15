/* ===== THREE CUPS ONE BALL - ESTIMATION SHELL GAME ===== */
/* Cups increase each round: Round 1 = 3 cups, Round 2 = 4 cups, Round 3 = 5 cups */
(function () {
    'use strict';

    /* ===== CONFIGURATION ===== */
    var TOTAL_ROUNDS = 3;
    var BASE_CUPS = 3;                // cups in round 1
    var BASE_SHUFFLES = 5;            // shuffles in round 1
    var SHUFFLES_PER_ROUND = 3;       // extra shuffles per round
    var BASE_SHUFFLE_SPEED = 480;     // ms delay between swaps (round 1)
    var SPEED_DECREASE = 70;          // ms faster each round
    var MIN_SHUFFLE_SPEED = 170;      // fastest possible swap

    /* ===== STATE ===== */
    var cupCount = BASE_CUPS;
    var shells = [];       // shells[cupId] = positionIndex
    var ballCupId = 0;     // which cup hides the ball
    var isShuffling = false;
    var gameActive = false;
    var score = 0;
    var round = 1;
    var streak = 0;
    var cupImgSrc = '';    // loaded from data attribute

    /* ===== DOM HELPERS ===== */
    function $(id) { return document.getElementById(id); }

    /* Calculate evenly spaced positions for N cups (as % of container) */
    function getPositions(n) {
        var positions = [];
        for (var i = 0; i < n; i++) {
            // Spread from ~12% to ~88% of the container
            positions.push(12 + (76 / (n - 1)) * i);
        }
        return positions;
    }

    /* Get half-width of a cup container for centering */
    function getCupOffset() {
        if (window.innerWidth <= 400) return 26;
        if (window.innerWidth <= 600) return 32;
        if (window.innerWidth <= 768) return 40;
        return 50;
    }

    /* ===== GENERATE CUP ELEMENTS ===== */
    function generateCups(count) {
        var area = $('shell-game-area');
        // Remove old cup elements (keep the ball)
        var oldCups = area.querySelectorAll('.shell-container');
        for (var i = 0; i < oldCups.length; i++) {
            area.removeChild(oldCups[i]);
        }

        // Create new cups
        for (var c = 0; c < count; c++) {
            var container = document.createElement('div');
            container.className = 'shell-container';
            container.id = 'shell-' + c;
            container.setAttribute('data-cup-id', c);

            // Click handler via closure
            (function (cupId) {
                container.addEventListener('click', function () {
                    guessShell(cupId);
                });
            })(c);

            var img = document.createElement('img');
            img.className = 'cup-img';
            img.src = cupImgSrc;
            img.alt = 'Cup ' + (c + 1);
            img.draggable = false;

            var shadow = document.createElement('div');
            shadow.className = 'shell-shadow';

            container.appendChild(img);
            container.appendChild(shadow);
            area.appendChild(container);
        }

        // Init shell positions array
        shells = [];
        for (var s = 0; s < count; s++) {
            shells.push(s);
        }
    }

    /* ===== POSITION UPDATE ===== */
    function updatePositions() {
        var positions = getPositions(cupCount);
        var offset = getCupOffset();

        for (var i = 0; i < cupCount; i++) {
            var el = $('shell-' + i);
            if (el) {
                el.style.left = 'calc(' + positions[shells[i]] + '% - ' + offset + 'px)';
            }
        }

        var ball = $('the-ball');
        if (ball) {
            // Ball follows the cup that hides it
            var ballPosIdx = shells[ballCupId];
            ball.style.left = 'calc(' + positions[ballPosIdx] + '% - ' + offset + 'px)';
        }
    }

    /* ===== HUD UPDATE ===== */
    function updateHUD() {
        $('shell-round').textContent = round;
        $('shell-score').textContent = score;
        $('shell-streak').textContent = streak;
        $('shell-cups').textContent = cupCount;
    }

    /* ===== PROGRESS BAR ===== */
    function updateProgress() {
        for (var i = 1; i <= TOTAL_ROUNDS; i++) {
            var step = $('prog-' + i);
            var line = $('prog-line-' + i);
            step.className = 'shell-progress-step';

            if (i < round) {
                step.classList.add('won');
            } else if (i === round) {
                step.classList.add('active');
            }

            if (line && i < round) {
                line.classList.add('filled');
            } else if (line) {
                line.classList.remove('filled');
            }
        }
    }

    /* ===== SET CUP CLICKABILITY ===== */
    function setCupsClickable(clickable) {
        for (var i = 0; i < cupCount; i++) {
            var el = $('shell-' + i);
            if (el) {
                if (clickable) {
                    el.classList.add('clickable');
                } else {
                    el.classList.remove('clickable');
                }
            }
        }
    }

    /* ===== START A ROUND ===== */
    window.startShellGame = function () {
        if (isShuffling) return;
        gameActive = false;
        setCupsClickable(false);

        var startBtn = $('shell-start-btn');
        if (startBtn) startBtn.style.display = 'none';

        // Calculate cup count for this round
        cupCount = BASE_CUPS + (round - 1);  // R1=3, R2=4, R3=5

        // Generate cup elements
        generateCups(cupCount);
        updateHUD();

        var fb = $('shell-feedback');
        if (fb) {
            fb.textContent = 'Watch carefully where the ball goes!';
            fb.style.color = '#7c3aed';
        }

        // Reset cup visual states
        for (var i = 0; i < cupCount; i++) {
            var el = $('shell-' + i);
            if (el) el.classList.remove('lifted', 'correct', 'wrong');
        }

        // Position cups in default order
        updatePositions();

        // Choose a random cup to hide the ball
        ballCupId = Math.floor(Math.random() * cupCount);

        // Hide ball first
        var ball = $('the-ball');
        ball.classList.remove('visible', 'reveal');
        ball.style.width = getCupOffset() * 2 + 'px';
        updatePositions();

        // Short delay, then reveal
        setTimeout(function () {
            // Show ball
            ball.classList.add('visible', 'reveal');

            // Lift the cup to show ball
            var cupEl = $('shell-' + ballCupId);
            if (cupEl) cupEl.classList.add('lifted');

            // After showing, drop cup and shuffle
            setTimeout(function () {
                if (cupEl) cupEl.classList.remove('lifted');
                ball.classList.remove('visible', 'reveal');

                setTimeout(function () {
                    var shuffleCount = BASE_SHUFFLES + (round - 1) * SHUFFLES_PER_ROUND;
                    shuffleShells(shuffleCount);
                }, 600);
            }, 1800);
        }, 400);
    };

    /* ===== SHUFFLE ENGINE ===== */
    function shuffleShells(timesLeft) {
        if (timesLeft <= 0) {
            isShuffling = false;
            gameActive = true;
            setCupsClickable(true);

            var fb = $('shell-feedback');
            if (fb) {
                fb.textContent = 'Where is the ball? Click a cup!';
                fb.style.color = '#d97706';
            }
            return;
        }

        isShuffling = true;

        // Pick two distinct position indices to swap
        var p1 = Math.floor(Math.random() * cupCount);
        var p2 = (p1 + Math.floor(Math.random() * (cupCount - 1)) + 1) % cupCount;

        // Find which cups are at those positions
        var s1 = shells.indexOf(p1);
        var s2 = shells.indexOf(p2);

        // Swap positions
        shells[s1] = p2;
        shells[s2] = p1;

        // Visual pop during shuffle
        var el1 = $('shell-' + s1);
        var el2 = $('shell-' + s2);
        if (el1) el1.classList.add('shuffling');
        if (el2) el2.classList.add('shuffling');

        updatePositions();

        // Speed: gets faster each round
        var delay = Math.max(MIN_SHUFFLE_SPEED, BASE_SHUFFLE_SPEED - (round - 1) * SPEED_DECREASE);

        setTimeout(function () {
            if (el1) el1.classList.remove('shuffling');
            if (el2) el2.classList.remove('shuffling');
            shuffleShells(timesLeft - 1);
        }, delay);
    }

    /* ===== GUESS HANDLER ===== */
    function guessShell(cupId) {
        if (!gameActive || isShuffling) return;
        gameActive = false;
        setCupsClickable(false);

        var isCorrect = (cupId === ballCupId);

        // Lift clicked cup
        var clickedEl = $('shell-' + cupId);
        if (clickedEl) clickedEl.classList.add('lifted');

        if (isCorrect) {
            handleCorrect(cupId);
        } else {
            handleWrong(cupId);
        }
    }

    /* ===== CORRECT ANSWER ===== */
    function handleCorrect(cupId) {
        // Show ball
        var ball = $('the-ball');
        ball.classList.add('visible', 'reveal');

        var clickedEl = $('shell-' + cupId);
        if (clickedEl) clickedEl.classList.add('correct');

        var fb = $('shell-feedback');
        fb.textContent = 'You found it!';
        fb.style.color = '#10b981';

        // Score bonus increases with more cups
        var roundBonus = round * 10 + (cupCount - BASE_CUPS) * 5;
        score += roundBonus;
        streak++;
        updateHUD();

        // Check if all rounds completed
        if (round >= TOTAL_ROUNDS) {
            setTimeout(function () {
                showVictory();
            }, 1200);
        } else {
            var nextCups = BASE_CUPS + round; // next round's cup count
            setTimeout(function () {
                showModal(
                    '\uD83C\uDF89',
                    'Correct!',
                    'Great observation! You earned +' + roundBonus + ' points.\nRound ' + (round + 1) + ' coming up with ' + nextCups + ' cups!',
                    function () {
                        round++;
                        cupCount = BASE_CUPS + (round - 1);
                        updateHUD();
                        updateProgress();
                        resetCups();
                        showStartButton('\u25B6 Round ' + round + ' (' + cupCount + ' cups)');
                    }
                );
            }, 800);
        }
    }

    /* ===== WRONG ANSWER ===== */
    function handleWrong(cupId) {
        var clickedEl = $('shell-' + cupId);
        if (clickedEl) clickedEl.classList.add('wrong');

        var fb = $('shell-feedback');
        fb.textContent = 'Not there!';
        fb.style.color = '#ef4444';

        // Show where ball actually was
        setTimeout(function () {
            var correctEl = $('shell-' + ballCupId);
            if (correctEl) correctEl.classList.add('lifted');
            var ball = $('the-ball');
            ball.classList.add('visible', 'reveal');

            setTimeout(function () {
                showModal(
                    '\uD83D\uDE05',
                    'Oops! Wrong cup!',
                    'The ball was under a different cup.\nDon\'t worry \u2014 practice makes perfect!\nResetting back to Round 1 with 3 cups.',
                    function () {
                        round = 1;
                        streak = 0;
                        cupCount = BASE_CUPS;
                        updateHUD();
                        updateProgress();
                        resetCups();
                        showStartButton('\uD83D\uDD04 Try Again');
                    }
                );
            }, 600);
        }, 700);
    }

    /* ===== RESET CUPS ===== */
    function resetCups() {
        generateCups(cupCount);
        var ball = $('the-ball');
        ball.classList.remove('visible', 'reveal');
        updatePositions();
    }

    /* ===== SHOW START BUTTON ===== */
    function showStartButton(text) {
        var btn = $('shell-start-btn');
        btn.textContent = text;
        btn.style.display = 'flex';
    }

    /* ===== NOTIFICATION MODAL ===== */
    function showModal(icon, title, message, onClose) {
        $('shell-modal-icon').textContent = icon;
        $('shell-modal-title').textContent = title;
        $('shell-modal-message').textContent = message;

        var modal = $('shell-modal');
        modal.style.display = 'flex';
        modal._onClose = onClose;

        requestAnimationFrame(function () {
            modal.classList.add('show');
        });
    }

    window.closeShellModal = function () {
        var modal = $('shell-modal');
        modal.classList.remove('show');

        setTimeout(function () {
            modal.style.display = 'none';
            if (modal._onClose) {
                modal._onClose();
                modal._onClose = null;
            }
        }, 350);
    };

    /* ===== VICTORY MODAL ===== */
    function showVictory() {
        $('shell-victory-score').textContent = score;
        $('shell-victory-msg').textContent =
            'Amazing estimation skills! You completed all ' + TOTAL_ROUNDS + ' rounds with a streak of ' + streak + '!';

        var modal = $('shell-victory');
        modal.style.display = 'flex';

        requestAnimationFrame(function () {
            modal.classList.add('show');
        });
    }

    window.resetShellGame = function () {
        var modal = $('shell-victory');
        modal.classList.remove('show');

        setTimeout(function () {
            modal.style.display = 'none';
            score = 0;
            round = 1;
            streak = 0;
            cupCount = BASE_CUPS;
            updateHUD();
            updateProgress();
            resetCups();
            showStartButton('\u25B6 Start Game');

            var fb = $('shell-feedback');
            fb.textContent = 'Press Start to play!';
            fb.style.color = '#555';
        }, 350);
    };

    /* ===== INITIALIZATION ===== */
    document.addEventListener('DOMContentLoaded', function () {
        // Read cup image URL from data attribute
        var area = $('shell-game-area');
        cupImgSrc = area.getAttribute('data-cup-img') || '';

        // Generate initial cups
        cupCount = BASE_CUPS;
        generateCups(cupCount);
        updatePositions();
        updateHUD();
        updateProgress();

        window.addEventListener('resize', function () {
            updatePositions();
        });
    });

})();

/* ===== TRAFFIC LIGHT CAR SIMULATOR — GAME MODE ===== */
(function () {
    'use strict';

    var TOTAL_ROUNDS = 3;
    var BASE_STEPS = 3;
    var STEP_TIME = 5;          // seconds per step

    var round = 1;
    var score = 0;
    var stepIndex = 0;
    var sequence = [];
    var isRunning = false;
    var hasEntered = false;
    var currentSpeed = 0;
    var lastColor = 'none';     // tracks previous sensed color for transitions
    var redTimer = null;
    var countdownInterval = null;
    var yellowSlowInterval = null;
    var stepTimerInterval = null;
    var stepTimeLeft = STEP_TIME;

    function $(id) { return document.getElementById(id); }

    /* ===== SEQUENCE GENERATION (no same-color neighbors) ===== */
    function generateSequence(length) {
        var colors = ['red', 'yellow', 'green'];
        var seq = [];
        for (var i = 0; i < length; i++) {
            var available = colors.slice();
            // Remove the last color to prevent neighbors
            if (seq.length > 0) {
                var lastColor = seq[seq.length - 1];
                available = available.filter(function (c) { return c !== lastColor; });
            }
            seq.push(available[Math.floor(Math.random() * available.length)]);
        }
        return seq;
    }

    function renderSequence() {
        var list = $('tl-sequence-list');
        if (!list) return;
        list.innerHTML = '';
        for (var i = 0; i < sequence.length; i++) {
            var dot = document.createElement('div');
            dot.className = 'tl-seq-dot seq-' + sequence[i];
            dot.id = 'tl-seq-' + i;
            if (i === 0) dot.classList.add('seq-active');
            list.appendChild(dot);
        }
        var hint = $('tl-sequence-hint');
        if (hint) hint.textContent = 'Click the colors in order!';
    }

    function highlightStep(idx) {
        for (var i = 0; i < sequence.length; i++) {
            var dot = $('tl-seq-' + i);
            if (!dot) continue;
            dot.classList.remove('seq-active', 'seq-wrong');
            if (i < idx) dot.classList.add('seq-done');
            if (i === idx) dot.classList.add('seq-active');
        }
    }

    /* ===== HUD ===== */
    function updateHUD() {
        var r = $('tl-round');       if (r) r.textContent = round;
        var s = $('tl-score');       if (s) s.textContent = score;
        var st = $('tl-step');       if (st) st.textContent = stepIndex;
        var ts = $('tl-total-steps'); if (ts) ts.textContent = sequence.length;
    }

    /* ===== STEP TIMER (5 seconds per step) ===== */
    function startStepTimer() {
        stopStepTimer();
        stepTimeLeft = STEP_TIME;
        var timerEl = $('tl-step-timer');
        var barFill = $('tl-timer-bar-fill');
        var timerText = $('tl-timer-text');
        if (timerEl) timerEl.style.display = 'flex';
        if (barFill) { barFill.style.width = '100%'; barFill.className = 'tl-timer-bar-fill'; }
        if (timerText) timerText.textContent = '⏱ ' + STEP_TIME + 's';

        stepTimerInterval = setInterval(function () {
            stepTimeLeft -= 0.25;
            var pct = Math.max(0, (stepTimeLeft / STEP_TIME) * 100);
            if (barFill) barFill.style.width = pct + '%';
            if (timerText) timerText.textContent = '⏱ ' + Math.ceil(stepTimeLeft) + 's';

            // Color transitions
            if (barFill) {
                barFill.classList.remove('warning', 'danger');
                if (stepTimeLeft <= 1) barFill.classList.add('danger');
                else if (stepTimeLeft <= 3) barFill.classList.add('warning');
            }

            if (stepTimeLeft <= 0) {
                stopStepTimer();
                // Time's up — treat as wrong
                setFeedback('⏱ Time\'s up! Expected ' + sequence[stepIndex].toUpperCase() + '.', '#ef4444');
                var dot = $('tl-seq-' + stepIndex);
                if (dot) {
                    dot.classList.add('seq-wrong');
                    setTimeout(function () { if (dot) dot.classList.remove('seq-wrong'); }, 600);
                }
                // Restart the timer for another chance
                setTimeout(function () {
                    if (isRunning && stepIndex < sequence.length) {
                        setFeedback('Try again! Click ' + sequence[stepIndex].toUpperCase(), '#d97706');
                        startStepTimer();
                    }
                }, 800);
            }
        }, 250);
    }

    function stopStepTimer() {
        if (stepTimerInterval) { clearInterval(stepTimerInterval); stepTimerInterval = null; }
        var timerEl = $('tl-step-timer');
        if (timerEl) timerEl.style.display = 'none';
    }

    /* ===== BUTTON / BULB HELPERS ===== */
    function setBulbsEnabled(on) {
        var bulbs = document.querySelectorAll('.tl-bulb');
        for (var i = 0; i < bulbs.length; i++) {
            bulbs[i].style.pointerEvents = on ? 'auto' : 'none';
            bulbs[i].style.opacity = on ? '1' : '0.4';
        }
    }

    function updateButtons() {
        var p = $('tl-btn-play'); if (p) p.disabled = isRunning;
        var s = $('tl-btn-stop'); if (s) s.disabled = !isRunning;
    }

    function setFeedback(text, color) {
        var fb = $('tl-feedback');
        if (fb) { fb.textContent = text; fb.style.color = color || '#555'; }
    }

    /* ===== START GAME ===== */
    window.startSimulator = function () {
        if (isRunning) return;
        isRunning = true;
        round = 1; score = 0; stepIndex = 0;
        hasEntered = false;
        var playBtn = $('tl-btn-play');
        if (playBtn) playBtn.textContent = '▶ Start Game';
        updateButtons();
        var hud = $('tl-hud'); if (hud) hud.style.display = 'flex';
        startRound();
    };

    function startRound() {
        stepIndex = 0;
        clearTimers();
        sequence = generateSequence(BASE_STEPS + (round - 1));
        renderSequence();
        updateHUD();
        setBulbsEnabled(true);
        setFeedback('Round ' + round + ' — Follow the sequence!', '#7c3aed');
        var hint = $('tl-light-hint'); if (hint) hint.textContent = '👆 Click!';
        setActiveBulb('none');
        resetCar();
        lastColor = 'none';
        updateStatus('none', 'Waiting...', '0 km/h');
        startStepTimer();
    }

    /* ===== STOP GAME ===== */
    window.stopSimulator = function () {
        if (!isRunning) return;
        isRunning = false;
        updateButtons();
        clearTimers();
        stopStepTimer();
        setBulbsEnabled(false);
        setActiveBulb('none');
        resetCar();
        setFeedback('');
        var hud = $('tl-hud'); if (hud) hud.style.display = 'none';
        var hint = $('tl-light-hint'); if (hint) hint.textContent = 'Press Start!';
        var seqHint = $('tl-sequence-hint');
        if (seqHint) seqHint.textContent = 'Start the game to see the sequence!';
        var list = $('tl-sequence-list'); if (list) list.innerHTML = '';
        updateStatus('none', 'Waiting...', '0 km/h');
    };

    /* ===== BULB CONTROL ===== */
    function setActiveBulb(color) {
        var ids = ['tl-bulb-red', 'tl-bulb-yellow', 'tl-bulb-green'];
        for (var i = 0; i < ids.length; i++) {
            var el = $(ids[i]); if (el) el.classList.remove('active');
        }
        if (color === 'red')    $('tl-bulb-red').classList.add('active');
        if (color === 'yellow') $('tl-bulb-yellow').classList.add('active');
        if (color === 'green')  $('tl-bulb-green').classList.add('active');
    }

    /* ===== SMOOTH SPEED TRANSITIONS ===== */
    function clearSpeedTransition() {
        if (yellowSlowInterval) { clearInterval(yellowSlowInterval); yellowSlowInterval = null; }
    }

    /* Smoothly change speed from current to target over duration ms */
    function smoothSpeedTransition(targetSpeed, duration, onComplete) {
        clearSpeedTransition();
        var startSpeed = currentSpeed;
        var steps = 12;
        var stepTime = duration / steps;
        var speedChange = (targetSpeed - startSpeed) / steps;
        var car = $('tl-car');
        var road = $('tl-road');
        var step = 0;

        yellowSlowInterval = setInterval(function () {
            step++;
            currentSpeed += speedChange;

            // Switch road animation speed at midpoint
            if (car && road && step === Math.floor(steps / 2)) {
                if (targetSpeed <= 0) {
                    car.classList.remove('driving', 'slowing');
                    road.classList.remove('road-moving');
                    car.classList.add('slowing');
                    road.classList.add('road-slow');
                } else if (targetSpeed <= 30) {
                    car.classList.remove('driving');
                    road.classList.remove('road-moving');
                    car.classList.add('slowing');
                    road.classList.add('road-slow');
                }
            }

            if (step >= steps) {
                currentSpeed = targetSpeed;
                clearSpeedTransition();
                if (targetSpeed <= 0 && car && road) {
                    car.classList.remove('driving', 'slowing');
                    road.classList.remove('road-moving', 'road-slow');
                    car.classList.add('stopped');
                }
                if (onComplete) onComplete();
            }

            var sp = $('tl-car-speed');
            if (sp) sp.textContent = Math.max(0, Math.round(currentSpeed)) + ' km/h';
        }, stepTime);
    }

    /* ===== CAR STATE (context-aware) ===== */
    function setCarState(state) {
        var car = $('tl-car');
        var road = $('tl-road');
        if (!car || !road) return;

        if (!hasEntered) {
            hasEntered = true;
            car.classList.add('entering');
            car.addEventListener('animationend', function h() {
                car.classList.remove('entering');
                car.removeEventListener('animationend', h);
            });
        }

        car.classList.remove('driving', 'slowing', 'stopped');
        road.classList.remove('road-moving', 'road-slow');

        var wasMoving = (lastColor === 'green');
        var wasSlow = (lastColor === 'yellow');

        if (state === 'green') {
            /* Always: car drives fast */
            car.classList.add('driving');
            road.classList.add('road-moving');
            smoothSpeedTransition(60, 800);

        } else if (state === 'yellow') {
            if (wasMoving) {
                /* After green: smooth transition fast → slow */
                car.classList.add('driving');
                road.classList.add('road-moving');
                smoothSpeedTransition(20, 2000);
            } else {
                /* First click or after red: just start slow */
                currentSpeed = 20;
                car.classList.add('slowing');
                road.classList.add('road-slow');
                var sp = $('tl-car-speed');
                if (sp) sp.textContent = '20 km/h';
            }

        } else if (state === 'red') {
            if (wasMoving) {
                /* After green: smooth deceleration to stop */
                car.classList.add('driving');
                road.classList.add('road-moving');
                smoothSpeedTransition(0, 1500);
            } else if (wasSlow) {
                /* After yellow: quick stop from slow */
                car.classList.add('slowing');
                road.classList.add('road-slow');
                smoothSpeedTransition(0, 800);
            } else {
                /* First click or already stopped: just stop */
                currentSpeed = 0;
                car.classList.add('stopped');
                var sp = $('tl-car-speed');
                if (sp) sp.textContent = '0 km/h';
            }
        }
    }

    function resetCar() {
        clearSpeedTransition();
        currentSpeed = 0;
        var car = $('tl-car');
        var road = $('tl-road');
        if (car) car.classList.remove('driving', 'slowing', 'stopped', 'entering');
        if (road) road.classList.remove('road-moving', 'road-slow');
    }

    /* ===== STATUS PANEL ===== */
    function updateStatus(color, action, speed) {
        var se = $('tl-sensed-color');
        var ae = $('tl-car-action');
        var sp = $('tl-car-speed');
        if (se) {
            se.textContent = color.charAt(0).toUpperCase() + color.slice(1);
            se.style.color = color === 'red' ? '#dc2626'
                           : color === 'yellow' ? '#d97706'
                           : color === 'green' ? '#16a34a' : '#1a1a2e';
        }
        if (ae) ae.textContent = action;
        if (sp) sp.textContent = speed;
    }

    /* ===== TIMERS ===== */
    function clearTimers() {
        if (redTimer) { clearTimeout(redTimer); redTimer = null; }
        if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
        clearSpeedTransition();
        var cd = $('tl-countdown'); if (cd) cd.style.display = 'none';
    }

    /* ===== MAIN SENSE FUNCTION (GAME MODE) ===== */
    window.senseColor = function (color) {
        if (!isRunning || stepIndex >= sequence.length) return;
        clearTimers();

        var expected = sequence[stepIndex];

        if (color === expected) {
            score += 10;
            stepIndex++;
            setActiveBulb(color);

            setCarState(color);

            if (color === 'green') {
                updateStatus('green', 'move()', currentSpeed + ' km/h');
            } else if (color === 'yellow') {
                updateStatus('yellow', 'slow()', currentSpeed + ' km/h');
            } else if (color === 'red') {
                updateStatus('red', 'stop()', currentSpeed + ' km/h');
            }

            lastColor = color;

            highlightStep(stepIndex);
            updateHUD();

            if (stepIndex >= sequence.length) {
                stopStepTimer();
                setBulbsEnabled(false);
                if (round >= TOTAL_ROUNDS) {
                    setFeedback('🏆 You Win! Final Score: ' + score, '#10b981');
                    var seqHint = $('tl-sequence-hint');
                    if (seqHint) seqHint.textContent = 'Amazing! All rounds complete!';
                    var playBtn = $('tl-btn-play');
                    if (playBtn) { playBtn.disabled = false; playBtn.textContent = '🔄 Play Again'; }
                    isRunning = false;
                    updateButtons();
                } else {
                    setFeedback('✅ Round ' + round + ' Complete! +' + (sequence.length * 10) + ' pts', '#10b981');
                    setTimeout(function () {
                        round++;
                        startRound();
                    }, 1800);
                }
            } else {
                setFeedback('✅ Correct! Next: step ' + (stepIndex + 1) + ' of ' + sequence.length, '#10b981');
                startStepTimer();
            }
        } else {
            var dot = $('tl-seq-' + stepIndex);
            if (dot) dot.classList.add('seq-wrong');
            setFeedback('❌ Wrong! Expected ' + expected.toUpperCase() + '. Try again!', '#ef4444');
            setTimeout(function () {
                if (dot) dot.classList.remove('seq-wrong');
            }, 500);
            // Restart timer on wrong answer
            startStepTimer();
        }
    };

    /* ===== INIT ===== */
    document.addEventListener('DOMContentLoaded', function () {
        setBulbsEnabled(false);
    });

})();

