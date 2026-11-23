/**
 * CHRONO TETHER: LAST RECORD OF THE NOMOS
 * Entities: Player, Projectiles, Enemies, Boss, and Interactive Objects
 */

// ==========================================
// 1. PLAYER (UNIT-7)
// ==========================================
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 16;
        this.speed = 250;
        
        // Health & Energy
        this.maxHp = 100;
        this.hp = 100;
        this.maxEnergy = 100;
        this.energy = 100;
        this.energyRegen = 22; // per sec

        // Movement & Physics
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.currentTimeline = 'past'; // 'past' or 'future'
        
        // Dash / Blink
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashDuration = 0.18;
        this.dashSpeed = 650;
        this.dashCooldown = 0;
        this.dashMaxCooldown = 0.75;
        this.dashDirX = 0;
        this.dashDirY = 0;
        this.invulnerableTimer = 0;

        // Weapons & Shooting
        this.shootCooldown = 0;
        this.fireRate = 0.18; // sec per shot
        this.chargeTimer = 0;
        this.isCharging = false;
        this.chargeMax = 0.9; // seconds to fully charge
        
        // After-images / Dash trail
        this.afterImages = [];

        // Visual animation
        this.chronalRingAngle = 0;
        this.walkCycle = 0;
        this.thrusterParticlesTimer = 0;
    }

    update(dt, input, engine, level) {
        // Energy Regen
        if (!this.isCharging) {
            this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegen * dt);
        }

        // Timers
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (this.shootCooldown > 0) this.shootCooldown -= dt;
        if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;

        // Aim angle towards mouse
        const mouseWorld = engine.screenToWorld(input.mouseX, input.mouseY);
        this.angle = Math.atan2(mouseWorld.y - this.y, mouseWorld.x - this.x);

        // Chronal Ring rotation
        this.chronalRingAngle += dt * 4.5;

        // ------------------------------------
        // DASH LOGIC
        // ------------------------------------
        if (this.isDashing) {
            this.dashTimer -= dt;
            this.x += this.dashDirX * this.dashSpeed * dt;
            this.y += this.dashDirY * this.dashSpeed * dt;

            // Spawn after-image
            this.afterImages.push({
                x: this.x,
                y: this.y,
                angle: this.angle,
                alpha: 0.6,
                timeline: this.currentTimeline
            });

            // End dash
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }
        } else {
            // Normal Movement
            let moveX = 0;
            let moveY = 0;
            if (input.keys['KeyW'] || input.keys['ArrowUp']) moveY -= 1;
            if (input.keys['KeyS'] || input.keys['ArrowDown']) moveY += 1;
            if (input.keys['KeyA'] || input.keys['ArrowLeft']) moveX -= 1;
            if (input.keys['KeyD'] || input.keys['ArrowRight']) moveX += 1;

            const len = Math.hypot(moveX, moveY);
            if (len > 0) {
                moveX /= len;
                moveY /= len;
                this.vx = moveX * this.speed;
                this.vy = moveY * this.speed;
                this.walkCycle += dt * 10;
            } else {
                this.vx *= 0.75;
                this.vy *= 0.75;
            }

            // Dash Trigger (Shift or Space if not used for phase)
            if ((input.keys['ShiftLeft'] || input.keys['KeyF']) && this.dashCooldown <= 0 && this.energy >= 25) {
                this.dashCooldown = this.dashMaxCooldown;
                this.energy -= 25;
                this.isDashing = true;
                this.dashTimer = this.dashDuration;
                this.invulnerableTimer = this.dashDuration + 0.1;
                
                // Direction of dash is movement dir or aim dir
                if (len > 0) {
                    this.dashDirX = moveX;
                    this.dashDirY = moveY;
                } else {
                    this.dashDirX = Math.cos(this.angle);
                    this.dashDirY = Math.sin(this.angle);
                }
                window.AudioEngine.playDash();
                engine.spawnBurst(this.x, this.y, this.currentTimeline === 'past' ? '#00f0ff' : '#d900ff', 12, 120);
            }

            // Apply movement with wall collisions
            this.moveWithCollision(this.vx * dt, this.vy * dt, level);
        }

        // Clamp inside level bounds
        this.x = Math.max(30, Math.min(level.width - 30, this.x));
        this.y = Math.max(30, Math.min(level.height - 30, this.y));

        // After-images decay
        for (let i = this.afterImages.length - 1; i >= 0; i--) {
            const img = this.afterImages[i];
            img.alpha -= dt * 3.5;
            if (img.alpha <= 0) this.afterImages.splice(i, 1);
        }

        // Thruster sparks
        this.thrusterParticlesTimer += dt;
        if (this.thrusterParticlesTimer > 0.04 && (Math.abs(this.vx) > 10 || Math.abs(this.vy) > 10)) {
            this.thrusterParticlesTimer = 0;
            const oppAngle = this.angle + Math.PI;
            engine.addParticle({
                x: this.x + Math.cos(oppAngle) * 12,
                y: this.y + Math.sin(oppAngle) * 12,
                vx: Math.cos(oppAngle) * (Math.random() * 80 + 40) + (Math.random() - 0.5) * 30,
                vy: Math.sin(oppAngle) * (Math.random() * 80 + 40) + (Math.random() - 0.5) * 30,
                color: this.currentTimeline === 'past' ? '#00f0ff' : '#ff00aa',
                size: Math.random() * 3 + 1,
                life: 0.25
            });
        }
    }

    moveWithCollision(dx, dy, level) {
        // Horizontal step
        const nextX = this.x + dx;
        if (!level.checkWallCollision(nextX, this.y, this.radius, this.currentTimeline)) {
            this.x = nextX;
        }
        // Vertical step
        const nextY = this.y + dy;
        if (!level.checkWallCollision(this.x, nextY, this.radius, this.currentTimeline)) {
            this.y = nextY;
        }
    }

    takeDamage(amount, engine, isPiercing = false) {
        if (this.invulnerableTimer > 0 && !isPiercing) return false;
        
        this.hp = Math.max(0, this.hp - amount);
        this.invulnerableTimer = 0.45; // brief i-frames
        engine.addTrauma(0.5);
        engine.triggerFreeze(2);
        engine.addFloatingText(`-${Math.round(amount)}`, this.x, this.y - 20, '#ff3b3b', 18);
        engine.spawnBurst(this.x, this.y, '#ff0055', 18, 160);
        window.AudioEngine.playHit(false);

        if (this.hp <= 0) {
            window.AudioEngine.playExplosion(true);
        }
        return true;
    }

    heal(amount, engine) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        engine.addFloatingText(`+${Math.round(amount)} HP`, this.x, this.y - 20, '#00ff88', 18);
        engine.spawnBurst(this.x, this.y, '#00ff88', 14, 100);
        window.AudioEngine.playPickup();
    }

    render(ctx) {
        // 1. Draw After-Images
        this.afterImages.forEach(img => {
            ctx.save();
            ctx.globalAlpha = img.alpha * 0.4;
            ctx.translate(img.x, img.y);
            ctx.rotate(img.angle);
            ctx.fillStyle = img.timeline === 'past' ? '#00f0ff' : '#d900ff';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        ctx.save();
        ctx.translate(this.x, this.y);

        // Flash if invulnerable
        if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        const isPast = this.currentTimeline === 'past';
        const primaryColor = isPast ? '#00f0ff' : '#d900ff';
        const coreColor = isPast ? '#ffffff' : '#ff00aa';

        // 2. Chronal Resonance Aura / Ring
        ctx.save();
        ctx.rotate(this.chronalRingAngle);
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 3. Body Rotation to face mouse
        ctx.rotate(this.angle);

        // Aiming laser guide
        ctx.save();
        ctx.strokeStyle = isPast ? 'rgba(0, 240, 255, 0.35)' : 'rgba(255, 0, 150, 0.35)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(160, 0);
        ctx.stroke();
        ctx.restore();

        // Chassis / Armor Shell
        ctx.fillStyle = '#1b222d';
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Sleek futuristic combat drone chassis
        ctx.moveTo(18, 0);
        ctx.lineTo(-12, 14);
        ctx.lineTo(-8, 0);
        ctx.lineTo(-12, -14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Weapon Barrel
        ctx.fillStyle = primaryColor;
        ctx.fillRect(8, -2.5, 12, 5);

        // Glowing Quantum Core
        ctx.fillStyle = coreColor;
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ==========================================
// 2. PROJECTILES
// ==========================================
class Projectile {
    constructor(x, y, vx, vy, config) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = config.radius || 4;
        this.damage = config.damage || 20;
        this.isPlayer = config.isPlayer || false;
        this.isCharged = config.isCharged || false;
        this.timeline = config.timeline || 'past'; // 'past', 'future', or 'both'
        this.color = config.color || (this.timeline === 'past' ? '#00f0ff' : '#d900ff');
        this.life = config.life || 1.8;
        this.maxLife = this.life;
        this.trail = [];
    }

    update(dt, engine, level) {
        this.life -= dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Trail particle
        this.trail.push({ x: this.x, y: this.y, alpha: 0.8 });
        if (this.trail.length > 5) this.trail.shift();

        // Check level boundary
        if (this.x < 0 || this.x > level.width || this.y < 0 || this.y > level.height) {
            return false;
        }

        // Wall collision (unless charged piercing beam)
        if (!this.isCharged && level.checkWallCollision(this.x, this.y, this.radius, this.timeline)) {
            engine.spawnBurst(this.x, this.y, this.color, 6, 80);
            return false;
        }

        return this.life > 0;
    }

    render(ctx) {
        ctx.save();
        // Render trail
        this.trail.forEach(t => {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = t.alpha * 0.4;
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.radius * 0.7, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.globalAlpha = 1.0;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = this.isCharged ? 16 : 8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ==========================================
// 3. ENEMIES
// ==========================================
class Enemy {
    constructor(x, y, type, timeline) {
        this.x = x;
        this.y = y;
        this.type = type; // 'drone', 'turret', 'wraith', 'stalker'
        this.timeline = timeline; // 'past' or 'future'
        this.angle = 0;
        this.shootTimer = Math.random() * 1.5;
        this.state = 'idle';

        switch (type) {
            case 'drone': // Fast security drone in Past
                this.hp = 45;
                this.maxHp = 45;
                this.speed = 135;
                this.radius = 16;
                this.shootInterval = 1.8;
                this.color = '#00e5ff';
                break;
            case 'turret': // Heavy automated defense turret in Past
                this.hp = 120;
                this.maxHp = 120;
                this.speed = 0;
                this.radius = 24;
                this.shootInterval = 2.4;
                this.color = '#ff9900';
                break;
            case 'wraith': // Phase-shifting shadow anomaly in Future
                this.hp = 60;
                this.maxHp = 60;
                this.speed = 160;
                this.radius = 18;
                this.shootInterval = 2.0;
                this.color = '#d900ff';
                break;
            case 'stalker': // Void beast leaping in Future
                this.hp = 90;
                this.maxHp = 90;
                this.speed = 210;
                this.radius = 20;
                this.shootInterval = 1.6;
                this.color = '#ff0055';
                break;
            default:
                this.hp = 50;
                this.maxHp = 50;
                this.speed = 120;
                this.radius = 16;
                this.shootInterval = 2.0;
                this.color = '#00f0ff';
        }
    }

    update(dt, player, engine, level, projectiles) {
        const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
        this.angle = Math.atan2(player.y - this.y, player.x - this.x);

        // Enemies only engage if in the same timeline or within detection
        const sameTimeline = (player.currentTimeline === this.timeline);

        if (sameTimeline && distToPlayer < 700) {
            // Movement behavior
            if (this.speed > 0) {
                // Keep optimal combat range (~180px for drone, ~90px for melee wraith)
                const targetDist = (this.type === 'wraith' || this.type === 'stalker') ? 80 : 190;
                let moveDir = 0;
                if (distToPlayer > targetDist + 30) moveDir = 1;
                else if (distToPlayer < targetDist - 30) moveDir = -0.5;

                const vx = Math.cos(this.angle) * this.speed * moveDir;
                const vy = Math.sin(this.angle) * this.speed * moveDir;

                // Move with collision
                const nextX = this.x + vx * dt;
                const nextY = this.y + vy * dt;
                if (!level.checkWallCollision(nextX, this.y, this.radius, this.timeline)) this.x = nextX;
                if (!level.checkWallCollision(this.x, nextY, this.radius, this.timeline)) this.y = nextY;
            }

            // Attack behavior
            this.shootTimer += dt;
            if (this.shootTimer >= this.shootInterval && distToPlayer < 550) {
                this.shootTimer = 0;
                this.shoot(player, projectiles, engine);
            }
        }
    }

    shoot(player, projectiles, engine) {
        const aimAngle = Math.atan2(player.y - this.y, player.x - this.x);
        const speed = 320;

        if (this.type === 'turret') {
            // 3-way spread shot
            [-0.2, 0, 0.2].forEach(offset => {
                const a = aimAngle + offset;
                projectiles.push(new Projectile(this.x, this.y, Math.cos(a) * speed, Math.sin(a) * speed, {
                    isPlayer: false,
                    damage: 15,
                    timeline: this.timeline,
                    color: '#ffaa00',
                    radius: 5
                }));
            });
            window.AudioEngine.playEnemyShot();
        } else if (this.type === 'drone') {
            // High velocity pulse
            projectiles.push(new Projectile(this.x, this.y, Math.cos(aimAngle) * (speed * 1.2), Math.sin(aimAngle) * (speed * 1.2), {
                isPlayer: false,
                damage: 14,
                timeline: this.timeline,
                color: '#00f0ff',
                radius: 4
            }));
            window.AudioEngine.playEnemyShot();
        } else {
            // Void Wraith / Stalker: Slow tracking energy orb
            projectiles.push(new Projectile(this.x, this.y, Math.cos(aimAngle) * (speed * 0.9), Math.sin(aimAngle) * (speed * 0.9), {
                isPlayer: false,
                damage: 18,
                timeline: this.timeline,
                color: '#d900ff',
                radius: 6
            }));
            window.AudioEngine.playEnemyShot();
        }
    }

    takeDamage(amount, engine) {
        this.hp -= amount;
        engine.spawnBurst(this.x, this.y, this.color, 8, 90);
        engine.addFloatingText(`${Math.round(amount)}`, this.x, this.y - 15, this.color, 15);
        window.AudioEngine.playHit(false);

        if (this.hp <= 0) {
            window.AudioEngine.playExplosion(false);
            engine.spawnBurst(this.x, this.y, this.color, 20, 160);
        }
        return this.hp <= 0;
    }

    render(ctx, playerTimeline) {
        // If not in player's timeline, render as a faint ghostly shadow echo
        const sameTimeline = (playerTimeline === this.timeline);
        ctx.save();
        ctx.translate(this.x, this.y);

        if (!sameTimeline) {
            ctx.globalAlpha = 0.22; // Ghostly outline
            ctx.setLineDash([4, 4]);
        }

        ctx.rotate(this.angle);

        if (this.type === 'drone') {
            // Quad security drone
            ctx.fillStyle = '#1c2836';
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Rotors
            [-10, 10].forEach(ox => {
                [-10, 10].forEach(oy => {
                    ctx.fillStyle = this.color;
                    ctx.fillRect(ox - 3, oy - 3, 6, 6);
                });
            });

            // Glowing sensor eye
            ctx.fillStyle = '#ff0055';
            ctx.beginPath();
            ctx.arc(6, 0, 4, 0, Math.PI * 2);
            ctx.fill();

        } else if (this.type === 'turret') {
            // Base ring
            ctx.fillStyle = '#2b2318';
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Double cannon barrels
            ctx.fillStyle = '#444';
            ctx.fillRect(0, -6, 24, 4);
            ctx.fillRect(0, 2, 24, 4);

        } else {
            // Void Wraith / Stalker: Eldritch shifting geometry
            ctx.fillStyle = '#20082b';
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(18, 0);
            ctx.lineTo(-12, 14);
            ctx.lineTo(-4, 0);
            ctx.lineTo(-12, -14);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Pulsing void eyes
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(4, -4, 2.5, 0, Math.PI * 2);
            ctx.arc(4, 4, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Health bar if damaged and in same timeline
        if (sameTimeline && this.hp < this.maxHp) {
            ctx.save();
            const barW = 32;
            const barH = 4;
            const pct = Math.max(0, this.hp / this.maxHp);
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(this.x - barW / 2, this.y - this.radius - 12, barW, barH);
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - barW / 2, this.y - this.radius - 12, barW * pct, barH);
            ctx.restore();
        }
    }
}

// ==========================================
// 4. THE BOSS: PARADOX NEXUS (CHRONO TITAN)
// ==========================================
class BossTitan {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 48;
        this.maxHp = 600;
        this.hp = 600;
        this.phase = 1; // 1: Armored Overlord (Past/Future), 2: Unbound Singularity
        this.angle = 0;
        this.attackTimer = 0;
        this.attackPattern = 0;
        this.shieldActive = true;
        this.vortexTimer = 0;
        this.pylonsDestroyed = 0;
    }

    update(dt, player, engine, level, projectiles) {
        this.angle += dt * 0.8;
        this.attackTimer += dt;

        // Phase check
        if (this.hp <= this.maxHp * 0.45 && this.phase === 1) {
            this.phase = 2;
            this.shieldActive = false;
            engine.addTrauma(0.8);
            window.AudioEngine.playBossRoar();
            engine.addFloatingText("CRITICAL: REALITY ANCHOR COLLAPSE!", this.x, this.y - 60, '#ff0055', 22);
            engine.spawnBurst(this.x, this.y, '#d900ff', 40, 250);
        }

        // Attacks occur across both timelines
        if (this.phase === 1) {
            if (this.attackTimer > 1.8) {
                this.attackTimer = 0;
                this.attackPattern = (this.attackPattern + 1) % 3;

                if (this.attackPattern === 0) {
                    // Spiral Barrage
                    const bullets = 12;
                    for (let i = 0; i < bullets; i++) {
                        const a = this.angle + (i * (Math.PI * 2 / bullets));
                        projectiles.push(new Projectile(this.x, this.y, Math.cos(a) * 220, Math.sin(a) * 220, {
                            isPlayer: false,
                            damage: 16,
                            timeline: player.currentTimeline, // Targets current timeline
                            color: '#00f0ff',
                            radius: 6
                        }));
                    }
                    window.AudioEngine.playEnemyShot();
                } else if (this.attackPattern === 1) {
                    // Aimed Tri-Blast at Player
                    const aim = Math.atan2(player.y - this.y, player.x - this.x);
                    [-0.25, 0, 0.25].forEach(off => {
                        const a = aim + off;
                        projectiles.push(new Projectile(this.x, this.y, Math.cos(a) * 290, Math.sin(a) * 290, {
                            isPlayer: false,
                            damage: 20,
                            timeline: 'both', // Hits in both timelines!
                            color: '#ff00aa',
                            radius: 8
                        }));
                    });
                    window.AudioEngine.playEnemyShot();
                } else {
                    // Spawn Void Mines
                    engine.addFloatingText("TEMPORAL MINES DEPLOYED!", this.x, this.y - 40, '#d900ff', 16);
                    for (let i = 0; i < 4; i++) {
                        const a = Math.random() * Math.PI * 2;
                        const dist = Math.random() * 200 + 80;
                        engine.addParticle({
                            x: this.x + Math.cos(a) * dist,
                            y: this.y + Math.sin(a) * dist,
                            color: '#d900ff',
                            size: 14,
                            life: 4.0
                        });
                    }
                }
            }
        } else {
            // PHASE 2: Unbound Singularity - Rapid bullet hell & gravity pull
            if (this.attackTimer > 0.9) {
                this.attackTimer = 0;
                const bullets = 16;
                for (let i = 0; i < bullets; i++) {
                    const a = this.angle * 2 + (i * (Math.PI * 2 / bullets));
                    projectiles.push(new Projectile(this.x, this.y, Math.cos(a) * 260, Math.sin(a) * 260, {
                        isPlayer: false,
                        damage: 18,
                        timeline: 'both',
                        color: (i % 2 === 0) ? '#00f0ff' : '#ff0055',
                        radius: 6
                    }));
                }
                window.AudioEngine.playEnemyShot();
            }

            // Subtle gravitational vortex pull on player towards boss
            const dist = Math.hypot(this.x - player.x, this.y - player.y);
            if (dist > 60 && dist < 500) {
                const pullAngle = Math.atan2(this.y - player.y, this.x - player.x);
                player.x += Math.cos(pullAngle) * 35 * dt;
                player.y += Math.sin(pullAngle) * 35 * dt;
            }
        }
    }

    takeDamage(amount, engine) {
        if (this.shieldActive) {
            engine.addFloatingText("SHIELDED! OVERLOAD CHRONO-PYLONS FIRST!", this.x, this.y - 50, '#00f0ff', 14);
            window.AudioEngine.playHit(false);
            return false;
        }

        this.hp = Math.max(0, this.hp - amount);
        engine.addTrauma(0.3);
        engine.spawnBurst(this.x, this.y, '#ff00ea', 12, 140);
        engine.addFloatingText(`${Math.round(amount)}`, this.x, this.y - 30, '#ff0055', 20);
        window.AudioEngine.playHit(false);

        if (this.hp <= 0) {
            window.AudioEngine.playExplosion(true);
            engine.spawnBurst(this.x, this.y, '#ffffff', 60, 300);
            return true;
        }
        return false;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Rotating outer chronal rings
        ctx.save();
        ctx.rotate(this.angle);
        ctx.strokeStyle = (this.phase === 1) ? '#00f0ff' : '#ff0055';
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 16, 0, Math.PI * 2);
        ctx.stroke();

        ctx.rotate(-this.angle * 2);
        ctx.strokeStyle = '#d900ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Main Boss Core
        ctx.fillStyle = '#14051f';
        ctx.strokeStyle = (this.shieldActive) ? '#00f0ff' : '#ff0055';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Pulsing Singularity Center
        const pulse = Math.sin(Date.now() * 0.006) * 6 + 18;
        ctx.fillStyle = (this.phase === 1) ? '#ffffff' : '#000000';
        ctx.shadowColor = (this.phase === 1) ? '#00f0ff' : '#ff0055';
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.arc(0, 0, pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ==========================================
// 5. INTERACTIVE OBJECTS (TERMINALS, PYLONS, PICKUPS)
// ==========================================
class Terminal {
    constructor(x, y, id, title, timeline = 'past') {
        this.x = x;
        this.y = y;
        this.id = id;
        this.title = title;
        this.timeline = timeline;
        this.radius = 24;
        this.isRead = false;
        this.glow = 0;
    }

    render(ctx, playerTimeline) {
        const isSame = (playerTimeline === this.timeline);
        ctx.save();
        ctx.translate(this.x, this.y);

        if (!isSame) {
            ctx.globalAlpha = 0.25;
        }

        // Terminal pedestal
        ctx.fillStyle = '#1a2433';
        ctx.strokeStyle = this.isRead ? '#555555' : '#00f0ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(-16, -16, 32, 32);
        ctx.fillRect(-16, -16, 32, 32);

        // Screen display
        ctx.fillStyle = this.isRead ? '#1a3040' : '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = this.isRead ? 0 : 8;
        ctx.fillRect(-10, -10, 20, 20);

        // Terminal screen icon
        ctx.fillStyle = this.isRead ? '#5588aa' : '#001a2e';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.isRead ? 'DATA' : 'COMM', 0, 4);

        ctx.restore();
    }
}

class ChronoPylon {
    constructor(x, y, id, timeline) {
        this.x = x;
        this.y = y;
        this.id = id;
        this.timeline = timeline; // Must be overloaded in specific timeline!
        this.radius = 28;
        this.overloaded = false;
        this.charge = 0;
        this.maxCharge = 100;
    }

    overload(engine) {
        if (this.overloaded) return;
        this.overloaded = true;
        engine.spawnBurst(this.x, this.y, '#00ffaa', 30, 200);
        engine.addFloatingText("PYLON OVERLOADED!", this.x, this.y - 30, '#00ffaa', 16);
        window.AudioEngine.playTerminal();
    }

    render(ctx, playerTimeline) {
        const isSame = (playerTimeline === this.timeline);
        ctx.save();
        ctx.translate(this.x, this.y);

        if (!isSame) ctx.globalAlpha = 0.3;

        ctx.fillStyle = '#1e1a29';
        ctx.strokeStyle = this.overloaded ? '#00ff88' : '#ff00aa';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner power core
        ctx.fillStyle = this.overloaded ? '#00ff88' : '#ffffff';
        ctx.shadowColor = this.overloaded ? '#00ff88' : '#ff00aa';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class Pickup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'health' or 'energy'
        this.radius = 14;
        this.floatOffset = Math.random() * Math.PI * 2;
    }

    render(ctx) {
        this.floatOffset += 0.05;
        const dy = Math.sin(this.floatOffset) * 4;

        ctx.save();
        ctx.translate(this.x, this.y + dy);

        if (this.type === 'health') {
            ctx.fillStyle = '#00ff88';
            ctx.shadowColor = '#00ff88';
            ctx.shadowBlur = 10;
            ctx.fillRect(-8, -3, 16, 6);
            ctx.fillRect(-3, -8, 6, 16);
        } else {
            // Energy core
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(0, 0, 7, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}
