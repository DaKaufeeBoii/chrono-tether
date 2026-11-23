/**
 * CHRONO TETHER: LAST RECORD OF THE NOMOS
 * Level Architectures, Dual-Timeline Collision, Hazards, and Sector Progression
 */

class LevelManager {
    constructor() {
        this.currentSector = 1; // 1: Cryo-Deck Alpha, 2: Quantum Hydro-Gardens, 3: Singularity Core
        this.width = 2400;
        this.height = 1800;

        // Level Entities & Geometry
        this.walls = [];       // [{x, y, w, h, timeline: 'both'|'past'|'future', type: 'wall'|'door'|'laser'}]
        this.hazards = [];     // [{x, y, w, h, timeline, damage}]
        this.terminals = [];   // Terminal instances
        this.pylons = [];      // ChronoPylon instances
        this.pickups = [];     // Pickup instances
        this.enemies = [];     // Enemy instances
        this.boss = null;      // Boss instance (Sector 3)
        this.exitPortal = null;// {x, y, radius, label, active}

        this.objectiveText = "";
        this.objectiveTarget = { x: 0, y: 0 };
    }

    loadSector(sectorNum, player) {
        this.currentSector = sectorNum;
        this.walls = [];
        this.hazards = [];
        this.terminals = [];
        this.pylons = [];
        this.pickups = [];
        this.enemies = [];
        this.boss = null;

        if (sectorNum === 1) {
            this.buildSector1(player);
        } else if (sectorNum === 2) {
            this.buildSector2(player);
        } else if (sectorNum === 3) {
            this.buildSector3(player);
        }
    }

    // ==========================================
    // SECTOR 1: CRYO-DECK ALPHA (THE AWAKENING)
    // ==========================================
    buildSector1(player) {
        this.width = 2400;
        this.height = 1800;

        // Player spawn in Cryo Awakening Chamber
        player.x = 220;
        player.y = 900;
        player.currentTimeline = 'past';

        // Outer Hull (Impenetrable across both timelines)
        this.addWall(0, 0, this.width, 40, 'both');
        this.addWall(0, this.height - 40, this.width, 40, 'both');
        this.addWall(0, 0, 40, this.height, 'both');
        this.addWall(this.width - 40, 0, 40, this.height, 'both');

        // Chamber 1: Cryo Pod Bay (Starting Room)
        this.addWall(480, 0, 30, 750, 'both');
        this.addWall(480, 1050, 30, 750, 'both');
        // THE FIRST TIMELINE PUZZLE:
        // A heavy blast door seals the exit in the PAST, but is blown open in the FUTURE!
        this.addWall(480, 750, 30, 300, 'past', 'door');

        // Corridor & Chamber 2: Security Checkpoint
        this.addWall(980, 200, 30, 600, 'both');
        this.addWall(980, 1000, 30, 600, 'both');
        // Red laser tripwire in the Past! Player must phase to Future to bypass safely!
        this.addHazard(980, 800, 30, 200, 'past', 35);

        // Chamber 3: Storage & Server Vault
        this.addWall(1480, 400, 400, 30, 'both');
        this.addWall(1480, 1200, 400, 30, 'both');
        // Broken debris in the Future blocking the path; pass through in the Past!
        this.addWall(1650, 430, 30, 350, 'future', 'wall');

        // Terminals
        this.terminals.push(new Terminal(340, 700, 'term_1_1', 'A.T.L.A.S. Diagnostic', 'past'));
        this.terminals.push(new Terminal(1200, 900, 'term_1_2', 'Dr. Ward Audio Log #104', 'past'));

        // Pickups
        this.pickups.push(new Pickup(750, 600, 'health'));
        this.pickups.push(new Pickup(1350, 1100, 'energy'));
        this.pickups.push(new Pickup(1750, 900, 'health'));

        // Enemies
        // In the Past: Sentry Drones patrolling security checkpoints
        this.enemies.push(new Enemy(720, 850, 'drone', 'past'));
        this.enemies.push(new Enemy(850, 950, 'drone', 'past'));
        this.enemies.push(new Enemy(1250, 750, 'turret', 'past'));

        // In the Future: Void Wraiths haunting the decayed ruins
        this.enemies.push(new Enemy(600, 900, 'wraith', 'future'));
        this.enemies.push(new Enemy(1150, 1050, 'wraith', 'future'));
        this.enemies.push(new Enemy(1450, 850, 'stalker', 'future'));

        // Sector Exit Portal to Sector 2
        this.exitPortal = {
            x: 2150,
            y: 900,
            radius: 45,
            label: "WARP LIFT TO SECTOR 2: QUANTUM ENGINEERING",
            active: true
        };

        this.objectiveText = "Phase through the breached blast doors to reach the Sector 2 Warp Lift.";
        this.objectiveTarget = { x: this.exitPortal.x, y: this.exitPortal.y };
    }

    // ==========================================
    // SECTOR 2: QUANTUM HYDRO-GARDENS & REACTOR MAZE
    // ==========================================
    buildSector2(player) {
        this.width = 3000;
        this.height = 2000;

        player.x = 220;
        player.y = 1000;
        player.currentTimeline = 'past';

        // Outer Hull
        this.addWall(0, 0, this.width, 40, 'both');
        this.addWall(0, this.height - 40, this.width, 40, 'both');
        this.addWall(0, 0, 40, this.height, 'both');
        this.addWall(this.width - 40, 0, 40, this.height, 'both');

        // Central Hydro-Pond / Bio-Barrier
        this.addWall(600, 300, 30, 650, 'both');
        this.addWall(600, 1150, 30, 650, 'both');
        this.addWall(600, 950, 30, 200, 'past', 'door'); // Locked door in Past

        // Laser Maze Corridor
        this.addWall(1200, 200, 30, 700, 'both');
        this.addWall(1200, 1100, 30, 700, 'both');
        this.addHazard(1200, 900, 30, 200, 'past', 40);

        // Security Vault containing Chrono-Pylon 1
        this.addWall(1600, 400, 500, 30, 'both');
        this.addWall(1600, 800, 500, 30, 'both');
        this.addWall(2100, 400, 30, 400, 'both');
        this.addWall(1600, 400, 30, 180, 'past', 'door'); // Breached in Future!

        // Lower Chamber containing Chrono-Pylon 2
        this.addWall(1600, 1200, 500, 30, 'both');
        this.addWall(1600, 1600, 500, 30, 'both');
        this.addWall(2100, 1200, 30, 400, 'both');
        this.addWall(1600, 1420, 30, 180, 'future', 'wall'); // Intact in Past!

        // Chrono Pylons (Must overload both to open Sector 3 bulkhead!)
        this.pylons.push(new ChronoPylon(1850, 600, 'pylon_1', 'past'));
        this.pylons.push(new ChronoPylon(1850, 1400, 'pylon_2', 'future'));

        // Terminals
        this.terminals.push(new Terminal(750, 1000, 'term_2_1', 'Vance Directive 88', 'past'));
        this.terminals.push(new Terminal(1850, 720, 'term_2_2', 'Dr. Ward Mnemonic Core', 'future'));

        // Pickups
        this.pickups.push(new Pickup(900, 500, 'health'));
        this.pickups.push(new Pickup(900, 1500, 'energy'));
        this.pickups.push(new Pickup(2000, 1400, 'health'));
        this.pickups.push(new Pickup(2000, 600, 'energy'));

        // Enemies
        this.enemies.push(new Enemy(900, 800, 'drone', 'past'));
        this.enemies.push(new Enemy(950, 1200, 'drone', 'past'));
        this.enemies.push(new Enemy(1450, 1000, 'turret', 'past'));
        this.enemies.push(new Enemy(1750, 600, 'turret', 'past'));

        this.enemies.push(new Enemy(850, 1000, 'wraith', 'future'));
        this.enemies.push(new Enemy(1350, 700, 'stalker', 'future'));
        this.enemies.push(new Enemy(1450, 1300, 'wraith', 'future'));
        this.enemies.push(new Enemy(1850, 1300, 'stalker', 'future'));
        this.enemies.push(new Enemy(2400, 1000, 'stalker', 'future'));

        // Sector Exit Portal
        this.exitPortal = {
            x: 2750,
            y: 1000,
            radius: 50,
            label: "SINGULARITY REACTOR AIRLOCK",
            active: false // Activates once both pylons are overloaded!
        };

        this.objectiveText = "Overload the 2 Chrono-Pylons across both timelines to breach the Singularity Airlock.";
        this.objectiveTarget = { x: 1850, y: 600 };
    }

    // ==========================================
    // SECTOR 3: THE SINGULARITY CORE (BOSS BATTLE)
    // ==========================================
    buildSector3(player) {
        this.width = 2400;
        this.height = 2200;

        player.x = 350;
        player.y = 1100;
        player.currentTimeline = 'past';

        // Outer Hull
        this.addWall(0, 0, this.width, 40, 'both');
        this.addWall(0, this.height - 40, this.width, 40, 'both');
        this.addWall(0, 0, 40, this.height, 'both');
        this.addWall(this.width - 40, 0, 40, this.height, 'both');

        // Central Arena Pillars
        const cx = 1350;
        const cy = 1100;
        this.addWall(cx - 300, cy - 300, 60, 60, 'both');
        this.addWall(cx + 240, cy - 300, 60, 60, 'both');
        this.addWall(cx - 300, cy + 240, 60, 60, 'both');
        this.addWall(cx + 240, cy + 240, 60, 60, 'both');

        // Chrono Pylons around Boss Arena
        this.pylons.push(new ChronoPylon(cx - 350, cy, 'boss_pylon_1', 'past'));
        this.pylons.push(new ChronoPylon(cx + 350, cy, 'boss_pylon_2', 'future'));
        this.pylons.push(new ChronoPylon(cx, cy - 350, 'boss_pylon_3', 'past'));
        this.pylons.push(new ChronoPylon(cx, cy + 350, 'boss_pylon_4', 'future'));

        // Spawn THE BOSS: PARADOX NEXUS
        this.boss = new BossTitan(cx, cy);

        // Terminals
        this.terminals.push(new Terminal(450, 1100, 'term_3_1', 'Singularity Core Warning', 'past'));

        // Pickups
        this.pickups.push(new Pickup(600, 600, 'health'));
        this.pickups.push(new Pickup(600, 1600, 'health'));
        this.pickups.push(new Pickup(2000, 600, 'energy'));
        this.pickups.push(new Pickup(2000, 1600, 'health'));

        this.exitPortal = null; // No exit until Boss is defeated!
        this.objectiveText = "Overload 4 Chrono-Pylons to disable boss shield, then destroy the Paradox Nexus!";
        this.objectiveTarget = { x: cx, y: cy };

        window.AudioEngine.setMusicMode('boss');
    }

    addWall(x, y, w, h, timeline, type = 'wall') {
        this.walls.push({ x, y, w, h, timeline, type });
    }

    addHazard(x, y, w, h, timeline, damage) {
        this.hazards.push({ x, y, w, h, timeline, damage });
    }

    checkWallCollision(px, py, radius, currentTimeline) {
        for (let i = 0; i < this.walls.length; i++) {
            const w = this.walls[i];
            // Only collide if wall exists in this timeline or 'both'
            if (w.timeline === 'both' || w.timeline === currentTimeline) {
                // Circle-AABB test
                const closestX = Math.max(w.x, Math.min(px, w.x + w.w));
                const closestY = Math.max(w.y, Math.min(py, w.y + w.h));
                const distX = px - closestX;
                const distY = py - closestY;
                if ((distX * distX + distY * distY) < (radius * radius)) {
                    return true;
                }
            }
        }
        return false;
    }

    render(ctx, playerTimeline) {
        // 1. Render Hazards (Laser grids, void tears)
        this.hazards.forEach(h => {
            const isSame = (playerTimeline === h.timeline);
            ctx.save();
            if (h.timeline === 'past') {
                // Glowing pulsating laser tripwire
                ctx.fillStyle = isSame ? 'rgba(255, 0, 80, 0.75)' : 'rgba(255, 0, 80, 0.15)';
                ctx.shadowColor = '#ff0055';
                ctx.shadowBlur = isSame ? 16 : 0;
                ctx.fillRect(h.x, h.y, h.w, h.h);
            } else {
                // Unstable void distortion hazard
                ctx.fillStyle = isSame ? 'rgba(160, 0, 255, 0.7)' : 'rgba(160, 0, 255, 0.15)';
                ctx.shadowColor = '#d900ff';
                ctx.shadowBlur = isSame ? 16 : 0;
                ctx.fillRect(h.x, h.y, h.w, h.h);
            }
            ctx.restore();
        });

        // 2. Render Walls
        this.walls.forEach(w => {
            const isSame = (w.timeline === 'both' || w.timeline === playerTimeline);
            ctx.save();

            if (!isSame) {
                // Faint holographic / decayed wireframe outline if in the other timeline!
                ctx.strokeStyle = (w.timeline === 'past') ? 'rgba(0, 240, 255, 0.22)' : 'rgba(230, 0, 255, 0.22)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 4]);
                ctx.strokeRect(w.x, w.y, w.w, w.h);
                ctx.restore();
                return;
            }

            if (w.timeline === 'both') {
                // Outer Hull & Bulkheads
                ctx.fillStyle = '#101622';
                ctx.strokeStyle = '#223247';
                ctx.lineWidth = 2;
                ctx.fillRect(w.x, w.y, w.w, w.h);
                ctx.strokeRect(w.x, w.y, w.w, w.h);
            } else if (w.timeline === 'past') {
                // Intact High-Tech Blast Door
                ctx.fillStyle = '#142738';
                ctx.strokeStyle = '#00f0ff';
                ctx.lineWidth = 2.5;
                ctx.fillRect(w.x, w.y, w.w, w.h);
                ctx.strokeRect(w.x, w.y, w.w, w.h);

                // Warning stripes
                ctx.fillStyle = '#00f0ff';
                ctx.fillRect(w.x + 4, w.y + 4, Math.max(4, w.w - 8), Math.max(4, w.h - 8));
            } else {
                // Future Void Ruin
                ctx.fillStyle = '#260a33';
                ctx.strokeStyle = '#d900ff';
                ctx.lineWidth = 2.5;
                ctx.fillRect(w.x, w.y, w.w, w.h);
                ctx.strokeRect(w.x, w.y, w.w, w.h);
            }

            ctx.restore();
        });

        // 3. Render Exit Portal
        if (this.exitPortal && this.exitPortal.active) {
            ctx.save();
            ctx.translate(this.exitPortal.x, this.exitPortal.y);
            const pulse = Math.sin(Date.now() * 0.005) * 6;
            ctx.strokeStyle = '#00ffaa';
            ctx.shadowColor = '#00ffaa';
            ctx.shadowBlur = 18;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.exitPortal.radius + pulse, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText("WARP LIFT", 0, 4);
            ctx.restore();
        }
    }
}
