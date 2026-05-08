// ===== CAR SIMULATOR =====
let simCarX = 0;   // center offset X (px)
let simCarY = 0;   // center offset Y (px)
let simCarAngle = 0; // degrees, 0 = facing up
let simRunning = false;

const SIM_DURATION = 1000;  // 1 second
const SIM_FPS = 60;
const SIM_SPEED_SCALE = 1.5; // px per frame at 100% speed

function setPreset(left, right) {
    document.getElementById('leftSpeed').value = left;
    document.getElementById('rightSpeed').value = right;
}

function resetSim() {
    simCarX = 0;
    simCarY = 0;
    simCarAngle = 0;
    simRunning = false;

    const car = document.getElementById('simCar');
    car.style.transform = 'translate(-50%, -50%) rotate(0deg)';
    car.style.left = '50%';
    car.style.top = '50%';

    document.getElementById('movementInfo').innerText = 'Set motor speeds and press RUN!';
    document.getElementById('movementInfo').className = 'movement-info';
    document.getElementById('runBtn').disabled = false;
}

function runSimulation() {
    if (simRunning) return;

    const leftSpeed = parseInt(document.getElementById('leftSpeed').value) || 0;
    const rightSpeed = parseInt(document.getElementById('rightSpeed').value) || 0;

    // Clamp to -100..100
    const L = Math.max(-100, Math.min(100, leftSpeed));
    const R = Math.max(-100, Math.min(100, rightSpeed));

    // Determine movement type label
    let moveLabel = '';
    let moveClass = '';
    if (L === 0 && R === 0) {
        document.getElementById('movementInfo').innerText = '⚠️ Both motors are OFF! The car won\'t move.';
        document.getElementById('movementInfo').className = 'movement-info info-warning';
        return;
    } else if (L === R) {
        moveLabel = L > 0 ? '⬆️ Moving FORWARD' : '⬇️ Moving BACKWARD';
        moveClass = 'info-forward';
    } else if (L === -R) {
        moveLabel = L > 0 ? '🔄 Spinning RIGHT' : '🔄 Spinning LEFT';
        moveClass = 'info-spin';
    } else if (Math.sign(L) === Math.sign(R) || L === 0 || R === 0) {
        // Same direction but different speeds → turning
        const avgSpeed = (L + R) / 2;
        const turnDir = L < R ? 'LEFT' : 'RIGHT';
        moveLabel = (avgSpeed >= 0 ? '↗️' : '↙️') + ' Turning ' + turnDir + (avgSpeed < 0 ? ' (backward)' : '');
        moveClass = 'info-turn';
    } else {
        // Different signs → arc/spin
        const turnDir = L > R ? 'RIGHT' : 'LEFT';
        moveLabel = '🌀 Arc-spinning ' + turnDir;
        moveClass = 'info-spin';
    }

    document.getElementById('movementInfo').innerText = moveLabel;
    document.getElementById('movementInfo').className = 'movement-info ' + moveClass;

    simRunning = true;
    document.getElementById('runBtn').disabled = true;

    // Normalize speeds to -1..1
    const lNorm = L / 100;
    const rNorm = R / 100;

    const stage = document.getElementById('simStage');
    const stageW = stage.offsetWidth;
    const stageH = stage.offsetHeight;

    let elapsed = 0;
    const interval = 1000 / SIM_FPS;

    const timer = setInterval(function () {
        elapsed += interval;

        // Differential drive physics
        const forward = (lNorm + rNorm) / 2 * SIM_SPEED_SCALE;
        const turn = (lNorm - rNorm) * 1.5; // degrees per frame (L > R = turn right)

        simCarAngle += turn;

        // Convert angle to radians (0° = up = negative Y)
        const rad = (simCarAngle - 90) * Math.PI / 180;
        simCarX += forward * Math.cos(rad);
        simCarY += forward * Math.sin(rad);

        // Boundary clamping
        const halfW = stageW / 2 - 30;
        const halfH = stageH / 2 - 30;
        simCarX = Math.max(-halfW, Math.min(halfW, simCarX));
        simCarY = Math.max(-halfH, Math.min(halfH, simCarY));

        // Apply transform
        const car = document.getElementById('simCar');
        const pxX = stageW / 2 + simCarX;
        const pxY = stageH / 2 + simCarY;
        car.style.left = pxX + 'px';
        car.style.top = pxY + 'px';
        car.style.transform = 'translate(-50%, -50%) rotate(' + simCarAngle + 'deg)';

        if (elapsed >= SIM_DURATION) {
            clearInterval(timer);
            simRunning = false;
            document.getElementById('runBtn').disabled = false;
        }
    }, interval);
}