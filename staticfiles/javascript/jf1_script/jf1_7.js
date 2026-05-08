/* ===== MONSTER SPLASH GAME ENGINE ===== */
(function () {
    const cvs = document.getElementById('sg-canvas');
    const ctx = cvs.getContext('2d');
    const W = 760, H = 480, TILE = 40;
    let running = false, score = 0, defeated = 0, lives = 3, round = 1;
    let player, monsters, bullets, particles, keys = {}, facing = 'right';
    let modalOpen = false, currentMonster = null;

    /* Story question bank */
    const mulStories = [
        (a, b) => `A robot has ${a} arms, and each arm holds ${b} water balloons. How many balloons total?`,
        (a, b) => `There are ${a} teams, each with ${b} players. How many players altogether?`,
        (a, b) => `A printer prints ${b} pages per minute. How many pages in ${a} minutes?`,
        (a, b) => `${a} boxes each contain ${b} crayons. How many crayons in total?`,
        (a, b) => `A garden has ${a} rows with ${b} flowers each. How many flowers?`,
    ];
    const divStories = [
        (t, d) => `${t} cookies are shared equally among ${d} friends. How many does each get?`,
        (t, d) => `A robot has ${t} batteries split into ${d} equal packs. How many per pack?`,
        (t, d) => `${t} stickers are divided into ${d} equal groups. How many in each group?`,
        (t, d) => `${t} marbles are put into ${d} bags equally. How many marbles per bag?`,
        (t, d) => `A teacher splits ${t} pencils among ${d} students equally. How many each?`,
    ];

    function genQuestion() {
        if (Math.random() < 0.5) {
            let a = rnd(1, 5), b = rnd(1, 5), ans = a * b;
            let story = mulStories[rnd(0, mulStories.length - 1)](a, b);
            return { story, eq: `${a} × ${b} = ?`, answer: ans, type: '×' };
        } else {
            let d = rnd(1, 5), q = rnd(1, 5), t = d * q; // ensure clean division, t<=10 where possible
            if (t > 10) { d = rnd(1, 3); q = rnd(1, 3); t = d * q; }
            let story = divStories[rnd(0, divStories.length - 1)](t, d);
            return { story, eq: `${t} ÷ ${d} = ?`, answer: q, type: '÷' };
        }
    }

    function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

    /* Decorations - static grass/rocks */
    let decorations = [];
    function genDecorations() {
        decorations = [];
        for (let i = 0; i < 18; i++) {
            decorations.push({ x: rnd(0, W - 20), y: rnd(0, H - 20), type: rnd(0, 2) });
        }
    }

    function initGame() {
        score = 0; defeated = 0; lives = 3; round = 1;
        player = { x: W / 2, y: H / 2, w: 32, h: 32, speed: 3.5, dir: 'right' };
        monsters = []; bullets = []; particles = [];
        genDecorations();
        spawnMonsters(2);
        updateHUD();
    }

    function spawnMonsters(n) {
        for (let i = 0; i < n; i++) {
            let mx, my, ok;
            do {
                mx = rnd(60, W - 60); my = rnd(60, H - 60);
                ok = Math.hypot(mx - player.x, my - player.y) > 120;
            } while (!ok);
            monsters.push({ x: mx, y: my, w: 34, h: 34, hp: 1, flash: 0, moveTimer: rnd(0, 120), dx: 0, dy: 0 });
        }
    }

    function updateHUD() {
        document.getElementById('sg-score').textContent = score;
        document.getElementById('sg-defeated').textContent = defeated;
        document.getElementById('sg-lives').textContent = '❤️'.repeat(Math.max(0, lives));
        document.getElementById('sg-round').textContent = round;
    }

    /* Drawing helpers */
    function drawPlayer() {
        const p = player, cx = p.x, cy = p.y;
        // Body
        ctx.fillStyle = '#4fc3f7';
        ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2); ctx.fill();
        // Visor
        ctx.fillStyle = '#0d47a1';
        let vx = cx, vy = cy - 4;
        ctx.beginPath(); ctx.arc(vx, vy, 7, 0, Math.PI * 2); ctx.fill();
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(vx - 3, vy - 1, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(vx + 3, vy - 1, 2.5, 0, Math.PI * 2); ctx.fill();
        // Direction indicator (water gun)
        ctx.fillStyle = '#29b6f6';
        let gx = cx, gy = cy;
        if (facing === 'right') { gx += 18; } else if (facing === 'left') { gx -= 18; } else if (facing === 'up') { gy -= 18; } else { gy += 18; }
        ctx.beginPath(); ctx.arc(gx, gy, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#01579b';
        ctx.beginPath(); ctx.arc(gx, gy, 2.5, 0, Math.PI * 2); ctx.fill();
    }

    function drawMonster(m) {
        const cx = m.x, cy = m.y;
        ctx.fillStyle = m.flash > 0 ? '#fff' : '#e040fb';
        ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
        // Eyes
        ctx.fillStyle = m.flash > 0 ? '#e040fb' : '#fff';
        ctx.beginPath(); ctx.arc(cx - 6, cy - 4, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 6, cy - 4, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath(); ctx.arc(cx - 6, cy - 4, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 6, cy - 4, 2, 0, Math.PI * 2); ctx.fill();
        // Mouth
        ctx.strokeStyle = m.flash > 0 ? '#e040fb' : '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy + 6, 6, 0, Math.PI); ctx.stroke();
        // Tentacles
        ctx.fillStyle = m.flash > 0 ? '#fff' : '#ce93d8';
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath(); ctx.arc(cx + i * 10, cy + 16, 4, 0, Math.PI * 2); ctx.fill();
        }
    }

    function drawBullet(b) {
        ctx.fillStyle = 'rgba(41,182,246,0.9)';
        ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath(); ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2); ctx.fill();
    }

    function drawParticle(p) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }

    function drawBackground() {
        // Gradient floor
        let grd = ctx.createLinearGradient(0, 0, 0, H);
        grd.addColorStop(0, '#1a1a2e'); grd.addColorStop(1, '#16213e');
        ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
        for (let x = 0; x < W; x += TILE) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += TILE) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        // Decorations
        decorations.forEach(d => {
            if (d.type === 0) { ctx.fillStyle = '#2d4a3e'; ctx.beginPath(); ctx.arc(d.x, d.y, 6, 0, Math.PI * 2); ctx.fill(); }
            else if (d.type === 1) { ctx.fillStyle = '#3b2d50'; ctx.fillRect(d.x - 4, d.y - 4, 8, 8); }
            else { ctx.fillStyle = '#1e3a28'; ctx.beginPath(); ctx.moveTo(d.x, d.y - 8); ctx.lineTo(d.x - 6, d.y + 4); ctx.lineTo(d.x + 6, d.y + 4); ctx.closePath(); ctx.fill(); }
        });
    }

    /* Collision */
    function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

    /* Game loop */
    function update() {
        if (!running || modalOpen) return;
        // Player movement
        let dx = 0, dy = 0;
        if (keys['ArrowUp'] || keys['up']) { dy = -1; facing = 'up'; }
        if (keys['ArrowDown'] || keys['down']) { dy = 1; facing = 'down'; }
        if (keys['ArrowLeft'] || keys['left']) { dx = -1; facing = 'left'; }
        if (keys['ArrowRight'] || keys['right']) { dx = 1; facing = 'right'; }
        if (dx && dy) { dx *= 0.707; dy *= 0.707; }
        player.x = Math.max(20, Math.min(W - 20, player.x + dx * player.speed));
        player.y = Math.max(20, Math.min(H - 20, player.y + dy * player.speed));

        // Monster wander
        monsters.forEach(m => {
            m.moveTimer--;
            if (m.moveTimer <= 0) {
                m.dx = (Math.random() - 0.5) * 1.5; m.dy = (Math.random() - 0.5) * 1.5;
                m.moveTimer = rnd(60, 180);
            }
            m.x = Math.max(20, Math.min(W - 20, m.x + m.dx));
            m.y = Math.max(20, Math.min(H - 20, m.y + m.dy));
            if (m.flash > 0) m.flash--;
        });

        // Check player-monster proximity
        monsters.forEach(m => {
            if (dist(player, m) < 50 && !modalOpen) {
                openModal(m);
            }
        });

        // Bullets
        bullets.forEach(b => {
            b.x += b.dx * 6; b.y += b.dy * 6; b.life--;
        });
        // Bullet-monster collision
        bullets.forEach(b => {
            monsters.forEach(m => {
                if (dist(b, m) < 22 && b.life > 0) {
                    b.life = 0; m.flash = 8; m.hp--;
                    spawnParticles(m.x, m.y, '#29b6f6', 6);
                }
            });
        });
        bullets = bullets.filter(b => b.life > 0 && b.x > -10 && b.x < W + 10 && b.y > -10 && b.y < H + 10);

        // Remove dead monsters
        let before = monsters.length;
        monsters = monsters.filter(m => m.hp > 0);
        let kills = before - monsters.length;
        if (kills > 0) {
            defeated += kills; score += kills * 10; updateHUD();
        }

        // Next round
        if (monsters.length === 0 && !modalOpen) {
            round++;
            spawnMonsters(Math.min(2 + round, 6));
            genDecorations();
            updateHUD();
        }

        // Particles
        particles.forEach(p => { p.x += p.dx; p.y += p.dy; p.life -= 0.025; p.r *= 0.97; });
        particles = particles.filter(p => p.life > 0);
    }

    function spawnParticles(x, y, color, n) {
        for (let i = 0; i < n; i++) {
            let angle = Math.random() * Math.PI * 2;
            let speed = 1 + Math.random() * 2;
            particles.push({ x, y, dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed, r: 3 + Math.random() * 3, life: 1, color });
        }
    }

    function draw() {
        drawBackground();
        particles.forEach(drawParticle);
        monsters.forEach(drawMonster);
        bullets.forEach(drawBullet);
        drawPlayer();
    }

    function loop() {
        update(); draw();
        if (running) requestAnimationFrame(loop);
    }

    /* Modal */
    function openModal(m) {
        modalOpen = true; currentMonster = m;
        let q = genQuestion();
        currentMonster._question = q;
        document.getElementById('sg-modal-story').textContent = q.story;
        document.getElementById('sg-modal-equation').textContent = q.eq;
        document.getElementById('sg-modal-input').value = '';
        document.getElementById('sg-modal-feedback').textContent = '';
        document.getElementById('sg-modal-feedback').className = '';
        document.getElementById('sg-modal').style.display = 'flex';
        setTimeout(() => document.getElementById('sg-modal-input').focus(), 100);
    }

    function closeModal() {
        document.getElementById('sg-modal').style.display = 'none';
        modalOpen = false; currentMonster = null;
    }

    /* Check answer — exposed globally */
    window.sgCheckAnswer = function () {
        if (!currentMonster) return;
        let val = parseInt(document.getElementById('sg-modal-input').value);
        let q = currentMonster._question;
        let fb = document.getElementById('sg-modal-feedback');
        if (isNaN(val)) { fb.textContent = 'Please enter a number!'; fb.className = 'sg-fb-wrong'; return; }
        if (val === q.answer) {
            fb.textContent = `✅ Correct! Firing ${q.answer} water bullet${q.answer > 1 ? 's' : ''}!`;
            fb.className = 'sg-fb-correct';
            score += 5; updateHUD();
            // Fire bullets toward monster
            let m = currentMonster;
            fireBullets(m, q.answer);
            setTimeout(closeModal, 900);
        } else {
            fb.textContent = `❌ Wrong! The answer was ${q.answer}. You lost a life!`;
            fb.className = 'sg-fb-wrong';
            lives--; updateHUD();
            // Push player away
            player.x = Math.max(40, Math.min(W - 40, player.x + (Math.random() - .5) * 120));
            player.y = Math.max(40, Math.min(H - 40, player.y + (Math.random() - .5) * 120));
            setTimeout(() => {
                closeModal();
                if (lives <= 0) gameOver();
            }, 1200);
        }
    };

    function fireBullets(m, count) {
        let angle = Math.atan2(m.y - player.y, m.x - player.x);
        for (let i = 0; i < count; i++) {
            let spread = (i - count / 2) * 0.15;
            bullets.push({ x: player.x, y: player.y, dx: Math.cos(angle + spread), dy: Math.sin(angle + spread), life: 80 });
        }
        m.hp = 0; // monster will be removed on next update
        spawnParticles(m.x, m.y, '#e040fb', 10);
    }

    function gameOver() {
        running = false;
        document.getElementById('sg-final-score').textContent = score;
        document.getElementById('sg-final-defeated').textContent = defeated;
        document.getElementById('sg-gameover').style.display = 'flex';
    }

    /* Start */
    window.sgStart = function () {
        document.getElementById('sg-overlay').style.display = 'none';
        document.getElementById('sg-gameover').style.display = 'none';
        initGame(); running = true; loop();
    };

    /* D-Pad controls */
    window.sgSetDir = function (d) { keys[d] = true; };
    window.sgClearDir = function (d) { keys[d] = false; };

    /* Keyboard */
    document.addEventListener('keydown', e => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault(); keys[e.key] = true;
        }
        if (e.key === 'Enter' && modalOpen) sgCheckAnswer();
    });
    document.addEventListener('keyup', e => { keys[e.key] = false; });

    /* Responsive canvas */
    function resizeCanvas() {
        const wrap = document.getElementById('sg-canvas-wrap');
        if (!wrap) return;
        const w = wrap.clientWidth;
        cvs.style.width = w + 'px';
        cvs.style.height = (w * H / W) + 'px';
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
})();