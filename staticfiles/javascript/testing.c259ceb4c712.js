// --- Category Flyout Logic ---
let activeFlyout = null;

// --- Robot Position State ---
const STEP = 60; // pixels per move
let robotX = 0, robotY = 0, robotAngle = 0;
let stopFlag = false;

function updateRobotTransform(animate = true) {
    const robot = document.getElementById('robot');
    robot.style.transition = animate ? 'transform 0.4s ease' : 'none';
    robot.style.transform = `translate(${robotX}px, ${robotY}px) rotate(${robotAngle}deg)`;
    // Auto-update distance after movement
    setTimeout(() => updateDistanceToCones(), animate ? 420 : 10);
}

// --- Auto Distance to Nearest Cone ---
function updateDistanceToCones() {
    const cones = document.querySelectorAll('.cone-placed');
    if (cones.length === 0) {
        setSimDistance(200);
        return;
    }

    const robotEl = document.getElementById('robot');
    const stageEl = document.querySelector('.stage');
    const stageRect = stageEl.getBoundingClientRect();
    const robotRect = robotEl.getBoundingClientRect();

    // Robot center in stage coordinates
    const robotCX = robotRect.left + robotRect.width / 2 - stageRect.left;
    const robotCY = robotRect.top + robotRect.height / 2 - stageRect.top;

    // Robot heading vector (0°=up, 90°=right, 180°=down, 270°=left)
    const rad = robotAngle * Math.PI / 180;
    const headX = Math.sin(rad);
    const headY = -Math.cos(rad);

    let minPixelDist = Infinity;
    const DETECT_ANGLE = 30; // only detect within ±30° of heading

    cones.forEach(cone => {
        const coneRect = cone.getBoundingClientRect();
        const coneCX = coneRect.left + coneRect.width / 2 - stageRect.left;
        const coneCY = coneRect.top + coneRect.height / 2 - stageRect.top;

        const dx = coneCX - robotCX;
        const dy = coneCY - robotCY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1) return; // skip if overlapping

        // Angle between heading and cone direction
        const dot = headX * (dx / dist) + headY * (dy / dist);
        const angleDeg = Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI;

        // Only detect if cone is within forward cone
        if (angleDeg <= DETECT_ANGLE && dist < minPixelDist) {
            minPixelDist = dist;
        }
    });

    if (minPixelDist === Infinity) {
        setSimDistance(200);
        return;
    }

    // Map pixel distance to cm
    const stageMaxDist = Math.sqrt(stageRect.width ** 2 + stageRect.height ** 2);
    let cm = Math.round((minPixelDist / stageMaxDist) * 200);
    cm = Math.max(2, Math.min(200, cm));

    setSimDistance(cm);
}

function setSimDistance(cm) {
    const slider = document.getElementById('sim-distance');
    const label = document.getElementById('dist-label');
    slider.value = cm;
    label.innerText = cm;
}

document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cat = btn.dataset.cat;
        const flyout = document.getElementById('flyout-' + cat);

        // Toggle: close if same, open new
        if (activeFlyout === flyout) {
            flyout.classList.remove('flyout-open');
            btn.classList.remove('cat-active');
            activeFlyout = null;
        } else {
            // Close previous
            document.querySelectorAll('.flyout').forEach(f => f.classList.remove('flyout-open'));
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('cat-active'));
            // Open new
            flyout.classList.add('flyout-open');
            btn.classList.add('cat-active');
            activeFlyout = flyout;
        }
    });
});

// Close flyout when clicking elsewhere
document.addEventListener('click', (e) => {
    if (!e.target.closest('.palette')) {
        document.querySelectorAll('.flyout').forEach(f => f.classList.remove('flyout-open'));
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('cat-active'));
        activeFlyout = null;
    }
});

// Audio Context for beep sounds
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(freq) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
    osc.stop(audioCtx.currentTime + 0.5);
}

// Drag and Drop Logic
let draggedBlock = null; // Track the block being dragged from workspace

document.addEventListener('dragstart', (e) => {
    if (!e.target.classList.contains('block')) return;

    // Check if this block is from the palette or from the workspace
    if (e.target.closest('.palette')) {
        // From palette: store type/val so we create a NEW block on drop
        e.dataTransfer.setData('source', 'palette');
        e.dataTransfer.setData('type', e.target.dataset.type);
        e.dataTransfer.setData('val', e.target.dataset.val);
        draggedBlock = null;
    } else {
        // From workspace: we will MOVE this existing block
        e.dataTransfer.setData('source', 'workspace');
        draggedBlock = e.target;
        e.target.style.opacity = '0.4';
    }
});

document.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('block')) {
        e.target.style.opacity = '1';
    }
    draggedBlock = null;
});

const zones = [document.getElementById('main-drop-zone')];

function setupZone(zone) {
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', (e) => {
        zone.classList.remove('drag-over');
    });
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.remove('drag-over');

        const source = e.dataTransfer.getData('source');

        if (source === 'workspace' && draggedBlock) {
            // Move existing block to this zone
            zone.appendChild(draggedBlock);
            draggedBlock.style.opacity = '1';
            draggedBlock = null;
        } else {
            // Create new block from palette
            const type = e.dataTransfer.getData('type');
            const val = e.dataTransfer.getData('val');
            createBlock(type, val, zone);
        }
    });
}
setupZone(zones[0]);

// Trash Bin Setup
const trashBin = document.getElementById('trash-bin');
trashBin.addEventListener('dragover', (e) => {
    e.preventDefault();
    trashBin.classList.add('trash-active');
});
trashBin.addEventListener('dragleave', () => {
    trashBin.classList.remove('trash-active');
});
trashBin.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    trashBin.classList.remove('trash-active');
    if (draggedBlock) {
        draggedBlock.remove();
        draggedBlock = null;
    }
});

// --- Cone Drag-and-Drop Logic ---
let draggedCone = null;
let coneOffsetX = 0;
let coneOffsetY = 0;
const stage = document.querySelector('.stage');
const coneStorage = document.querySelector('.cone-storage');

// Handle cone dragging
document.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('cone')) {
        draggedCone = e.target;

        // If cone is already on stage, calculate offset for smooth dragging
        if (draggedCone.classList.contains('cone-placed')) {
            const rect = draggedCone.getBoundingClientRect();
            coneOffsetX = e.clientX - rect.left;
            coneOffsetY = e.clientY - rect.top;
        } else {
            coneOffsetX = 20;
            coneOffsetY = 20;
        }

        e.dataTransfer.effectAllowed = 'move';
        e.target.style.opacity = '0.5';
    }
});

document.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('cone')) {
        e.target.style.opacity = '1';
        draggedCone = null;
    }
});

// Make stage accept cone drops
stage.addEventListener('dragover', (e) => {
    if (draggedCone) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }
});

stage.addEventListener('drop', (e) => {
    if (draggedCone) {
        e.preventDefault();
        e.stopPropagation();

        const stageRect = stage.getBoundingClientRect();

        // Calculate position relative to stage
        let x = e.clientX - stageRect.left - coneOffsetX;
        let y = e.clientY - stageRect.top - coneOffsetY;

        // Constrain within stage boundaries
        x = Math.max(0, Math.min(x, stageRect.width - 40));
        y = Math.max(0, Math.min(y, stageRect.height - 40));

        // Clone cone from storage if it's from storage
        if (!draggedCone.classList.contains('cone-placed')) {
            const newCone = draggedCone.cloneNode(true);
            newCone.classList.add('cone-placed');
            newCone.style.position = 'absolute';
            newCone.style.left = x + 'px';
            newCone.style.top = y + 'px';

            // Double-click to return to storage
            newCone.addEventListener('dblclick', () => {
                newCone.remove();
                updateDistanceToCones();
            });

            stage.appendChild(newCone);
            updateDistanceToCones();
        } else {
            // Move existing cone
            draggedCone.style.left = x + 'px';
            draggedCone.style.top = y + 'px';
            updateDistanceToCones();
        }

        draggedCone.style.opacity = '1';
        draggedCone = null;
    }
});


// --- Clear All Cones ---
function clearAllCones() {
    document.querySelectorAll('.cone-placed').forEach(c => c.remove());
    updateDistanceToCones();
}

// --- Simulated Hardware State ---
const simState = { D18: false, D22: false, D24: false };

function toggleSimBtn(pin) {
    simState[pin] = !simState[pin];
    const btn = document.getElementById('sim-' + pin.toLowerCase());
    btn.innerText = `🔘 ${pin}: ${simState[pin] ? 'ON' : 'OFF'}`;
    btn.classList.toggle('sim-on', simState[pin]);
}

function getSimDistance() {
    return parseInt(document.getElementById('sim-distance').value);
}

// Evaluate a condition by reading whatever sensor block is in the condition-zone
function evaluateConditionZone(condZone) {
    const sensorBlock = condZone.querySelector('.block');
    if (!sensorBlock) return false; // empty slot = false
    const sType = sensorBlock.dataset.type;
    const sVal = sensorBlock.dataset.val;
    if (sType === 'btn_press') return simState[sVal] === true;
    if (sType === 'ultrasonic') {
        const threshold = parseInt(sVal) || 20;
        return getSimDistance() < threshold;
    }
    if (sType === 'color_sense') {
        const selectedColor = document.querySelector('input[name="sim-color"]:checked');
        return selectedColor && selectedColor.value === sVal;
    }
    return false;
}

// Setup a condition zone (only accepts sensor blocks)
function setupCondZone(zone) {
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-over');
    });
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.remove('drag-over');

        const source = e.dataTransfer.getData('source');
        let blockType, blockVal;

        if (source === 'workspace' && draggedBlock) {
            blockType = draggedBlock.dataset.type;
            blockVal = draggedBlock.dataset.val;
            // Only accept sensor blocks
            if (blockType !== 'btn_press' && blockType !== 'ultrasonic' && blockType !== 'color_sense') return;
            // Clear existing sensor in this slot
            zone.querySelectorAll('.block').forEach(b => b.remove());
            zone.appendChild(draggedBlock);
            draggedBlock.style.opacity = '1';
            draggedBlock = null;
        } else {
            blockType = e.dataTransfer.getData('type');
            blockVal = e.dataTransfer.getData('val');
            // Only accept sensor blocks
            if (blockType !== 'btn_press' && blockType !== 'ultrasonic' && blockType !== 'color_sense') return;
            // Clear existing sensor in this slot
            zone.querySelectorAll('.block').forEach(b => b.remove());
            createBlock(blockType, blockVal, zone);
        }
    });
}

// --- Block Classification ---
function getBlockClass(type) {
    if (type === 'repeat' || type === 'forever' || type === 'wait') return 'b-logic';
    if (type === 'move') return 'b-move';
    if (type === 'honk') return 'b-honk';
    if (type === 'if_then' || type === 'if_then_else' || type === 'if_elseif_else') return 'b-cond';
    if (type === 'btn_press' || type === 'ultrasonic') return 'b-sensor';
    if (type === 'color_sense') return 'b-colorsensor';
    if (type === 'lcd_display' || type === 'lcd_clear') return 'b-lcd';
    return 'b-voice';
}

// --- Block Creation ---
function createBlock(type, val, parent) {
    const el = document.createElement('div');
    el.className = `block ${getBlockClass(type)}`;
    el.draggable = true;
    el.dataset.type = type;
    el.dataset.val = val;

    if (type === 'repeat') {
        el.classList.add('repeat-container');
        el.innerHTML = `
                        <div class="repeat-header">
                            REPEAT 
                            <input type="number" value="${val}" min="1" max="99" 
                                style="width: 45px; text-align: center; border-radius: 4px; border: 1px solid #ccc; font-weight: bold;"
                                onclick="event.stopPropagation()" 
                                onchange="this.parentElement.parentElement.dataset.val = this.value"> 
                            TIMES
                        </div>
                        <div class="drop-zone inner-zone"></div>`;
        setupZone(el.querySelector('.inner-zone'));
    }
    else if (type === 'forever') {
        el.classList.add('repeat-container');
        el.innerHTML = `<div class="repeat-header">FOREVER ♾️</div><div class="drop-zone inner-zone"></div>`;
        setupZone(el.querySelector('.inner-zone'));
    }
    else if (type === 'wait') {
        el.innerHTML = `WAIT <input type="number" value="${val}" min="0.1" max="30" step="0.1"
                        style="width: 50px; text-align: center; border-radius: 4px; border: 1px solid #ccc; font-weight: bold;"
                        onclick="event.stopPropagation()"
                        onchange="this.parentElement.dataset.val = this.value"> SEC ⏳`;
    }
    // --- Conditional Blocks (standalone with puzzle slots) ---
    else if (type === 'if_then') {
        el.classList.add('cond-container');
        el.innerHTML = `
                        <div class="cond-header">🟢 IF</div>
                        <div class="condition-zone" data-slot="if1">Drop sensor here 🧩</div>
                        <div class="cond-label">THEN:</div>
                        <div class="drop-zone inner-zone cond-then"></div>`;
        setupCondZone(el.querySelector('.condition-zone'));
        setupZone(el.querySelector('.cond-then'));
    }
    else if (type === 'if_then_else') {
        el.classList.add('cond-container');
        el.innerHTML = `
                        <div class="cond-header">🟡 IF</div>
                        <div class="condition-zone" data-slot="if1">Drop sensor here 🧩</div>
                        <div class="cond-label">THEN:</div>
                        <div class="drop-zone inner-zone cond-then"></div>
                        <div class="cond-label">ELSE:</div>
                        <div class="drop-zone inner-zone cond-else"></div>`;
        setupCondZone(el.querySelector('.condition-zone'));
        setupZone(el.querySelector('.cond-then'));
        setupZone(el.querySelector('.cond-else'));
    }
    else if (type === 'if_elseif_else') {
        el.classList.add('cond-container');
        el.innerHTML = `
                        <div class="cond-header">🟠 IF</div>
                        <div class="condition-zone" data-slot="if1">Drop sensor here 🧩</div>
                        <div class="cond-label">THEN:</div>
                        <div class="drop-zone inner-zone cond-then"></div>
                        <div class="cond-header">ELSE IF</div>
                        <div class="condition-zone" data-slot="if2">Drop sensor here 🧩</div>
                        <div class="cond-label">THEN:</div>
                        <div class="drop-zone inner-zone cond-elseif"></div>
                        <div class="cond-label">ELSE:</div>
                        <div class="drop-zone inner-zone cond-else"></div>`;
        el.querySelectorAll('.condition-zone').forEach(z => setupCondZone(z));
        setupZone(el.querySelector('.cond-then'));
        setupZone(el.querySelector('.cond-elseif'));
        setupZone(el.querySelector('.cond-else'));
    }
    // --- Sensor Blocks ---
    else if (type === 'btn_press') {
        el.innerText = `BTN ${val} 🔘`;
    }
    else if (type === 'ultrasonic') {
        el.innerHTML = `DIST < <input type="number" value="${val}" min="2" max="200"
                        style="width: 50px; text-align: center; border-radius: 4px; border: 1px solid #ccc; font-weight: bold;"
                        onclick="event.stopPropagation()"
                        onchange="this.parentElement.dataset.val = this.value"> cm 📡`;
    }
    else if (type === 'color_sense') {
        const colorEmojis = { white: '⬜', red: '🟥', orange: '🟧', green: '🟩', blue: '🟦' };
        el.innerText = `${colorEmojis[val] || '🎨'} ${val.charAt(0).toUpperCase() + val.slice(1)}`;
    }
    else if (type === 'lcd_display') {
        el.dataset.row = '1';
        el.dataset.duration = '2';
        el.innerHTML = `📺 <input type="text" value="${val}" maxlength="8" 
                        style="width:65px; text-align:center; border-radius:4px; border:1px solid #ccc; font-weight:bold; font-size:12px;"
                        onclick="event.stopPropagation()" 
                        onchange="this.parentElement.dataset.val = this.value">
                        <select style="border-radius:4px; border:1px solid #ccc; font-size:11px; font-weight:bold;"
                        onclick="event.stopPropagation()"
                        onchange="this.parentElement.dataset.row = this.value">
                            <option value="1">Row 1</option>
                            <option value="2">Row 2</option>
                        </select>
                        <input type="number" value="2" min="0.5" max="30" step="0.5"
                        style="width:40px; text-align:center; border-radius:4px; border:1px solid #ccc; font-weight:bold; font-size:11px;"
                        onclick="event.stopPropagation()"
                        onchange="this.parentElement.dataset.duration = this.value"> second`;
    }
    else if (type === 'lcd_clear') {
        el.innerText = '🗑️ LCD Clear';
    }
    else if (type === 'honk') {
        el.innerText = `HONK 📯`;
    }
    else {
        el.innerText = `${type.toUpperCase()}: ${val}`;
    }

    parent.appendChild(el);
}

// Execution Logic
async function executeBlocks(container) {
    const children = Array.from(container.children);
    for (let block of children) {
        if (stopFlag) return;
        // Skip non-block elements (headers, labels, condition-zones, drop-zones)
        if (!block.classList.contains('block')) continue;
        if (block.classList.contains('repeat-header') || block.classList.contains('cond-header') || block.classList.contains('cond-label')) continue;

        // Visual feedback
        block.style.boxShadow = "0 0 15px gold";
        block.style.border = "2px solid gold";

        const type = block.dataset.type;
        const val = block.dataset.val;
        const robot = document.getElementById('robot');

        if (type === 'move') {
            if (val === 'up') {
                // Move forward in current heading direction
                const rad = robotAngle * Math.PI / 180;
                robotX += Math.round(Math.sin(rad) * STEP);
                robotY -= Math.round(Math.cos(rad) * STEP);
            } else if (val === 'down') {
                // Move backward
                const rad = robotAngle * Math.PI / 180;
                robotX -= Math.round(Math.sin(rad) * STEP);
                robotY += Math.round(Math.cos(rad) * STEP);
            } else if (val === 'left') {
                robotAngle -= 90;
            } else if (val === 'right') {
                robotAngle += 90;
            }
            updateRobotTransform();
            await new Promise(r => setTimeout(r, 500));
        }
        else if (type === 'say') {
            const bubble = document.getElementById('speech-bubble');
            bubble.innerText = val;
            bubble.style.display = 'block';
            await new Promise(r => setTimeout(r, 1200));
            bubble.style.display = 'none';
        }
        else if (type === 'sound') {
            playSound(val === 'beep' ? 440 : 220);
            await new Promise(r => setTimeout(r, 500));
        }
        else if (type === 'wait') {
            const seconds = parseFloat(block.dataset.val) || 1;
            await new Promise(r => setTimeout(r, seconds * 1000));
        }
        else if (type === 'honk') {
            playSound(350);
            await new Promise(r => setTimeout(r, 150));
            playSound(440);
            const bubble = document.getElementById('speech-bubble');
            bubble.innerText = 'HONK! 📯';
            bubble.style.display = 'block';
            await new Promise(r => setTimeout(r, 600));
            bubble.style.display = 'none';
        }
        // --- Sensor standalone blocks (show info in speech bubble) ---
        else if (type === 'btn_press') {
            const pressed = simState[val];
            const bubble = document.getElementById('speech-bubble');
            bubble.innerText = `${val}: ${pressed ? 'PRESSED ✅' : 'NOT PRESSED ❌'}`;
            bubble.style.display = 'block';
            await new Promise(r => setTimeout(r, 800));
            bubble.style.display = 'none';
        }
        else if (type === 'ultrasonic') {
            const dist = getSimDistance();
            const threshold = parseInt(block.dataset.val) || 20;
            const bubble = document.getElementById('speech-bubble');
            bubble.innerText = `Dist: ${dist}cm ${dist < threshold ? '< ' + threshold + ' ⚠️' : '>= ' + threshold + ' ✅'}`;
            bubble.style.display = 'block';
            await new Promise(r => setTimeout(r, 800));
            bubble.style.display = 'none';
        }
        else if (type === 'color_sense') {
            const selectedColor = document.querySelector('input[name="sim-color"]:checked');
            const currentColor = selectedColor ? selectedColor.value : 'none';
            const matches = currentColor === val;
            const bubble = document.getElementById('speech-bubble');
            bubble.innerText = `🎨 ${val}: ${matches ? 'DETECTED ✅' : 'NOT DETECTED ❌'}`;
            bubble.style.display = 'block';
            await new Promise(r => setTimeout(r, 800));
            bubble.style.display = 'none';
        }
        else if (type === 'lcd_display') {
            const text = block.dataset.val || '';
            const row = block.dataset.row || '1';
            const duration = parseFloat(block.dataset.duration) || 2;
            const rowEl = document.getElementById('lcd-row' + row);
            if (rowEl) {
                const cells = rowEl.children;
                for (let i = 0; i < cells.length; i++) {
                    cells[i].innerText = text[i] || '';
                    cells[i].style.color = '#7fd8ff';
                    cells[i].style.fontSize = '14px';
                    cells[i].style.fontWeight = 'bold';
                    cells[i].style.fontFamily = 'monospace';
                    cells[i].style.display = 'flex';
                    cells[i].style.alignItems = 'center';
                    cells[i].style.justifyContent = 'center';
                }
            }
            await new Promise(r => setTimeout(r, duration * 1000));
        }
        else if (type === 'lcd_clear') {
            ['lcd-row1', 'lcd-row2'].forEach(id => {
                const rowEl = document.getElementById(id);
                if (rowEl) {
                    Array.from(rowEl.children).forEach(c => { c.innerText = ''; });
                }
            });
            await new Promise(r => setTimeout(r, 300));
        }
        // --- Conditional Blocks (read condition from puzzle slot) ---
        else if (type === 'if_then') {
            const condZone = block.querySelector('.condition-zone');
            const condResult = evaluateConditionZone(condZone);
            if (condResult) {
                await executeBlocks(block.querySelector('.cond-then'));
            }
        }
        else if (type === 'if_then_else') {
            const condZone = block.querySelector('.condition-zone');
            const condResult = evaluateConditionZone(condZone);
            if (condResult) {
                await executeBlocks(block.querySelector('.cond-then'));
            } else {
                await executeBlocks(block.querySelector('.cond-else'));
            }
        }
        else if (type === 'if_elseif_else') {
            const condZones = block.querySelectorAll('.condition-zone');
            const cond1 = evaluateConditionZone(condZones[0]);
            if (cond1) {
                await executeBlocks(block.querySelector('.cond-then'));
            } else {
                const cond2 = evaluateConditionZone(condZones[1]);
                if (cond2) {
                    await executeBlocks(block.querySelector('.cond-elseif'));
                } else {
                    await executeBlocks(block.querySelector('.cond-else'));
                }
            }
        }
        else if (type === 'repeat') {
            const innerZone = block.querySelector('.inner-zone');
            const iterations = parseInt(block.dataset.val);
            for (let i = 0; i < iterations; i++) {
                if (stopFlag || !document.body.contains(block)) break;
                await executeBlocks(innerZone);
            }
        }
        else if (type === 'forever') {
            const innerZone = block.querySelector('.inner-zone');
            while (!stopFlag && document.body.contains(block)) {
                await executeBlocks(innerZone);
                // Yield to browser event loop so UI stays responsive
                // (without this, a false if-condition creates a tight loop freeze)
                await new Promise(r => setTimeout(r, 50));
            }
        }

        // Remove highlight
        block.style.boxShadow = "none";
        block.style.border = "none";
    }
}

async function startRobot() {
    stopFlag = false;
    // Reset robot position
    robotX = 0; robotY = 0; robotAngle = 0;
    updateRobotTransform(false); // instant reset, no animation

    // Small delay so reset is visible before starting
    await new Promise(r => setTimeout(r, 200));

    const robot = document.getElementById('robot');
    robot.classList.add('running');

    await executeBlocks(document.getElementById('main-drop-zone'));

    robot.classList.remove('running');
    stopFlag = false;
}

function stopExecution() {
    stopFlag = true;
}