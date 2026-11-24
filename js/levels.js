/**
 * CHRONO TETHER: LAST RECORD OF THE NOMOS
 * Metroidvania 5-Deck World Architecture, Causality Puzzles, Hazard Systems & Progression
 */

class LevelManager {
    constructor() {
        this.currentDeck = 1;
        this.width = 7200;  // 6 rooms * 1200px
        this.height = 3600; // 4 rooms * 900px
        this.roomW = 1200;
        this.roomH = 900;

        // Level Entities & Geometry
        this.walls = [];          // [{x, y, w, h, timeline, type, doorId, locked, color}]
        this.hazards = [];        // [{x, y, w, h, timeline, damage, type}]
        this.terminals = [];      // Terminal instances
        this.pylons = [];         // ChronoPylon instances
        this.pickups = [];        // Pickup instances
        this.saveStations = [];   // SaveStation instances
        this.grappleNodes = [];   // GrappleNode instances
        this.portalGates = [];    // PortalGate instances
        this.upgrades = [];       // UpgradeItem instances
        this.enemies = [];        // Enemy instances
        this.boss = null;         // Active Boss/Mini-Boss instance
        this.exitPortal = null;   // {x, y, radius, label, active, targetDeck, spawnX, spawnY}

        // Metroidvania Persistent State
        this.exploredCells = new Set();
        this.collectedPickups = new Set();
        this.unlockedDoors = new Set();
        this.causalitySwitches = new Set();

        this.objectiveText = "";
        this.objectiveTarget = { x: 0, y: 0 };
    }

    // ==========================================
    // DECK LOADER & ROUTER
    // ==========================================
    loadDeck(deckNum, player, spawnX = null, spawnY = null) {
        this.currentDeck = deckNum;
        this.walls = [];
        this.hazards = [];
        this.terminals = [];
        this.pylons = [];
        this.pickups = [];
        this.saveStations = [];
        this.grappleNodes = [];
        this.portalGates = [];
        this.upgrades = [];
        this.enemies = [];
        this.boss = null;
        this.exitPortal = null;

        if (deckNum === 1) {
            this.buildDeck1(player, spawnX, spawnY);
            window.AudioEngine.setMusicMode('exploration');
        } else if (deckNum === 2) {
            this.buildDeck2(player, spawnX, spawnY);
            window.AudioEngine.setMusicMode('exploration');
        } else if (deckNum === 3) {
            this.buildDeck3(player, spawnX, spawnY);
            window.AudioEngine.setMusicMode('exploration');
        } else if (deckNum === 4) {
            this.buildDeck4(player, spawnX, spawnY);
            window.AudioEngine.setMusicMode('exploration');
        } else if (deckNum === 5) {
            this.buildDeck5(player, spawnX, spawnY);
            window.AudioEngine.setMusicMode('boss');
        }
    }

    // Compatibility method for legacy calls
    loadSector(sectorNum, player) {
        this.loadDeck(sectorNum, player);
    }

    // ==========================================
    // DECK 1: CRYO-STASIS HUB (AWAKENING & OVERSEER)
    // ==========================================
    buildDeck1(player, spawnX, spawnY) {
        this.width = 7200;
        this.height = 3600;

        // Player spawn in Room (0,2) Cryo Awakening Bay
        player.x = spawnX !== null ? spawnX : 450;
        player.y = spawnY !== null ? spawnY : 2250;
        player.currentTimeline = 'past';

        // Outer Hull Boundary
        this.addWall(0, 0, this.width, 50, 'both');
        this.addWall(0, this.height - 50, this.width, 50, 'both');
        this.addWall(0, 0, 50, this.height, 'both');
        this.addWall(this.width - 50, 0, 50, this.height, 'both');

        // --- Room (0,2): Cryo Awakening Chamber ---
        // Blast door seals exit in the Past, but is decayed open in the Future!
        this.addWall(1180, 1800, 40, 350, 'both');
        this.addWall(1180, 2350, 40, 350, 'both');
        this.addWall(1180, 2150, 40, 200, 'past', 'door'); // Timeline puzzle 1

        this.terminals.push(new Terminal(480, 2100, 'term_1_1', 'A.T.L.A.S. Diagnostic', 'past'));
        this.pickups.push(new Pickup(750, 2250, 'energy'));

        // --- Room (1,2): Security Corridor & Save Station Alpha ---
        this.saveStations.push(new SaveStation(1800, 2250, 'save_deck1_alpha', 1));
        this.terminals.push(new Terminal(1500, 2150, 'term_1_2', 'Dr. Ward Audio Log #104', 'past'));

        // North door leading to Room (1,1)
        this.addWall(1200, 1780, 450, 40, 'both');
        this.addWall(1950, 1780, 450, 40, 'both');

        // East wall separating to Room (2,2)
        this.addWall(2380, 1800, 40, 350, 'both');
        this.addWall(2380, 2350, 40, 350, 'both');

        // Sentry drones
        this.enemies.push(new Enemy(1600, 2100, 'drone', 'past'));
        this.enemies.push(new Enemy(2100, 2400, 'drone', 'past'));
        this.enemies.push(new Enemy(1900, 2200, 'wraith', 'future'));

        // --- Room (1,1): Security Checkpoint & Laser Grid ---
        // Laser hazard active in Past; bypass by phasing into Future!
        this.addHazard(1500, 1200, 40, 300, 'past', 35, 'laser');
        this.addWall(2380, 900, 40, 350, 'both');
        this.addWall(2380, 1450, 40, 350, 'both');
        this.enemies.push(new Enemy(1800, 1350, 'turret', 'past'));
        this.pickups.push(new Pickup(2000, 1200, 'health'));

        // --- Room (2,1): Server Vault (HP Expansion Tank) ---
        if (!this.collectedPickups.has('upgrade_hp_1')) {
            this.upgrades.push(new UpgradeItem(3000, 1350, 'upgrade_hp_1', 'hp_tank', '+25 HP TANK'));
        }
        this.terminals.push(new Terminal(2750, 1250, 'term_1_vault', 'Automated Containment Protocol', 'past'));
        this.enemies.push(new Enemy(2850, 1400, 'stalker', 'future'));

        // Door to Room (3,1)
        this.addWall(3580, 900, 40, 350, 'both');
        this.addWall(3580, 1450, 40, 350, 'both');

        // --- Room (3,1): Transit Gantry (Teaser Grapple Node) ---
        this.grappleNodes.push(new GrappleNode(4200, 1200, 'grapple_teaser_1', 'both'));
        this.addHazard(3900, 1500, 500, 60, 'future', 30, 'void');
        this.enemies.push(new Enemy(4300, 1300, 'drone', 'past'));

        // Connection down to Room (3,2)
        this.addWall(3600, 1780, 450, 40, 'both');
        this.addWall(4350, 1780, 450, 40, 'both');

        // --- Room (2,2): Central Plaza ---
        this.addWall(2900, 2100, 200, 40, 'both');
        this.enemies.push(new Enemy(2700, 2150, 'drone', 'past'));
        this.enemies.push(new Enemy(3100, 2400, 'turret', 'past'));
        this.enemies.push(new Enemy(2800, 2300, 'stalker', 'future'));
        this.pickups.push(new Pickup(3000, 2450, 'health'));

        // --- Room (3,2): Central Transit Shaft ---
        this.addWall(4780, 1800, 40, 350, 'both');
        this.addWall(4780, 2350, 40, 350, 'both');
        // Yellow Keycard Door to Boss Arena in Room (4,2)
        const doorLocked = !this.unlockedDoors.has('door_deck1_boss');
        this.addWall(4780, 2150, 40, 200, 'both', 'door', 'door_deck1_boss', doorLocked, '#ffaa00');

        this.terminals.push(new Terminal(4100, 2200, 'term_1_shaft', 'Elevator Diagnostics: Deck 2 Sealing', 'past'));
        this.enemies.push(new Enemy(4200, 2350, 'wraith', 'future'));

        // --- Room (4,2): Overseer Arena (Mini-Boss) ---
        this.addWall(5980, 1800, 40, 350, 'both');
        this.addWall(5980, 2350, 40, 350, 'both');
        // Arena exit door locks during boss fight
        const overseerDead = this.unlockedDoors.has('overseer_defeated');
        this.addWall(5980, 2150, 40, 200, 'both', 'door', 'door_deck1_exit', !overseerDead, '#00ffaa');

        if (!overseerDead) {
            this.boss = new MaintenanceOverseer(5400, 2250);
        } else if (!this.collectedPickups.has('upgrade_weapon_scatter')) {
            this.upgrades.push(new UpgradeItem(5400, 2250, 'upgrade_weapon_scatter', 'weapon_scatter', 'CHRONO SCATTER TRI-BEAM'));
        }

        // --- Room (5,2): Deck 2 Elevator Airlock ---
        this.exitPortal = {
            x: 6600,
            y: 2250,
            radius: 36,
            label: "WARP LIFT: DECK 2",
            active: overseerDead,
            targetDeck: 2,
            spawnX: 450,
            spawnY: 2250
        };

        this.objectiveText = overseerDead
            ? "Deck 2 Elevator is operational. Proceed to the Hydro-Silos."
            : "Navigate Deck 1 to locate and override the Maintenance Overseer.";
        this.objectiveTarget = overseerDead
            ? { x: 6600, y: 2250 }
            : { x: 5400, y: 2250 };
    }

    // ==========================================
    // DECK 2: HYDRO-SILOS & BIOLAB (CAUSALITY & CHRONO-FLORA)
    // ==========================================
    buildDeck2(player, spawnX, spawnY) {
        this.width = 7200;
        this.height = 3600;

        player.x = spawnX !== null ? spawnX : 450;
        player.y = spawnY !== null ? spawnY : 2250;
        player.currentTimeline = 'past';

        // Outer Hull Boundary
        this.addWall(0, 0, this.width, 50, 'both');
        this.addWall(0, this.height - 50, this.width, 50, 'both');
        this.addWall(0, 0, 50, this.height, 'both');
        this.addWall(0, 0, 50, this.height, 'both');
        this.addWall(this.width - 50, 0, 50, this.height, 'both');

        // --- Room (0,2): Elevator from Deck 1 ---
        this.addWall(1180, 1800, 40, 350, 'both');
        this.addWall(1180, 2350, 40, 350, 'both');
        this.portalGates.push(new PortalGate(300, 2250, 6600, 2250, '#00f0ff')); // Return to Deck 1

        this.terminals.push(new Terminal(650, 2100, 'term_2_1', 'Hydroponics Flora Status Log', 'past'));

        // --- Room (1,2): Biolab Antechamber ---
        this.addWall(1200, 1780, 450, 40, 'both');
        this.addWall(1950, 1780, 450, 40, 'both');
        this.addWall(2380, 1800, 40, 350, 'both');
        this.addWall(2380, 2350, 40, 350, 'both');

        this.enemies.push(new Enemy(1600, 2150, 'turret', 'past'));
        this.enemies.push(new Enemy(1900, 2350, 'stalker', 'future'));
        this.enemies.push(new Enemy(2100, 2100, 'wraith', 'future'));

        // --- Room (1,1): Save Station Beta ---
        this.saveStations.push(new SaveStation(1800, 1350, 'save_deck2_beta', 2));
        this.terminals.push(new Terminal(1500, 1250, 'term_2_seed_manual', 'Hydro-Spore Genetic Cultivation Manual', 'past'));
        this.addWall(2380, 900, 40, 350, 'both');
        this.addWall(2380, 1450, 40, 350, 'both');

        // --- Room (2,1): Temporal Seed Pod (Causality Puzzle!) ---
        // Terminal allows planting spore in Past -> Grows massive vine bridge in Future!
        const vineGrown = this.causalitySwitches.has('hydro_spore_planted');
        this.terminals.push(new Terminal(3000, 1250, 'term_2_spore_terminal', 'Hydro-Spore Incubator Terminal [E]', 'past'));

        this.addWall(3580, 900, 40, 350, 'both');
        this.addWall(3580, 1450, 40, 350, 'both');

        // --- Room (3,1): Grapple Vault (Major Metroidvania Upgrade) ---
        if (!this.collectedPickups.has('upgrade_grapple')) {
            this.upgrades.push(new UpgradeItem(4200, 1350, 'upgrade_grapple', 'grapple', 'TACHYON GRAPPLE [F]'));
        }
        this.grappleNodes.push(new GrappleNode(3900, 1350, 'grapple_vault_node_1', 'both'));

        // Connection down to Room (3,2)
        this.addWall(3600, 1780, 450, 40, 'both');
        this.addWall(4350, 1780, 450, 40, 'both');

        // --- Room (2,2): Acid Trench (Cross with Grapple or Future Vine Bridge) ---
        // Massive toxic acid lake on the floor!
        this.addHazard(2450, 2100, 1100, 450, 'both', 45, 'acid');
        // Grapple nodes to swing across acid lake
        this.grappleNodes.push(new GrappleNode(2750, 2050, 'acid_node_1', 'both'));
        this.grappleNodes.push(new GrappleNode(3250, 2050, 'acid_node_2', 'both'));

        if (vineGrown) {
            // Safe vine platform across acid in Future!
            this.addWall(2700, 2200, 600, 30, 'future');
        }

        this.enemies.push(new Enemy(2850, 1950, 'drone', 'past'));
        this.enemies.push(new Enemy(3150, 2350, 'stalker', 'future'));

        // --- Room (3,2): Overgrown Silo & Room (3,3) Connection ---
        this.addWall(4780, 1800, 40, 350, 'both');
        this.addWall(4780, 2350, 40, 350, 'both');
        this.grappleNodes.push(new GrappleNode(4200, 2150, 'silo_node_1', 'both'));

        // South connection to secret vault (3,3)
        this.addWall(3600, 2680, 450, 40, 'both');
        this.addWall(4350, 2680, 450, 40, 'both');

        // --- Room (3,3): HP Tank Anomaly Vault ---
        if (!this.collectedPickups.has('upgrade_hp_2')) {
            this.upgrades.push(new UpgradeItem(4200, 3150, 'upgrade_hp_2', 'hp_tank', '+25 HP TANK'));
        }
        this.pickups.push(new Pickup(3900, 3150, 'energy'));
        this.enemies.push(new Enemy(4100, 3100, 'wraith', 'future'));

        // --- Room (4,2): Chrono-Flora Hive Arena (Mini-Boss) ---
        this.addWall(5980, 1800, 40, 350, 'both');
        this.addWall(5980, 2350, 40, 350, 'both');

        const floraDead = this.unlockedDoors.has('chronoflora_defeated');
        this.addWall(5980, 2150, 40, 200, 'both', 'door', 'door_deck2_exit', !floraDead, '#00ff88');

        if (!floraDead) {
            this.boss = new ChronoFlora(5400, 2250);
        } else if (!this.collectedPickups.has('upgrade_energy_1')) {
            this.upgrades.push(new UpgradeItem(5400, 2250, 'upgrade_energy_1', 'energy_tank', '+25 CHRONO TANK'));
        }

        // --- Room (5,2): Deck 3 Accelerator Gate ---
        this.exitPortal = {
            x: 6600,
            y: 2250,
            radius: 36,
            label: "WARP LIFT: DECK 3",
            active: floraDead,
            targetDeck: 3,
            spawnX: 450,
            spawnY: 2250
        };

        this.objectiveText = floraDead
            ? "Deck 3 Accelerator Gate unlocked! Proceed to Tachyon Grav-Labs."
            : "Locate the Tachyon Grapple in the Biolab and eradicate Chrono-Flora.";
        this.objectiveTarget = floraDead
            ? { x: 6600, y: 2250 }
            : { x: 5400, y: 2250 };
    }

    // ==========================================
    // DECK 3: TACHYON GRAV-LABS (PORTALS & GRAV-GOLIATH)
    // ==========================================
    buildDeck3(player, spawnX, spawnY) {
        this.width = 7200;
        this.height = 3600;

        player.x = spawnX !== null ? spawnX : 450;
        player.y = spawnY !== null ? spawnY : 2250;
        player.currentTimeline = 'past';

        // Outer Hull Boundary
        this.addWall(0, 0, this.width, 50, 'both');
        this.addWall(0, this.height - 50, this.width, 50, 'both');
        this.addWall(0, 0, 50, this.height, 'both');
        this.addWall(this.width - 50, 0, 50, this.height, 'both');

        // --- Room (0,2): Deck 2 Transit Gate ---
        this.addWall(1180, 1800, 40, 350, 'both');
        this.addWall(1180, 2350, 40, 350, 'both');
        this.portalGates.push(new PortalGate(300, 2250, 6600, 2250, '#ff9900'));

        // --- Room (1,2): Zero-G Corridor & Gravity Gates ---
        this.addWall(1200, 2680, 450, 40, 'both');
        this.addWall(1950, 2680, 450, 40, 'both');
        this.addWall(2380, 1800, 40, 350, 'both');
        this.addWall(2380, 2350, 40, 350, 'both');

        this.enemies.push(new Enemy(1650, 2150, 'turret', 'past'));
        this.enemies.push(new Enemy(2050, 2300, 'stalker', 'future'));

        // --- Room (1,3): Save Station Gamma ---
        this.saveStations.push(new SaveStation(1800, 3150, 'save_deck3_gamma', 3));
        this.terminals.push(new Terminal(1500, 3100, 'term_3_goliath', 'Graviton Core Containment Specifications', 'past'));

        // --- Room (2,2): EMP Grenade Lab ---
        if (!this.collectedPickups.has('upgrade_grenade')) {
            this.upgrades.push(new UpgradeItem(3000, 2250, 'upgrade_grenade', 'grenade', 'CHRONAL EMP GRENADE [Q]'));
        }
        this.addWall(2400, 1780, 450, 40, 'both');
        this.addWall(3150, 1780, 450, 40, 'both');
        this.addWall(3580, 1800, 40, 350, 'both');
        this.addWall(3580, 2350, 40, 350, 'both');

        // --- Room (2,1): Quantum Portal Weaver Relays ---
        if (!this.collectedPickups.has('upgrade_portals')) {
            this.upgrades.push(new UpgradeItem(3000, 1350, 'upgrade_portals', 'portals', 'QUANTUM PORTAL WEAVER [R]'));
        }
        // Quantum Portal test pairing
        this.portalGates.push(new PortalGate(2600, 1350, 3400, 1350, '#00f0ff'));
        this.portalGates.push(new PortalGate(3400, 1350, 2600, 1350, '#ffaa00'));

        // --- Room (3,2): Magnetic Rail Gantry & Remote EMP Switch ---
        // Remote blast wall only destructible with EMP grenade [Q]
        const barrierDown = this.unlockedDoors.has('grav_barrier_destroyed');
        if (!barrierDown) {
            this.addWall(4100, 1800, 40, 900, 'both', 'door', 'grav_barrier_destroyed', true, '#7700ff');
        }
        this.grappleNodes.push(new GrappleNode(4200, 2150, 'grav_node_1', 'both'));
        this.grappleNodes.push(new GrappleNode(4500, 2350, 'grav_node_2', 'both'));

        this.addWall(4780, 1800, 40, 350, 'both');
        this.addWall(4780, 2350, 40, 350, 'both');

        // --- Room (4,2): Grav-Goliath Arena (Mini-Boss) ---
        this.addWall(5980, 1800, 40, 350, 'both');
        this.addWall(5980, 2350, 40, 350, 'both');

        const goliathDead = this.unlockedDoors.has('gravgoliath_defeated');
        this.addWall(5980, 2150, 40, 200, 'both', 'door', 'door_deck3_exit', !goliathDead, '#7700ff');

        if (!goliathDead) {
            this.boss = new GravGoliath(5400, 2250);
        } else if (!this.collectedPickups.has('upgrade_weapon_rail')) {
            this.upgrades.push(new UpgradeItem(5400, 2250, 'upgrade_weapon_rail', 'weapon_rail', 'TACHYON RAILGUN'));
        }

        // --- Room (5,2): Deck 4 Hull Breach Portal ---
        this.exitPortal = {
            x: 6600,
            y: 2250,
            radius: 36,
            label: "WARP LIFT: DECK 4",
            active: goliathDead,
            targetDeck: 4,
            spawnX: 450,
            spawnY: 2250
        };

        this.objectiveText = goliathDead
            ? "Grav-Goliath destroyed! Proceed through Deck 4 Hull Breach."
            : "Acquire EMP Grenades and Portal Weaver to defeat Grav-Goliath.";
        this.objectiveTarget = goliathDead
            ? { x: 6600, y: 2250 }
            : { x: 5400, y: 2250 };
    }

    // ==========================================
    // DECK 4: SUB-HULL VOID RIFT (PHASE-DASH & VISOR)
    // ==========================================
    buildDeck4(player, spawnX, spawnY) {
        this.width = 7200;
        this.height = 3600;

        player.x = spawnX !== null ? spawnX : 450;
        player.y = spawnY !== null ? spawnY : 2250;
        player.currentTimeline = 'past';

        // Outer Hull Boundary
        this.addWall(0, 0, this.width, 50, 'both');
        this.addWall(0, this.height - 50, this.width, 50, 'both');
        this.addWall(0, 0, 50, this.height, 'both');
        this.addWall(this.width - 50, 0, 50, this.height, 'both');

        // --- Room (0,2): Airlock from Deck 3 ---
        this.addWall(1180, 1800, 40, 350, 'both');
        this.addWall(1180, 2350, 40, 350, 'both');

        // --- Room (1,2): Vacuum Drift Platforming ---
        this.addWall(1200, 1780, 450, 40, 'both');
        this.addWall(1950, 1780, 450, 40, 'both');
        this.addWall(2380, 1800, 40, 350, 'both');
        this.addWall(2380, 2350, 40, 350, 'both');

        // Void Hazards
        this.addHazard(1400, 2000, 800, 80, 'future', 35, 'void');
        this.enemies.push(new Enemy(1600, 2150, 'wraith', 'future'));
        this.enemies.push(new Enemy(2100, 2350, 'stalker', 'future'));

        // --- Room (1,1): Save Station Delta ---
        this.saveStations.push(new SaveStation(1800, 1350, 'save_deck4_delta', 4));
        this.terminals.push(new Terminal(1500, 1250, 'term_4_rift', 'Sub-Hull Spacetime Cleavage Records', 'past'));

        // --- Room (2,2): Phase-Dash Matrix Vault ---
        if (!this.collectedPickups.has('upgrade_phasedash')) {
            this.upgrades.push(new UpgradeItem(3000, 2250, 'upgrade_phasedash', 'phaseDash', 'PHASE-DASH MATRIX [SHIFT]'));
        }
        // Electrified laser gates pass-through only with Phase-Dash!
        this.addHazard(3400, 1900, 40, 700, 'both', 50, 'laser');
        this.addWall(3580, 1800, 40, 350, 'both');
        this.addWall(3580, 2350, 40, 350, 'both');

        // --- Room (3,2): Spacetime Bleed Chasm ---
        // Vertical portal loop
        this.portalGates.push(new PortalGate(3900, 2100, 4500, 2350, '#d900ff'));
        this.portalGates.push(new PortalGate(4500, 2350, 3900, 2100, '#00ffff'));

        // South connection to secret visor vault (3,3)
        this.addWall(3600, 2680, 450, 40, 'both');
        this.addWall(4350, 2680, 450, 40, 'both');

        // --- Room (3,3): Spectral Visor Vault (Major Metroidvania Upgrade) ---
        if (!this.collectedPickups.has('upgrade_visor')) {
            this.upgrades.push(new UpgradeItem(4200, 3150, 'upgrade_visor', 'visor', 'CHRONAL SPECTRAL VISOR [V]'));
        }
        if (!this.collectedPickups.has('upgrade_energy_2')) {
            this.upgrades.push(new UpgradeItem(3800, 3150, 'upgrade_energy_2', 'energy_tank', '+25 CHRONO TANK'));
        }

        // --- Room (4,2): Event Horizon Gate Gauntlet ---
        this.addWall(4780, 1800, 40, 350, 'both');
        this.addWall(4780, 2350, 40, 350, 'both');
        this.addWall(5980, 1800, 40, 350, 'both');
        this.addWall(5980, 2350, 40, 350, 'both');

        this.enemies.push(new Enemy(5100, 2150, 'stalker', 'future'));
        this.enemies.push(new Enemy(5500, 2350, 'stalker', 'future'));
        this.enemies.push(new Enemy(5300, 2250, 'wraith', 'future'));

        // --- Room (5,2): Deck 5 Crucible Airlock ---
        this.exitPortal = {
            x: 6600,
            y: 2250,
            radius: 36,
            label: "WARP LIFT: DECK 5",
            active: true,
            targetDeck: 5,
            spawnX: 1800,
            spawnY: 2250
        };

        this.objectiveText = "Singularity Event Horizon reached! Enter Deck 5: Singularity Crucible.";
        this.objectiveTarget = { x: 6600, y: 2250 };
    }

    // ==========================================
    // DECK 5: SINGULARITY CRUCIBLE (PARADOX NEXUS & ENDGAME)
    // ==========================================
    buildDeck5(player, spawnX, spawnY) {
        this.width = 7200;
        this.height = 3600;

        player.x = spawnX !== null ? spawnX : 1800;
        player.y = spawnY !== null ? spawnY : 2250;
        player.currentTimeline = 'past';

        // Outer Hull Boundary
        this.addWall(0, 0, this.width, 50, 'both');
        this.addWall(0, this.height - 50, this.width, 50, 'both');
        this.addWall(0, 0, 50, this.height, 'both');
        this.addWall(this.width - 50, 0, 50, this.height, 'both');

        // --- Room (1,2): Final Anchorage & Save Station Epsilon ---
        this.saveStations.push(new SaveStation(1800, 2250, 'save_deck5_final', 5));
        this.terminals.push(new Terminal(1500, 2150, 'term_5_maya', 'Dr. Maya Lin Final Log - The Paradox of Unit-7', 'past'));

        this.addWall(2380, 1800, 40, 350, 'both');
        this.addWall(2380, 2350, 40, 350, 'both');

        // --- Room (2,2): Crucible Pylon Field (4 Chrono-Pylons) ---
        this.pylons.push(new ChronoPylon(2700, 2050, 'deck5_pylon_1', 'past'));
        this.pylons.push(new ChronoPylon(3300, 2050, 'deck5_pylon_2', 'future'));
        this.pylons.push(new ChronoPylon(2700, 2450, 'deck5_pylon_3', 'future'));
        this.pylons.push(new ChronoPylon(3300, 2450, 'deck5_pylon_4', 'past'));

        this.enemies.push(new Enemy(2850, 2250, 'stalker', 'future'));
        this.enemies.push(new Enemy(3150, 2250, 'stalker', 'future'));

        this.addWall(3580, 1800, 40, 350, 'both');
        this.addWall(3580, 2350, 40, 350, 'both');

        // --- Room (3,2): Singularity Core (CLIMAX BOSS: PARADOX NEXUS) ---
        const cx = 4200;
        const cy = 2250;
        // Central arena pillars
        this.addWall(cx - 280, cy - 280, 60, 60, 'both');
        this.addWall(cx + 220, cy - 280, 60, 60, 'both');
        this.addWall(cx - 280, cy + 220, 60, 60, 'both');
        this.addWall(cx + 220, cy + 220, 60, 60, 'both');

        this.boss = new BossTitan(cx, cy);

        // Pickups around boss arena
        this.pickups.push(new Pickup(cx - 300, cy, 'health'));
        this.pickups.push(new Pickup(cx + 300, cy, 'health'));
        this.pickups.push(new Pickup(cx, cy - 300, 'energy'));
        this.pickups.push(new Pickup(cx, cy + 300, 'health'));

        // --- Room (4,2): Cryo-Pod #404 (Maya) & Void Singularity Weapon ---
        if (!this.collectedPickups.has('upgrade_weapon_void')) {
            this.upgrades.push(new UpgradeItem(5400, 2250, 'upgrade_weapon_void', 'weapon_void', 'VOID SINGULARITY CANNON'));
        }
        this.terminals.push(new Terminal(5600, 2250, 'term_5_chamber_404', 'Stasis Chamber #404 // Unit-7 Consciousness Anchor', 'future'));

        this.exitPortal = null; // Destroy Paradox Nexus to win game!
        this.objectiveText = "Overload all 4 Chrono-Pylons in Room (2,2) to shatter the Paradox Nexus shield!";
        this.objectiveTarget = { x: cx, y: cy };
    }

    // ==========================================
    // GEOMETRY & HAZARD HELPERS
    // ==========================================
    addWall(x, y, w, h, timeline, type = 'wall', doorId = null, locked = false, color = '#00f0ff') {
        this.walls.push({ x, y, w, h, timeline, type, doorId, locked, color });
    }

    addHazard(x, y, w, h, timeline, damage, type = 'laser') {
        this.hazards.push({ x, y, w, h, timeline, damage, type });
    }

    checkWallCollision(px, py, radius, currentTimeline) {
        for (let i = 0; i < this.walls.length; i++) {
            const w = this.walls[i];
            // If door is unlocked, pass through!
            if (w.type === 'door' && w.doorId && this.unlockedDoors.has(w.doorId)) {
                continue;
            }
            if (w.timeline === 'both' || w.timeline === currentTimeline) {
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

    // ==========================================
    // RENDER PIPELINE
    // ==========================================
    render(ctx, playerTimeline, visorActive = false) {
        // 1. Hazards (Laser grids, acid pools, void tears)
        this.hazards.forEach(h => {
            const isSame = (playerTimeline === h.timeline || h.timeline === 'both');
            ctx.save();

            if (h.type === 'acid') {
                ctx.fillStyle = isSame ? 'rgba(0, 255, 100, 0.45)' : 'rgba(0, 255, 100, 0.1)';
                ctx.strokeStyle = '#00ff66';
                ctx.shadowColor = '#00ff66';
                ctx.shadowBlur = isSame ? 14 : 0;
                ctx.lineWidth = 2;
                ctx.fillRect(h.x, h.y, h.w, h.h);
                ctx.strokeRect(h.x, h.y, h.w, h.h);
            } else if (h.timeline === 'past') {
                ctx.fillStyle = isSame ? 'rgba(255, 0, 80, 0.75)' : 'rgba(255, 0, 80, 0.15)';
                ctx.shadowColor = '#ff0055';
                ctx.shadowBlur = isSame ? 16 : 0;
                ctx.fillRect(h.x, h.y, h.w, h.h);
            } else {
                ctx.fillStyle = isSame ? 'rgba(160, 0, 255, 0.7)' : 'rgba(160, 0, 255, 0.15)';
                ctx.shadowColor = '#d900ff';
                ctx.shadowBlur = isSame ? 16 : 0;
                ctx.fillRect(h.x, h.y, h.w, h.h);
            }
            ctx.restore();
        });

        // 2. Walls and Doors
        this.walls.forEach(w => {
            const isSame = (w.timeline === 'both' || w.timeline === playerTimeline);
            ctx.save();

            if (!isSame) {
                // If spectral visor is active, show hidden walls with high clarity!
                if (visorActive) {
                    ctx.strokeStyle = (w.timeline === 'past') ? 'rgba(0, 240, 255, 0.7)' : 'rgba(230, 0, 255, 0.7)';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([4, 2]);
                    ctx.strokeRect(w.x, w.y, w.w, w.h);
                } else {
                    ctx.strokeStyle = (w.timeline === 'past') ? 'rgba(0, 240, 255, 0.22)' : 'rgba(230, 0, 255, 0.22)';
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([4, 4]);
                    ctx.strokeRect(w.x, w.y, w.w, w.h);
                }
                ctx.restore();
                return;
            }

            if (w.type === 'door') {
                const isUnlocked = w.doorId && this.unlockedDoors.has(w.doorId);
                if (isUnlocked) {
                    // Open door frame outline
                    ctx.strokeStyle = 'rgba(0, 255, 170, 0.4)';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([6, 6]);
                    ctx.strokeRect(w.x, w.y, w.w, w.h);
                    ctx.restore();
                    return;
                }
                // Locked security door
                ctx.fillStyle = '#1c1528';
                ctx.strokeStyle = w.color || '#ffaa00';
                ctx.lineWidth = 3;
                ctx.shadowColor = w.color || '#ffaa00';
                ctx.shadowBlur = 12;
                ctx.fillRect(w.x, w.y, w.w, w.h);
                ctx.strokeRect(w.x, w.y, w.w, w.h);
            } else if (w.timeline === 'both') {
                ctx.fillStyle = '#101622';
                ctx.strokeStyle = '#223247';
                ctx.lineWidth = 2;
                ctx.fillRect(w.x, w.y, w.w, w.h);
                ctx.strokeRect(w.x, w.y, w.w, w.h);
            } else if (w.timeline === 'past') {
                ctx.fillStyle = '#142738';
                ctx.strokeStyle = '#00f0ff';
                ctx.lineWidth = 2.5;
                ctx.fillRect(w.x, w.y, w.w, w.h);
                ctx.strokeRect(w.x, w.y, w.w, w.h);
            } else {
                ctx.fillStyle = '#260a33';
                ctx.strokeStyle = '#d900ff';
                ctx.lineWidth = 2.5;
                ctx.fillRect(w.x, w.y, w.w, w.h);
                ctx.strokeRect(w.x, w.y, w.w, w.h);
            }
            ctx.restore();
        });

        // 3. Exit Portals & Elevators
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
            ctx.fillText(this.exitPortal.label || "WARP LIFT", 0, 4);
            ctx.restore();
        }
    }
}

window.LevelManager = LevelManager;
