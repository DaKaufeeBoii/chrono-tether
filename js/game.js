/**
 * CHRONO TETHER: LAST RECORD OF THE NOMOS
 * Main Game Controller, Input Handlers, Game Loop & Logic
 */

class ChronoGame {
    constructor() {
        this.engine = new GameEngine('gameCanvas');
        this.levelManager = new LevelManager();
        this.player = new Player(200, 200);
        this.projectiles = [];

        // Game State
        this.state = 'MENU'; // 'MENU', 'PLAYING', 'DIALOGUE', 'PAUSED', 'GAMEOVER', 'VICTORY'
        this.lastTime = performance.now();
        
        // Input tracking
        this.input = {
            keys: {},
            mouseX: 0,
            mouseY: 0,
            isMouseDown: false,
            mouseButton: -1
        };

        // Phase Shift cooldown
        this.phaseCooldown = 0;
        this.phaseMaxCooldown = 0.3;

        // Interactive focus
        this.nearbyTerminal = null;
        this.hasShownLockedGateHint = false;

        // Mission Stats
        this.stats = {
            startTime: 0,
            elapsedSeconds: 0,
            phaseShifts: 0,
            enemiesKilled: 0
        };

        this.initDomElements();
        this.initInputs();
        this.levelManager.loadSector(1, this.player);

        // Start render loop
        requestAnimationFrame((t) => this.loop(t));
    }

    initDomElements() {
        this.hpBar = document.getElementById('hpBar');
        this.hpVal = document.getElementById('hpVal');
        this.energyBar = document.getElementById('energyBar');
        this.energyVal = document.getElementById('energyVal');
        this.timelineBadge = document.getElementById('timelineBadge');
        this.objectiveText = document.getElementById('objectiveText');
        this.bossContainer = document.getElementById('bossHealthContainer');
        this.bossHpFill = document.getElementById('bossHpFill');

        // Dialogue DOM
        this.dialogueBox = document.getElementById('dialogueBox');
        this.dialogueSender = document.getElementById('dialogueSender');
        this.dialogueBody = document.getElementById('dialogueBody');

        // Screen Modals
        this.startScreen = document.getElementById('startScreen');
        this.pauseScreen = document.getElementById('pauseScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.victoryScreen = document.getElementById('victoryScreen');

        // Audio Button
        this.audioBtn = document.getElementById('audioToggleBtn');
        this.audioBtn.addEventListener('click', () => {
            const muted = window.AudioEngine.toggleMute();
            this.audioBtn.innerText = muted ? "🔇 AUDIO: MUTED" : "🔊 AUDIO: ON";
            this.audioBtn.style.color = muted ? "#ff0055" : "#00f0ff";
        });

        // Modal Action Buttons
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartSector());
        document.getElementById('retryBtn').addEventListener('click', () => this.restartSector());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.startGame());

        // Dialogue Box Click advances text
        this.dialogueBox.addEventListener('click', () => {
            if (this.state === 'DIALOGUE') {
                window.DialogueSystem.advance();
            }
        });
    }

    initInputs() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.input.keys[e.code] = true;

            // Unlock AudioContext on first user interaction
            window.AudioEngine.init();
            window.AudioEngine.resume();

            // Dialogue Advance
            if (this.state === 'DIALOGUE') {
                if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') {
                    e.preventDefault();
                    window.DialogueSystem.advance();
                    return;
                }
            }

            // In-Game Shortcuts
            if (this.state === 'PLAYING') {
                if (e.code === 'Space') {
                    e.preventDefault();
                    this.executePhaseShift();
                } else if (e.code === 'KeyE') {
                    this.handleInteract();
                } else if (e.code === 'Escape') {
                    this.pauseGame();
                }
            } else if (this.state === 'PAUSED' && e.code === 'Escape') {
                this.resumeGame();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.input.keys[e.code] = false;
        });

        // Mouse
        window.addEventListener('mousemove', (e) => {
            this.input.mouseX = e.clientX;
            this.input.mouseY = e.clientY;
        });

        window.addEventListener('mousedown', (e) => {
            window.AudioEngine.init();
            window.AudioEngine.resume();

            if (e.button === 0) { // Left click
                this.input.isMouseDown = true;
                if (this.state === 'PLAYING') {
                    this.player.isCharging = true;
                }
            } else if (e.button === 2) { // Right click = Phase Shift!
                e.preventDefault();
                if (this.state === 'PLAYING') {
                    this.executePhaseShift();
                }
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.input.isMouseDown = false;
                if (this.state === 'PLAYING' && this.player.isCharging) {
                    this.firePlayerWeapon();
                }
            }
        });

        // Prevent context menu on right click
        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    startGame() {
        this.startScreen.style.display = 'none';
        this.gameOverScreen.style.display = 'none';
        this.victoryScreen.style.display = 'none';
        this.pauseScreen.style.display = 'none';

        this.stats.startTime = performance.now();
        this.stats.phaseShifts = 0;
        this.stats.enemiesKilled = 0;

        this.player = new Player(220, 900);
        this.projectiles = [];
        this.levelManager.loadSector(1, this.player);
        this.state = 'PLAYING';

        window.AudioEngine.init();
        window.AudioEngine.setMusicMode('explore');
        window.AudioEngine.setTimeline('past');

        // Trigger opening intro cutscene
        setTimeout(() => {
            this.playCutscene('intro');
        }, 400);
    }

    pauseGame() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            this.pauseScreen.style.display = 'flex';
        }
    }

    resumeGame() {
        if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.pauseScreen.style.display = 'none';
        }
    }

    restartSector() {
        this.pauseScreen.style.display = 'none';
        this.gameOverScreen.style.display = 'none';
        this.projectiles = [];
        this.levelManager.loadSector(this.levelManager.currentSector, this.player);
        this.player.hp = this.player.maxHp;
        this.player.energy = this.player.maxEnergy;
        this.state = 'PLAYING';
    }

    // ==========================================
    // PHASE SHIFT CORE MECHANIC
    // ==========================================
    executePhaseShift() {
        if (this.phaseCooldown > 0) return;
        this.phaseCooldown = this.phaseMaxCooldown;

        const nextTimeline = (this.player.currentTimeline === 'past') ? 'future' : 'past';
        this.player.currentTimeline = nextTimeline;
        this.stats.phaseShifts++;

        // Trigger Engine and Audio effects
        this.engine.setTimeline(nextTimeline, this.player.x, this.player.y);
        window.AudioEngine.setTimeline(nextTimeline);
        window.AudioEngine.playPhaseShift(nextTimeline === 'past');

        // Text banner
        const text = (nextTimeline === 'past') ? "PHASE: T-0 [PRISTINE PAST]" : "PHASE: T+60 [RUINED VOID]";
        const color = (nextTimeline === 'past') ? '#00f0ff' : '#d900ff';
        this.engine.addFloatingText(text, this.player.x, this.player.y - 35, color, 16);

        // Update badge
        this.timelineBadge.innerText = (nextTimeline === 'past') ? "T-0 : PRISTINE PAST" : "T+60 : RUINED VOID";
        this.timelineBadge.className = (nextTimeline === 'past') ? "timeline-past" : "timeline-future";
    }

    firePlayerWeapon() {
        const isCharged = (this.player.chargeTimer >= this.player.chargeMax);
        this.player.isCharging = false;
        this.player.chargeTimer = 0;

        if (this.player.shootCooldown > 0) return;
        this.player.shootCooldown = this.player.fireRate;

        // Charged shot costs 20 energy
        if (isCharged && this.player.energy >= 20) {
            this.player.energy -= 20;
            const speed = 750;
            this.projectiles.push(new Projectile(this.player.x, this.player.y, Math.cos(this.player.angle) * speed, Math.sin(this.player.angle) * speed, {
                isPlayer: true,
                isCharged: true,
                damage: 65,
                timeline: 'both', // Pierces both timelines!
                color: '#ffffff',
                radius: 8,
                life: 1.2
            }));
            window.AudioEngine.playBlaster(true);
            this.engine.addTrauma(0.3);
            this.engine.spawnBurst(this.player.x, this.player.y, '#00f0ff', 12, 120);
        } else {
            // Regular shot
            const speed = 620;
            this.projectiles.push(new Projectile(this.player.x, this.player.y, Math.cos(this.player.angle) * speed, Math.sin(this.player.angle) * speed, {
                isPlayer: true,
                isCharged: false,
                damage: 22,
                timeline: this.player.currentTimeline,
                color: this.player.currentTimeline === 'past' ? '#00f0ff' : '#d900ff',
                radius: 4,
                life: 1.0
            }));
            window.AudioEngine.playBlaster(false);
        }
    }

    handleInteract() {
        // Check nearby terminals
        if (this.nearbyTerminal) {
            const log = STORY_DATA.terminals[this.nearbyTerminal.id];
            if (log) {
                this.nearbyTerminal.isRead = true;
                this.playLog(log);
                window.AudioEngine.playTerminal();
            }
        }
    }

    playLog(terminalLog) {
        this.state = 'DIALOGUE';
        const lines = terminalLog.lines.map(line => ({
            sender: terminalLog.sender,
            text: line
        }));
        window.DialogueSystem.start(lines, () => {
            this.state = 'PLAYING';
        });
    }

    playCutscene(key, onComplete = null) {
        const script = STORY_DATA.cutscenes[key];
        if (!script) return;
        this.state = 'DIALOGUE';
        window.DialogueSystem.start(script, () => {
            this.state = 'PLAYING';
            if (onComplete) onComplete();
        });
    }

    // ==========================================
    // MAIN LOOP
    // ==========================================
    loop(currentTime) {
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        if (this.state === 'PLAYING') {
            this.update(dt);
        } else if (this.state === 'DIALOGUE') {
            window.DialogueSystem.update(dt);
        }

        // Render everything
        this.render();

        // Update HTML HUD
        this.updateHUD();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        if (this.phaseCooldown > 0) this.phaseCooldown -= dt;

        // Weapon charge accumulation
        if (this.player.isCharging) {
            this.player.chargeTimer = Math.min(this.player.chargeMax, this.player.chargeTimer + dt);
            if (this.player.chargeTimer >= this.player.chargeMax && Math.random() < 0.3) {
                this.engine.spawnBurst(this.player.x, this.player.y, '#ffffff', 2, 40);
            }
        }

        // Update player
        this.player.update(dt, this.input, this.engine, this.levelManager);

        // Auto-fire if mouse held and charged
        if (this.input.isMouseDown && !this.player.isCharging && this.player.shootCooldown <= 0) {
            this.firePlayerWeapon();
        }

        // Update engine camera & particles
        const mouseWorld = this.engine.screenToWorld(this.input.mouseX, this.input.mouseY);
        this.engine.update(dt, this.player, mouseWorld);

        // Update Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            const alive = proj.update(dt, this.engine, this.levelManager);
            if (!alive) {
                this.projectiles.splice(i, 1);
                continue;
            }

            // Player projectile collisions vs enemies / boss
            if (proj.isPlayer) {
                // Enemies
                for (let j = this.levelManager.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.levelManager.enemies[j];
                    // Collide if in same timeline or projectile penetrates both
                    if (proj.timeline === 'both' || proj.timeline === enemy.timeline) {
                        const dist = Math.hypot(enemy.x - proj.x, enemy.y - proj.y);
                        if (dist < enemy.radius + proj.radius) {
                            const dead = enemy.takeDamage(proj.damage, this.engine);
                            if (dead) {
                                this.levelManager.enemies.splice(j, 1);
                                this.stats.enemiesKilled++;
                            }
                            if (!proj.isCharged) {
                                this.projectiles.splice(i, 1);
                                break;
                            }
                        }
                    }
                }

                // Boss
                if (this.levelManager.boss) {
                    const boss = this.levelManager.boss;
                    const dist = Math.hypot(boss.x - proj.x, boss.y - proj.y);
                    if (dist < boss.radius + proj.radius) {
                        const bossDead = boss.takeDamage(proj.damage, this.engine);
                        if (bossDead) {
                            this.handleBossDefeat();
                        }
                        if (!proj.isCharged) {
                            this.projectiles.splice(i, 1);
                            continue;
                        }
                    }
                }
            } else {
                // Hostile projectile collisions vs Player
                // If projectile is from the OTHER timeline, it phases harmlessly through!
                if (proj.timeline === 'both' || proj.timeline === this.player.currentTimeline) {
                    const dist = Math.hypot(this.player.x - proj.x, this.player.y - proj.y);
                    if (dist < this.player.radius + proj.radius) {
                        const hit = this.player.takeDamage(proj.damage, this.engine);
                        if (hit) {
                            this.projectiles.splice(i, 1);
                            if (this.player.hp <= 0) {
                                this.handleGameOver();
                            }
                            continue;
                        }
                    }
                } else {
                    // Timeline phase-dodge feedback!
                    const dist = Math.hypot(this.player.x - proj.x, this.player.y - proj.y);
                    if (dist < this.player.radius + 18) {
                        this.engine.addFloatingText("PHASE DODGE!", this.player.x, this.player.y - 25, '#00ffaa', 12);
                    }
                }
            }
        }

        // Update Enemies
        for (let i = 0; i < this.levelManager.enemies.length; i++) {
            this.levelManager.enemies[i].update(dt, this.player, this.engine, this.levelManager, this.projectiles);
        }

        // Update Boss
        if (this.levelManager.boss) {
            this.levelManager.boss.update(dt, this.player, this.engine, this.levelManager, this.projectiles);
        }

        // Hazard damage check
        this.levelManager.hazards.forEach(h => {
            if (h.timeline === this.player.currentTimeline) {
                // Player inside hazard box
                if (this.player.x >= h.x && this.player.x <= h.x + h.w &&
                    this.player.y >= h.y && this.player.y <= h.y + h.h) {
                    this.player.takeDamage(h.damage * dt, this.engine, true);
                    if (this.player.hp <= 0) this.handleGameOver();
                }
            }
        });

        // Pickups check
        for (let i = this.levelManager.pickups.length - 1; i >= 0; i--) {
            const p = this.levelManager.pickups[i];
            const dist = Math.hypot(this.player.x - p.x, this.player.y - p.y);
            if (dist < this.player.radius + p.radius) {
                if (p.type === 'health') {
                    this.player.heal(35, this.engine);
                } else {
                    this.player.energy = this.player.maxEnergy;
                    this.engine.addFloatingText("+MAX CHRONO", this.player.x, this.player.y - 20, '#00f0ff', 16);
                    window.AudioEngine.playPickup();
                }
                this.levelManager.pickups.splice(i, 1);
            }
        }

        // Chrono Pylons overload check
        this.levelManager.pylons.forEach(pylon => {
            const dist = Math.hypot(this.player.x - pylon.x, this.player.y - pylon.y);
            if (dist < this.player.radius + pylon.radius + 15) {
                if (!pylon.overloaded && this.player.currentTimeline === pylon.timeline) {
                    pylon.overload(this.engine);
                    this.checkPylonProgression();
                }
            }
        });

        // Terminals proximity check
        this.nearbyTerminal = null;
        this.levelManager.terminals.forEach(term => {
            const dist = Math.hypot(this.player.x - term.x, this.player.y - term.y);
            if (dist < this.player.radius + term.radius + 10 && this.player.currentTimeline === term.timeline) {
                this.nearbyTerminal = term;
            }
        });

        // Exit Portal check
        const exit = this.levelManager.exitPortal;
        if (exit && exit.active) {
            const dist = Math.hypot(this.player.x - exit.x, this.player.y - exit.y);
            if (dist < this.player.radius + exit.radius) {
                this.advanceToNextSector();
            }
        }
    }

    checkPylonProgression() {
        const sector = this.levelManager.currentSector;
        if (sector === 2) {
            const allOverloaded = this.levelManager.pylons.every(p => p.overloaded);
            if (allOverloaded && this.levelManager.exitPortal) {
                this.levelManager.exitPortal.active = true;
                this.levelManager.objectiveText = "Singularity Reactor Airlock is open! Proceed to the Warp Lift.";
                this.levelManager.objectiveTarget = { x: this.levelManager.exitPortal.x, y: this.levelManager.exitPortal.y };
                this.engine.addFloatingText("SECTOR 3 AIRLOCK OPEN!", this.player.x, this.player.y - 40, '#00ffaa', 20);
                window.AudioEngine.playAlarm();
            }
        } else if (sector === 3 && this.levelManager.boss) {
            const overloadedCount = this.levelManager.pylons.filter(p => p.overloaded).length;
            if (overloadedCount >= 4 && this.levelManager.boss.shieldActive) {
                this.levelManager.boss.shieldActive = false;
                this.engine.addFloatingText("BOSS SHIELD SHATTERED! ATTACK THE CORE!", this.player.x, this.player.y - 50, '#ff0055', 20);
                this.engine.addTrauma(0.6);
                window.AudioEngine.playBossRoar();
            }
        }
    }

    advanceToNextSector() {
        const nextSector = this.levelManager.currentSector + 1;
        if (nextSector <= 3) {
            this.engine.spawnBurst(this.player.x, this.player.y, '#00ffaa', 30, 250);
            window.AudioEngine.playTerminal();
            this.levelManager.loadSector(nextSector, this.player);
            this.projectiles = [];

            if (nextSector === 3) {
                setTimeout(() => {
                    this.playCutscene('boss_intro');
                }, 500);
            }
        }
    }

    handleBossDefeat() {
        this.state = 'DIALOGUE';
        this.levelManager.boss = null;
        this.engine.spawnBurst(1350, 1100, '#ffffff', 80, 400);

        this.playCutscene('boss_defeat', () => {
            this.showVictoryScreen();
        });
    }

    handleGameOver() {
        this.state = 'GAMEOVER';
        this.gameOverScreen.style.display = 'flex';
    }

    showVictoryScreen() {
        this.state = 'VICTORY';
        const totalSec = Math.round((performance.now() - this.stats.startTime) / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        document.getElementById('statTime').innerText = timeStr;
        document.getElementById('statShifts').innerText = this.stats.phaseShifts;
        document.getElementById('statEnemies').innerText = this.stats.enemiesKilled;

        let rank = "B-RANK";
        if (totalSec < 300 && this.stats.phaseShifts >= 12) rank = "S-RANK";
        else if (totalSec < 450) rank = "A-RANK";
        document.getElementById('statRank').innerText = rank;

        this.victoryScreen.style.display = 'flex';
    }

    // ==========================================
    // RENDER PIPELINE
    // ==========================================
    render() {
        const ctx = this.engine.ctx;
        this.engine.beginFrame();

        // 1. Dual-Timeline Background Grid
        this.engine.renderBackground(this.levelManager);

        // 2. Level Geometry & Hazards
        this.levelManager.render(ctx, this.player.currentTimeline);

        // 3. Interactive Objects
        this.levelManager.terminals.forEach(t => t.render(ctx, this.player.currentTimeline));
        this.levelManager.pylons.forEach(p => p.render(ctx, this.player.currentTimeline));
        this.levelManager.pickups.forEach(p => p.render(ctx));

        // 4. Enemies & Boss
        this.levelManager.enemies.forEach(e => e.render(ctx, this.player.currentTimeline));
        if (this.levelManager.boss) {
            this.levelManager.boss.render(ctx);
        }

        // 5. Projectiles
        this.projectiles.forEach(p => p.render(ctx));

        // 6. Player
        this.player.render(ctx);

        // Interactive Prompt when standing near a terminal
        if (this.nearbyTerminal) {
            ctx.save();
            ctx.fillStyle = 'rgba(4, 16, 28, 0.88)';
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect 
                ? ctx.roundRect(this.nearbyTerminal.x - 50, this.nearbyTerminal.y - 42, 100, 24, 4)
                : ctx.rect(this.nearbyTerminal.x - 50, this.nearbyTerminal.y - 42, 100, 24);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 6;
            ctx.fillText('[E] ACCESS LOG', this.nearbyTerminal.x, this.nearbyTerminal.y - 26);
            ctx.restore();
        }

        // 7. Phase Ripple Shockwaves & Particles
        this.engine.renderPhaseRipples();
        this.engine.renderParticles();
        this.engine.renderFloatingText();

        // 8. In-Game Waypoint Compass Arrow
        this.renderWaypointArrow(ctx);

        // 9. End frame & post-processing
        this.engine.endFrame(this.player);
    }

    renderWaypointArrow(ctx) {
        if (!this.levelManager.objectiveTarget) return;
        const target = this.levelManager.objectiveTarget;
        const angle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
        const dist = Math.hypot(target.y - this.player.y, target.x - this.player.x);

        if (dist > 140) {
            ctx.save();
            ctx.translate(this.player.x + Math.cos(angle) * 38, this.player.y + Math.sin(angle) * 38);
            ctx.rotate(angle);
            ctx.fillStyle = '#00ffaa';
            ctx.shadowColor = '#00ffaa';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(-6, -5);
            ctx.lineTo(-3, 0);
            ctx.lineTo(-6, 5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    updateHUD() {
        // Player HP & Energy
        const hpPct = Math.max(0, Math.min(100, (this.player.hp / this.player.maxHp) * 100));
        const energyPct = Math.max(0, Math.min(100, (this.player.energy / this.player.maxEnergy) * 100));
        this.hpBar.style.width = `${hpPct}%`;
        this.hpVal.innerText = Math.round(this.player.hp);
        this.energyBar.style.width = `${energyPct}%`;
        this.energyVal.innerText = Math.round(this.player.energy);

        // Objective text
        this.objectiveText.innerText = this.levelManager.objectiveText;

        // Boss Bar (Sector 3)
        if (this.levelManager.boss) {
            this.bossContainer.style.display = 'flex';
            const bossPct = (this.levelManager.boss.hp / this.levelManager.boss.maxHp) * 100;
            this.bossHpFill.style.width = `${Math.max(0, bossPct)}%`;
        } else {
            this.bossContainer.style.display = 'none';
        }

        // Dialogue Box
        if (this.state === 'DIALOGUE') {
            this.dialogueBox.style.display = 'block';
            this.dialogueSender.innerText = window.DialogueSystem.sender;
            this.dialogueBody.innerText = window.DialogueSystem.displayedText;
        } else {
            this.dialogueBox.style.display = 'none';
        }
    }
}

// Instantiate on window load
window.addEventListener('DOMContentLoaded', () => {
    window.GameInstance = new ChronoGame();
});
