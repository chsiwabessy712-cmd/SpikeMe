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
            (function(cupId) {
                container.addEventListener('click', function() {
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

/* ===== TRAFFIC LIGHT CAR SIMULATOR ===== */
(function () {
    'use strict';

    var currentState = 'idle';   // idle, green, yellow, red
    var redTimer = null;
    var countdownInterval = null;
    var countdownValue = 5;

    function $(id) { return document.getElementById(id); }

    /* ===== ACTIVATE A BULB ===== */
    function setActiveBulb(color) {
        // Remove active from all bulbs
        var bulbs = ['tl-bulb-red', 'tl-bulb-yellow', 'tl-bulb-green'];
        for (var i = 0; i < bulbs.length; i++) {
            var el = $(bulbs[i]);
            if (el) el.classList.remove('active');
        }
        // Activate the selected one
        if (color === 'red') $('tl-bulb-red').classList.add('active');
        if (color === 'yellow') $('tl-bulb-yellow').classList.add('active');
        if (color === 'green') $('tl-bulb-green').classList.add('active');
    }

    /* ===== SET CAR STATE ===== */
    function setCarState(state) {
        var car = $('tl-car');
        var road = $('tl-road');
        if (!car || !road) return;

        // Clear all animation classes
        car.classList.remove('driving', 'slowing', 'stopped');
        road.classList.remove('road-moving', 'road-slow');

        if (state === 'green') {
            car.classList.add('driving');
            road.classList.add('road-moving');
        } else if (state === 'yellow') {
            car.classList.add('slowing');
            road.classList.add('road-slow');
        } else if (state === 'red') {
            car.classList.add('stopped');
            // Stop car at current position
            var computedLeft = window.getComputedStyle(car).left;
            car.style.left = computedLeft;
            // Force reflow then clear animation
            void car.offsetWidth;
            car.classList.remove('driving', 'slowing');
            car.classList.add('stopped');
        }
    }

    /* ===== UPDATE STATUS PANEL ===== */
    function updateStatus(color, action, speed) {
        var sensedEl = $('tl-sensed-color');
        var actionEl = $('tl-car-action');
        var speedEl = $('tl-car-speed');

        if (sensedEl) {
            sensedEl.textContent = color.charAt(0).toUpperCase() + color.slice(1);
            if (color === 'red') sensedEl.style.color = '#dc2626';
            else if (color === 'yellow') sensedEl.style.color = '#d97706';
            else if (color === 'green') sensedEl.style.color = '#16a34a';
            else sensedEl.style.color = '#1a1a2e';
        }
        if (actionEl) actionEl.textContent = action;
        if (speedEl) speedEl.textContent = speed;
    }

    /* ===== UPDATE LIVE CODE ===== */
    function updateCode(color) {
        var codeBody = $('tl-code-body');
        if (!codeBody) return;

        var lines = [];
        lines.push('<span class="tl-code-keyword">color</span> = sensor.<span class="tl-code-function">detect</span>()');
        lines.push('<span class="tl-code-comment"># color sensed: <span class="tl-code-string">"' + color + '"</span></span>');
        lines.push('');

        if (color === 'red') {
            lines.push('<span class="tl-code-active-line"><span class="tl-code-keyword">if</span> color == <span class="tl-code-string">"red"</span>:</span>');
            lines.push('<span class="tl-code-active-line">    motor.<span class="tl-code-function">stop</span>()  <span class="tl-code-comment"># Stop for 5 seconds</span></span>');
            lines.push('<span class="tl-code-keyword">elif</span> color == <span class="tl-code-string">"yellow"</span>:');
            lines.push('    motor.<span class="tl-code-function">slow</span>()');
            lines.push('<span class="tl-code-keyword">elif</span> color == <span class="tl-code-string">"green"</span>:');
            lines.push('    motor.<span class="tl-code-function">move</span>()');
        } else if (color === 'yellow') {
            lines.push('<span class="tl-code-keyword">if</span> color == <span class="tl-code-string">"red"</span>:');
            lines.push('    motor.<span class="tl-code-function">stop</span>()');
            lines.push('<span class="tl-code-active-line"><span class="tl-code-keyword">elif</span> color == <span class="tl-code-string">"yellow"</span>:</span>');
            lines.push('<span class="tl-code-active-line">    motor.<span class="tl-code-function">slow</span>()  <span class="tl-code-comment"># Slow down!</span></span>');
            lines.push('<span class="tl-code-keyword">elif</span> color == <span class="tl-code-string">"green"</span>:');
            lines.push('    motor.<span class="tl-code-function">move</span>()');
        } else if (color === 'green') {
            lines.push('<span class="tl-code-keyword">if</span> color == <span class="tl-code-string">"red"</span>:');
            lines.push('    motor.<span class="tl-code-function">stop</span>()');
            lines.push('<span class="tl-code-keyword">elif</span> color == <span class="tl-code-string">"yellow"</span>:');
            lines.push('    motor.<span class="tl-code-function">slow</span>()');
            lines.push('<span class="tl-code-active-line"><span class="tl-code-keyword">elif</span> color == <span class="tl-code-string">"green"</span>:</span>');
            lines.push('<span class="tl-code-active-line">    motor.<span class="tl-code-function">move</span>()  <span class="tl-code-comment"># Full speed!</span></span>');
        }

        codeBody.innerHTML = lines.join('\n');
    }

    /* ===== CLEAR TIMERS ===== */
    function clearTimers() {
        if (redTimer) { clearTimeout(redTimer); redTimer = null; }
        if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
        var cdEl = $('tl-countdown');
        if (cdEl) cdEl.style.display = 'none';
    }

    /* ===== START RED COUNTDOWN ===== */
    function startRedCountdown() {
        countdownValue = 5;
        var cdEl = $('tl-countdown');
        var cdNum = $('tl-countdown-num');
        if (cdEl) cdEl.style.display = 'block';
        if (cdNum) cdNum.textContent = countdownValue;

        countdownInterval = setInterval(function () {
            countdownValue--;
            if (cdNum) cdNum.textContent = countdownValue;

            if (countdownValue <= 0) {
                clearInterval(countdownInterval);
                countdownInterval = null;
                if (cdEl) cdEl.style.display = 'none';

                // Auto-resume to green after 5 seconds
                currentState = 'green';
                setActiveBulb('green');
                setCarState('green');
                updateStatus('green', 'move()', '60 km/h');
                updateCode('green');
            }
        }, 1000);
    }

    /* ===== MAIN COLOR SENSE FUNCTION ===== */
    window.senseColor = function (color) {
        clearTimers();

        currentState = color;
        setActiveBulb(color);

        if (color === 'green') {
            setCarState('green');
            updateStatus('green', 'move()', '60 km/h');
            updateCode('green');

        } else if (color === 'yellow') {
            setCarState('yellow');
            updateStatus('yellow', 'slow()', '20 km/h');
            updateCode('yellow');

        } else if (color === 'red') {
            setCarState('red');
            updateStatus('red', 'stop()', '0 km/h');
            updateCode('red');
            startRedCountdown();
        }
    };

})();

