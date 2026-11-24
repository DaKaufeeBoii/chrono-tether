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
        const continueBtn = document.getElementById('continueBtn');
        if (continueBtn) {
            if (window.SaveSystem && window.SaveSystem.hasSave()) {
                continueBtn.style.display = 'inline-block';
            }
            continueBtn.addEventListener('click', () => this.continueGame());
        }
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

        // Minimap Canvas Context
        this.minimapCanvas = document.getElementById('minimapCanvas');
        this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

        // Map Buttons
        const mapToggleBtn = document.getElementById('mapToggleBtn');
        if (mapToggleBtn) mapToggleBtn.addEventListener('click', () => window.MapSystem.toggleMap(this));
        const closeMapBtn = document.getElementById('closeMapBtn');
        if (closeMapBtn) closeMapBtn.addEventListener('click', () => window.MapSystem.toggleMap(this));

        // Deck Tabs
        document.querySelectorAll('.deck-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.deck-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                window.MapSystem.activeDeckTab = parseInt(tab.dataset.deck);
                window.MapSystem.renderFullscreenMap(this);
            });
        });

        // Ability Tray Elements
        this.slotGrapple = document.getElementById('abilityGrapple');
        this.slotGrenade = document.getElementById('abilityGrenade');
        this.slotGrenadeCount = document.getElementById('slotGrenadeCount');
        this.slotPortal = document.getElementById('abilityPortal');
        this.slotVisor = document.getElementById('abilityVisor');
        this.slotDashName = document.getElementById('slotDashName');
    }

    initInputs() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.input.keys[e.code] = true;

            // Unlock AudioContext on first user interaction
            window.AudioEngine.init();
            window.AudioEngine.resume();

            // Map Toggle (M or Tab)
            if (e.code === 'KeyM' || e.code === 'Tab') {
                e.preventDefault();
                window.MapSystem.toggleMap(this);
                return;
            }

            // Close Map with Escape
            if (window.MapSystem.isOpen && e.code === 'Escape') {
                e.preventDefault();
                window.MapSystem.toggleMap(this);
                return;
            }

            // Dialogue Advance
            if (this.state === 'DIALOGUE') {
                if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') {
                    e.preventDefault();
                    window.DialogueSystem.advance();
                    return;
                }
            }

            // In-Game Shortcuts & Ability Hotkeys
            if (this.state === 'PLAYING') {
                if (e.code === 'Space') {
                    e.preventDefault();
                    this.executePhaseShift();
                } else if (e.code === 'KeyE') {
                    this.handleInteract();
                } else if (e.code === 'KeyQ') {
                    this.fireGrenade();
                } else if (e.code === 'KeyF') {
                    this.fireGrapple();
                } else if (e.code === 'KeyR') {
                    this.firePortal();
                } else if (e.code === 'KeyV') {
                    this.toggleVisor();
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
        this.stats.elapsedSeconds = 0;
        this.stats.phaseShifts = 0;
        this.stats.enemiesKilled = 0;
        this.bossDefeated = false;

        this.player = new Player(450, 2250);
        this.projectiles = [];
        this.levelManager.loadDeck(1, this.player);
        this.state = 'PLAYING';

        window.AudioEngine.init();
        window.AudioEngine.setMusicMode('exploration');
        window.AudioEngine.setTimeline('past');

        // Trigger opening intro cutscene
        setTimeout(() => {
            this.playCutscene('intro');
        }, 400);
    }

    continueGame() {
        this.startScreen.style.display = 'none';
        this.gameOverScreen.style.display = 'none';
        this.victoryScreen.style.display = 'none';
        this.pauseScreen.style.display = 'none';

        this.player = new Player(450, 2250);
        this.projectiles = [];
        this.state = 'PLAYING';

        window.AudioEngine.init();
        window.AudioEngine.setMusicMode('exploration');

        const loaded = window.SaveSystem ? window.SaveSystem.loadGame(this) : false;
        if (!loaded) {
            this.levelManager.loadDeck(1, this.player);
        }
        window.AudioEngine.setTimeline(this.player.currentTimeline || 'past');
        this.engine.setTimeline(this.player.currentTimeline || 'past', this.player.x, this.player.y);
        this.timelineBadge.innerText = (this.player.currentTimeline === 'past') ? "T-0 : PRISTINE PAST" : "T+60 : RUINED VOID";
        this.timelineBadge.className = (this.player.currentTimeline === 'past') ? "timeline-past" : "timeline-future";
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
        let loaded = false;
        if (window.SaveSystem && window.SaveSystem.hasSave()) {
            loaded = window.SaveSystem.loadGame(this);
        }
        if (!loaded) {
            this.levelManager.loadDeck(this.levelManager.currentDeck || 1, this.player);
            this.player.hp = this.player.maxHp;
            this.player.energy = this.player.maxEnergy;
            this.player.currentTimeline = 'past';
        }
        this.engine.setTimeline(this.player.currentTimeline, this.player.x, this.player.y);
        window.AudioEngine.setTimeline(this.player.currentTimeline);
        this.timelineBadge.innerText = (this.player.currentTimeline === 'past') ? "T-0 : PRISTINE PAST" : "T+60 : RUINED VOID";
        this.timelineBadge.className = (this.player.currentTimeline === 'past') ? "timeline-past" : "timeline-future";
        this.state = 'PLAYING';
    }

    // ==========================================
    // PHASE SHIFT CORE MECHANIC
    // ==========================================
    executePhaseShift() {
        if (this.phaseCooldown > 0) return;

        const nextTimeline = (this.player.currentTimeline === 'past') ? 'future' : 'past';

        // Collision Check: Prevent phasing into solid matter/bulkheads!
        if (this.levelManager.checkWallCollision(this.player.x, this.player.y, this.player.radius, nextTimeline)) {
            this.engine.addFloatingText("COLLISION HAZARD! CANNOT PHASE INTO SOLID BULKHEAD!", this.player.x, this.player.y - 35, '#ff0055', 14);
            this.engine.spawnBurst(this.player.x, this.player.y, '#ff0055', 8, 70);
            window.AudioEngine.playAlarm();
            this.phaseCooldown = 0.25;
            return;
        }

        this.phaseCooldown = this.phaseMaxCooldown;
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
            // Weapon Tiers (Metroidvania Upgrades)
            const tier = this.player.weaponTier || 1;
            const timeline = this.player.currentTimeline;
            const col = timeline === 'past' ? '#00f0ff' : '#d900ff';

            if (tier === 1) {
                // Tier 1: Kinetic Plasma Blaster
                this.projectiles.push(new Projectile(this.player.x, this.player.y, Math.cos(this.player.angle) * 620, Math.sin(this.player.angle) * 620, {
                    isPlayer: true,
                    damage: 22,
                    timeline: timeline,
                    color: col,
                    radius: 4,
                    life: 1.0
                }));
                window.AudioEngine.playBlaster(false);
            } else if (tier === 2) {
                // Tier 2: Chrono Scatter Tri-Beam
                [-0.14, 0, 0.14].forEach(off => {
                    const a = this.player.angle + off;
                    this.projectiles.push(new Projectile(this.player.x, this.player.y, Math.cos(a) * 640, Math.sin(a) * 640, {
                        isPlayer: true,
                        damage: 18,
                        timeline: timeline,
                        color: '#ffff00',
                        radius: 4.5,
                        life: 1.0
                    }));
                });
                window.AudioEngine.playBlaster(false);
            } else if (tier === 3) {
                // Tier 3: Tachyon Continuous Railgun
                this.projectiles.push(new Projectile(this.player.x, this.player.y, Math.cos(this.player.angle) * 920, Math.sin(this.player.angle) * 920, {
                    isPlayer: true,
                    isCharged: true,
                    damage: 55,
                    timeline: 'both',
                    color: '#ff0055',
                    radius: 6,
                    life: 1.1
                }));
                window.AudioEngine.playBlaster(true);
            } else {
                // Tier 4: Void Singularity Cannon
                this.projectiles.push(new Projectile(this.player.x, this.player.y, Math.cos(this.player.angle) * 520, Math.sin(this.player.angle) * 520, {
                    isPlayer: true,
                    isCharged: true,
                    damage: 85,
                    timeline: 'both',
                    color: '#d900ff',
                    radius: 9,
                    life: 1.3
                }));
                window.AudioEngine.playBossRoar();
            }
        }
    }

    fireGrenade() {
        if (!this.player.unlockedAbilities.grenade) {
            this.engine.addFloatingText("LOCKED: CHRONAL EMP GRENADE NOT ACQUIRED", this.player.x, this.player.y - 30, '#888888', 12);
            return;
        }
        if (this.player.grenades <= 0) {
            this.engine.addFloatingText("OUT OF EMP GRENADES!", this.player.x, this.player.y - 30, '#ff9900', 14);
            window.AudioEngine.playAlarm();
            return;
        }
        this.player.grenades--;
        const spd = 420;
        const g = new Projectile(this.player.x, this.player.y, Math.cos(this.player.angle) * spd, Math.sin(this.player.angle) * spd, {
            isPlayer: true,
            isGrenade: true,
            damage: 130,
            radius: 8,
            color: '#ff9900',
            life: 0.95
        });
        this.projectiles.push(g);
        window.AudioEngine.playEnemyShot();
        this.engine.addFloatingText("EMP THROWN!", this.player.x, this.player.y - 25, '#ff9900', 14);
    }

    fireGrapple() {
        if (!this.player.unlockedAbilities.grapple) {
            this.engine.addFloatingText("LOCKED: TACHYON TETHER NOT ACQUIRED", this.player.x, this.player.y - 30, '#888888', 12);
            return;
        }
        if (this.player.isGrappling) {
            this.player.isGrappling = false;
            this.player.grappleTarget = null;
            return;
        }

        const nodes = this.levelManager.grappleNodes || [];
        let nearest = null;
        let minDist = 380;
        nodes.forEach(n => {
            if (n.timeline === 'both' || n.timeline === this.player.currentTimeline) {
                const d = Math.hypot(n.x - this.player.x, n.y - this.player.y);
                if (d < minDist) {
                    minDist = d;
                    nearest = n;
                }
            }
        });

        if (nearest) {
            this.player.isGrappling = true;
            this.player.grappleTarget = nearest;
            window.AudioEngine.playDash();
            this.engine.spawnBurst(this.player.x, this.player.y, '#00ffff', 14, 120);
            this.engine.addFloatingText("TETHER LOCKED!", this.player.x, this.player.y - 25, '#00ffff', 14);
        } else {
            this.engine.addFloatingText("NO ANCHOR NODE IN RANGE (380m)", this.player.x, this.player.y - 25, '#888888', 12);
        }
    }

    firePortal() {
        if (!this.player.unlockedAbilities.portals) {
            this.engine.addFloatingText("LOCKED: QUANTUM PORTALS NOT ACQUIRED", this.player.x, this.player.y - 30, '#888888', 12);
            return;
        }
        const mouseWorld = this.engine.screenToWorld(this.input.mouseX, this.input.mouseY);
        if (this.levelManager.checkWallCollision(mouseWorld.x, mouseWorld.y, 20, this.player.currentTimeline)) {
            this.engine.addFloatingText("CANNOT WEAVE WORMHOLE IN SOLID BULKHEAD", mouseWorld.x, mouseWorld.y - 20, '#ff00aa', 12);
            return;
        }
        this.levelManager.spawnPortalPair(this.player.x, this.player.y, mouseWorld.x, mouseWorld.y);
        window.AudioEngine.playPhaseShift(true);
        this.engine.addFloatingText("WORMHOLE WEAVED!", mouseWorld.x, mouseWorld.y - 20, '#00f0ff', 14);
    }

    toggleVisor() {
        if (!this.player.unlockedAbilities.visor) {
            this.engine.addFloatingText("LOCKED: SPECTRAL VISOR NOT ACQUIRED", this.player.x, this.player.y - 30, '#888888', 12);
            return;
        }
        this.player.visorActive = !this.player.visorActive;
        window.AudioEngine.playTerminal();
        this.engine.addFloatingText(this.player.visorActive ? "SPECTRAL VISOR: ONLINE" : "SPECTRAL VISOR: OFFLINE", this.player.x, this.player.y - 30, '#00ffaa', 16);
    }

    handleInteract() {
        // 1. Check nearby save stations
        if (this.nearbySaveStation) {
            this.nearbySaveStation.activate(this);
            return;
        }

        // 2. Check nearby terminals
        if (this.nearbyTerminal) {
            // Check causality seed terminal in Deck 2
            if (this.nearbyTerminal.id === 'term_2_spore_terminal') {
                if (!this.levelManager.causalitySwitches.has('hydro_spore_planted')) {
                    this.levelManager.causalitySwitches.add('hydro_spore_planted');
                    this.engine.spawnBurst(this.nearbyTerminal.x, this.nearbyTerminal.y, '#00ff88', 35, 200);
                    this.engine.addFloatingText("HYDRO-SPORE PLANTED! CAUSALITY ALTERED IN FUTURE!", this.player.x, this.player.y - 45, '#00ff88', 18);
                    window.AudioEngine.playPickup();
                    this.levelManager.loadDeck(2, this.player, this.player.x, this.player.y);
                    if (window.SaveSystem) window.SaveSystem.saveGame(this);
                    return;
                }
            }

            const log = STORY_DATA.terminals[this.nearbyTerminal.id];
            if (log) {
                this.nearbyTerminal.isRead = true;
                this.levelManager.readLogs = this.levelManager.readLogs || new Set();
                this.levelManager.readLogs.add(this.nearbyTerminal.id);
                this.playLog(log);
                window.AudioEngine.playTerminal();
            }
        }
    }

    playLog(terminalLog) {
        this.player.isCharging = false;
        this.state = 'DIALOGUE';
        const lines = terminalLog.lines.map(line => ({
            sender: terminalLog.sender,
            text: line
        }));
        window.DialogueSystem.start(lines, () => {
            this.state = 'PLAYING';
            this.phaseCooldown = 0.2;
        });
    }

    playCutscene(key, onComplete = null) {
        this.player.isCharging = false;
        const script = STORY_DATA.cutscenes[key];
        if (!script) return;
        this.state = 'DIALOGUE';
        window.DialogueSystem.start(script, () => {
            this.state = 'PLAYING';
            this.phaseCooldown = 0.2;
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
            this.stats.elapsedSeconds += dt;
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

        // Poll Gamepad
        this.pollGamepad(dt);

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

        // Update engine camera & particles with level bounds clamping
        const mouseWorld = this.engine.screenToWorld(this.input.mouseX, this.input.mouseY);
        this.engine.update(dt, this.player, mouseWorld, this.levelManager);

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

                // Boss / Mini-Boss
                if (this.levelManager.boss) {
                    const boss = this.levelManager.boss;
                    const dist = Math.hypot(boss.x - proj.x, boss.y - proj.y);
                    if (dist < boss.radius + proj.radius) {
                        const bossDead = boss.takeDamage(proj.damage, this.engine);
                        if (bossDead) {
                            this.handleBossDefeat(boss);
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
            if (h.timeline === this.player.currentTimeline || h.timeline === 'both') {
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

        // Save Stations proximity check
        this.nearbySaveStation = null;
        this.levelManager.saveStations.forEach(save => {
            const dist = Math.hypot(this.player.x - save.x, this.player.y - save.y);
            if (dist < this.player.radius + save.radius + 15) {
                this.nearbySaveStation = save;
            }
        });

        // Upgrades collection check
        for (let i = this.levelManager.upgrades.length - 1; i >= 0; i--) {
            const up = this.levelManager.upgrades[i];
            const dist = Math.hypot(this.player.x - up.x, this.player.y - up.y);
            if (dist < this.player.radius + up.radius) {
                up.collect(this);
                this.levelManager.upgrades.splice(i, 1);
            }
        }

        // Portal Gates check
        this.levelManager.portalGates.forEach(portal => {
            portal.update(dt);
            const dist = Math.hypot(this.player.x - portal.x, this.player.y - portal.y);
            if (dist < this.player.radius + portal.radius) {
                portal.teleport(this.player, this.engine);
            }
        });

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
                this.advanceToDeck(exit.targetDeck, exit.spawnX, exit.spawnY);
            }
        }
    }

    checkPylonProgression() {
        const deck = this.levelManager.currentDeck;
        if (deck === 5 && this.levelManager.boss) {
            const overloadedCount = this.levelManager.pylons.filter(p => p.overloaded).length;
            if (overloadedCount >= 4 && this.levelManager.boss.shieldActive) {
                this.levelManager.boss.shieldActive = false;
                this.engine.addFloatingText("PARADOX NEXUS SHIELD SHATTERED! STRIKE THE CORE!", this.player.x, this.player.y - 50, '#ff0055', 22);
                this.engine.addTrauma(0.7);
                window.AudioEngine.playBossRoar();
            }
        }
    }

    advanceToDeck(targetDeck, spawnX = null, spawnY = null) {
        if (targetDeck >= 1 && targetDeck <= 5) {
            this.engine.spawnBurst(this.player.x, this.player.y, '#00ffaa', 35, 250);
            window.AudioEngine.playTerminal();
            this.levelManager.loadDeck(targetDeck, this.player, spawnX, spawnY);
            this.projectiles = [];
            this.player.currentTimeline = 'past';
            this.engine.setTimeline('past', this.player.x, this.player.y);
            window.AudioEngine.setTimeline('past');
            this.timelineBadge.innerText = "T-0 : PRISTINE PAST";
            this.timelineBadge.className = "timeline-past";

            if (targetDeck === 5) {
                setTimeout(() => {
                    this.playCutscene('boss_intro');
                }, 500);
            }
            if (window.SaveSystem) {
                window.SaveSystem.saveGame(this);
            }
        }
    }

    handleBossDefeat(boss) {
        if (boss && boss.isMiniBoss) {
            this.engine.spawnBurst(boss.x, boss.y, '#ffffff', 60, 300);
            window.AudioEngine.playExplosion(true);
            this.engine.addTrauma(0.7);

            if (boss.deck === 1) {
                this.levelManager.unlockedDoors.add('overseer_defeated');
                this.levelManager.unlockedDoors.add('door_deck1_exit');
                if (this.levelManager.exitPortal) this.levelManager.exitPortal.active = true;
                this.levelManager.upgrades.push(new UpgradeItem(boss.x, boss.y, 'upgrade_weapon_scatter', 'weapon_scatter', 'CHRONO SCATTER TRI-BEAM'));
                this.engine.addFloatingText("OVERSEER DESTROYED // DECK 2 ELEVATOR UNLOCKED!", boss.x, boss.y - 60, '#ffaa00', 20);
                this.levelManager.objectiveText = "Deck 2 Elevator is operational. Proceed to the Hydro-Silos.";
                this.levelManager.objectiveTarget = { x: 6600, y: 2250 };
            } else if (boss.deck === 2) {
                this.levelManager.unlockedDoors.add('chronoflora_defeated');
                this.levelManager.unlockedDoors.add('door_deck2_exit');
                if (this.levelManager.exitPortal) this.levelManager.exitPortal.active = true;
                this.levelManager.upgrades.push(new UpgradeItem(boss.x, boss.y, 'upgrade_energy_1', 'energy_tank', '+25 CHRONO TANK'));
                this.engine.addFloatingText("CHRONO-FLORA ERADICATED // DECK 3 ACCELERATOR UNLOCKED!", boss.x, boss.y - 60, '#00ff88', 20);
                this.levelManager.objectiveText = "Deck 3 Accelerator Gate unlocked! Proceed to Tachyon Grav-Labs.";
                this.levelManager.objectiveTarget = { x: 6600, y: 2250 };
            } else if (boss.deck === 3) {
                this.levelManager.unlockedDoors.add('gravgoliath_defeated');
                this.levelManager.unlockedDoors.add('door_deck3_exit');
                if (this.levelManager.exitPortal) this.levelManager.exitPortal.active = true;
                this.levelManager.upgrades.push(new UpgradeItem(boss.x, boss.y, 'upgrade_weapon_rail', 'weapon_rail', 'TACHYON RAILGUN'));
                this.engine.addFloatingText("GRAV-GOLIATH DESTROYED // DECK 4 BREACH UNLOCKED!", boss.x, boss.y - 60, '#7700ff', 20);
                this.levelManager.objectiveText = "Grav-Goliath destroyed! Proceed through Deck 4 Hull Breach.";
                this.levelManager.objectiveTarget = { x: 6600, y: 2250 };
            }
            this.levelManager.boss = null;
            if (window.SaveSystem) window.SaveSystem.saveGame(this);
            return;
        }

        // Grand Climax Boss: Paradox Nexus (Deck 5)
        if (this.bossDefeated) return;
        this.bossDefeated = true;
        this.state = 'DIALOGUE';
        this.levelManager.boss = null;
        this.projectiles = []; // Clear lingering projectiles
        this.engine.spawnBurst(4200, 2250, '#ffffff', 80, 400);

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
        const totalSec = Math.round(this.stats.elapsedSeconds);
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

        // 2. Level Geometry & Hazards (Spectral Visor reveals hidden cracks)
        this.levelManager.render(ctx, this.player.currentTimeline, this.player.visorActive);

        // 3. Interactive Objects
        this.levelManager.terminals.forEach(t => t.render(ctx, this.player.currentTimeline));
        this.levelManager.pylons.forEach(p => p.render(ctx, this.player.currentTimeline));
        this.levelManager.pickups.forEach(p => p.render(ctx));
        this.levelManager.saveStations.forEach(s => s.render(ctx));
        this.levelManager.grappleNodes.forEach(g => {
            const inRange = (Math.hypot(this.player.x - g.x, this.player.y - g.y) < 380);
            g.render(ctx, this.player.currentTimeline, inRange);
        });
        this.levelManager.portalGates.forEach(p => p.render(ctx));
        this.levelManager.upgrades.forEach(u => u.render(ctx));

        // 4. Enemies & Boss
        this.levelManager.enemies.forEach(e => e.render(ctx, this.player.currentTimeline));
        if (this.levelManager.boss) {
            this.levelManager.boss.render(ctx, this.player.currentTimeline);
        }

        // 5. Projectiles
        this.projectiles.forEach(p => p.render(ctx));

        // 6. Player
        this.player.render(ctx);

        // Interactive Prompt when standing near a save station
        if (this.nearbySaveStation) {
            ctx.save();
            ctx.fillStyle = 'rgba(4, 28, 16, 0.9)';
            ctx.strokeStyle = '#00ffaa';
            ctx.lineWidth = 1.5;
            ctx.fillRect(this.nearbySaveStation.x - 60, this.nearbySaveStation.y - 50, 120, 24);
            ctx.strokeRect(this.nearbySaveStation.x - 60, this.nearbySaveStation.y - 50, 120, 24);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#00ffaa';
            ctx.shadowBlur = 6;
            ctx.fillText('[E] SAVE DATA', this.nearbySaveStation.x, this.nearbySaveStation.y - 34);
            ctx.restore();
        }

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

        // Ability Tray Slot Updates
        if (this.slotDashName) {
            this.slotDashName.innerText = this.player.unlockedAbilities.phaseDash ? "PHASE-DASH" : "DASH";
        }
        if (this.slotGrapple) {
            this.slotGrapple.classList.toggle('active', !!this.player.unlockedAbilities.grapple);
            this.slotGrapple.classList.toggle('locked', !this.player.unlockedAbilities.grapple);
        }
        if (this.slotGrenade) {
            this.slotGrenade.classList.toggle('active', !!this.player.unlockedAbilities.grenade);
            this.slotGrenade.classList.toggle('locked', !this.player.unlockedAbilities.grenade);
            if (this.slotGrenadeCount) {
                this.slotGrenadeCount.innerText = `x${this.player.grenades || 0}`;
            }
        }
        if (this.slotPortal) {
            this.slotPortal.classList.toggle('active', !!this.player.unlockedAbilities.portals);
            this.slotPortal.classList.toggle('locked', !this.player.unlockedAbilities.portals);
        }
        if (this.slotVisor) {
            this.slotVisor.classList.toggle('active', !!this.player.unlockedAbilities.visor);
            this.slotVisor.classList.toggle('locked', !this.player.unlockedAbilities.visor);
            this.slotVisor.style.borderColor = this.player.visorActive ? '#00ffaa' : '';
        }

        // Minimap Render
        if (this.minimapCtx && window.MapSystem) {
            window.MapSystem.renderMinimap(this.minimapCtx, this);
        }

        // Boss Bar
        if (this.levelManager.boss) {
            this.bossContainer.style.display = 'flex';
            const bossPct = (this.levelManager.boss.hp / this.levelManager.boss.maxHp) * 100;
            this.bossHpFill.style.width = `${Math.max(0, bossPct)}%`;
            const nameEl = document.getElementById('bossName');
            if (nameEl && this.levelManager.boss.name) {
                nameEl.innerText = this.levelManager.boss.name.toUpperCase();
            }
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

    // ==========================================
    // GAMEPAD CONTROLLER SUPPORT
    // ==========================================
    pollGamepad(dt) {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        if (!gamepads || !gamepads[0]) return;
        const gp = gamepads[0];
        
        // Left stick movement
        const deadzone = 0.22;
        let lx = gp.axes[0] || 0;
        let ly = gp.axes[1] || 0;
        if (Math.abs(lx) < deadzone) lx = 0;
        if (Math.abs(ly) < deadzone) ly = 0;
        
        if (lx !== 0 || ly !== 0) {
            this.input.keys['KeyW'] = ly < -deadzone;
            this.input.keys['KeyS'] = ly > deadzone;
            this.input.keys['KeyA'] = lx < -deadzone;
            this.input.keys['KeyD'] = lx > deadzone;
        }

        // Right stick aim
        let rx = gp.axes[2] || 0;
        let ry = gp.axes[3] || 0;
        if (Math.abs(rx) > deadzone || Math.abs(ry) > deadzone) {
            const angle = Math.atan2(ry, rx);
            const targetScreen = this.engine.worldToScreen(this.player.x + Math.cos(angle) * 160, this.player.y + Math.sin(angle) * 160);
            this.input.mouseX = targetScreen.x;
            this.input.mouseY = targetScreen.y;
        }

        // Buttons
        // A (Button 0) or Right Trigger (Button 7): Shoot
        const btnShoot = (gp.buttons[0] && gp.buttons[0].pressed) || (gp.buttons[7] && gp.buttons[7].pressed);
        if (btnShoot && !this.input.isMouseDown) {
            this.input.isMouseDown = true;
            this.player.isCharging = true;
        } else if (!btnShoot && this.input.isMouseDown) {
            this.input.isMouseDown = false;
            this.firePlayerWeapon();
        }

        // B (Button 1) or Right Bumper (Button 5): Phase Shift
        if ((gp.buttons[1] && gp.buttons[1].pressed) || (gp.buttons[5] && gp.buttons[5].pressed)) {
            this.executePhaseShift();
        }

        // X (Button 2) or Left Bumper (Button 4): Dash
        this.input.keys['ShiftLeft'] = (gp.buttons[2] && gp.buttons[2].pressed) || (gp.buttons[4] && gp.buttons[4].pressed);

        // Y (Button 3) or D-Pad Up: Interact [E]
        if (gp.buttons[3] && gp.buttons[3].pressed) {
            this.handleInteract();
        }
    }
}

// Instantiate on window load
window.addEventListener('DOMContentLoaded', () => {
    window.GameInstance = new ChronoGame();
});
