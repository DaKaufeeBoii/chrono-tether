/**
 * CHRONO TETHER: LAST RECORD OF THE NOMOS
 * Metroidvania Minimap & Fullscreen World Map System
 */

class WorldMapManager {
    constructor() {
        this.isOpen = false;
        this.activeDeckTab = 1;
        this.deckDefinitions = {
            1: { name: "DECK 1: CRYO-STASIS HUB", cols: 6, rows: 4, rooms: {} },
            2: { name: "DECK 2: HYDRO-SILOS & BIOLAB", cols: 6, rows: 4, rooms: {} },
            3: { name: "DECK 3: TACHYON GRAV-LABS", cols: 6, rows: 4, rooms: {} },
            4: { name: "DECK 4: SUB-HULL VOID RIFT", cols: 6, rows: 4, rooms: {} },
            5: { name: "DECK 5: SINGULARITY CRUCIBLE", cols: 6, rows: 4, rooms: {} }
        };

        this.initDeckLayouts();
    }

    initDeckLayouts() {
        // Define room cells [col, row]: { type: 'normal'|'save'|'boss'|'item'|'portal', doors: ['left','right','top','bottom'] }
        // Deck 1: Cryo Hub
        this.deckDefinitions[1].rooms = {
            "0,2": { type: "normal", label: "Cryo Awakening", doors: ["right"] },
            "1,2": { type: "save", label: "Save Pod Alpha", doors: ["left", "right", "top"] },
            "1,1": { type: "normal", label: "Security Corridor", doors: ["bottom", "right"] },
            "2,1": { type: "item", label: "Server Vault", doors: ["left", "right"] },
            "3,1": { type: "normal", label: "Transit Gantry", doors: ["left", "bottom", "right"] },
            "2,2": { type: "normal", label: "Central Plaza", doors: ["left", "right"] },
            "3,2": { type: "normal", label: "Central Transit Shaft", doors: ["top", "left", "right", "bottom"] },
            "4,2": { type: "boss", label: "Overseer Arena", doors: ["left", "right"] },
            "5,2": { type: "portal", label: "Deck 2 Elevator", doors: ["left"] }
        };

        // Deck 2: Hydro-Silos
        this.deckDefinitions[2].rooms = {
            "0,2": { type: "portal", label: "Elevator from Deck 1", doors: ["right"] },
            "1,2": { type: "normal", label: "Biolab Antechamber", doors: ["left", "right", "top"] },
            "1,1": { type: "save", label: "Save Pod Beta", doors: ["bottom", "right"] },
            "2,1": { type: "normal", label: "Temporal Seed Pod", doors: ["left", "right"] },
            "3,1": { type: "item", label: "Grapple Vault", doors: ["left"] },
            "2,2": { type: "normal", label: "Acid Trench", doors: ["left", "right"] },
            "3,2": { type: "normal", label: "Overgrown Silo", doors: ["left", "right", "bottom"] },
            "3,3": { type: "item", label: "HP Tank Anomaly", doors: ["top"] },
            "4,2": { type: "boss", label: "Chrono-Flora Hive", doors: ["left", "right"] },
            "5,2": { type: "portal", label: "Deck 3 Accelerator Gate", doors: ["left"] }
        };

        // Deck 3: Tachyon Grav-Labs
        this.deckDefinitions[3].rooms = {
            "0,2": { type: "portal", label: "Deck 2 Transit Gate", doors: ["right"] },
            "1,2": { type: "normal", label: "Zero-G Corridor", doors: ["left", "right", "bottom"] },
            "1,3": { type: "save", label: "Save Pod Gamma", doors: ["top"] },
            "2,2": { type: "item", label: "EMP Grenade Lab", doors: ["left", "right", "top"] },
            "2,1": { type: "item", label: "Portal Weaver Relays", doors: ["bottom"] },
            "3,2": { type: "normal", label: "Magnetic Rails", doors: ["left", "right"] },
            "4,2": { type: "boss", label: "Grav-Goliath Arena", doors: ["left", "right"] },
            "5,2": { type: "portal", label: "Deck 4 Hull Breach", doors: ["left"] }
        };

        // Deck 4: Sub-Hull Void Rift
        this.deckDefinitions[4].rooms = {
            "0,2": { type: "portal", label: "Airlock from Deck 3", doors: ["right"] },
            "1,2": { type: "normal", label: "Vacuum Drift", doors: ["left", "right", "top"] },
            "1,1": { type: "save", label: "Save Pod Delta", doors: ["bottom"] },
            "2,2": { type: "item", label: "Phase-Dash Vault", doors: ["left", "right"] },
            "3,2": { type: "normal", label: "Spacetime Bleed Chasm", doors: ["left", "right", "bottom"] },
            "3,3": { type: "item", label: "Visor Spectral Vault", doors: ["top"] },
            "4,2": { type: "normal", label: "Event Horizon Gate", doors: ["left", "right"] },
            "5,2": { type: "portal", label: "Deck 5 Crucible Airlock", doors: ["left"] }
        };

        // Deck 5: Singularity Crucible
        this.deckDefinitions[5].rooms = {
            "1,2": { type: "save", label: "Final Anchorage", doors: ["right"] },
            "2,2": { type: "normal", label: "Crucible Pylon Field", doors: ["left", "right"] },
            "3,2": { type: "boss", label: "Singularity Core", doors: ["left", "right"] },
            "4,2": { type: "item", label: "Cryo-Pod #404 (Maya)", doors: ["left"] }
        };
    }

    toggleMap(game) {
        this.isOpen = !this.isOpen;
        const modal = document.getElementById('mapModal');
        if (modal) {
            modal.style.display = this.isOpen ? 'flex' : 'none';
            if (this.isOpen) {
                this.activeDeckTab = game.levelManager.currentDeck || 1;
                this.renderFullscreenMap(game);
            }
        }
    }

    renderMinimap(ctx, game) {
        const lm = game.levelManager;
        const p = game.player;
        const currentDeck = lm.currentDeck || 1;
        const deckData = this.deckDefinitions[currentDeck];
        if (!deckData) return;

        // Clear Minimap canvas
        ctx.clearRect(0, 0, 160, 100);

        // Calculate player grid room
        const roomW = 1200;
        const roomH = 900;
        const curCol = Math.max(0, Math.min(deckData.cols - 1, Math.floor(p.x / roomW)));
        const curRow = Math.max(0, Math.min(deckData.rows - 1, Math.floor(p.y / roomH)));
        const cellId = `${currentDeck}_${curCol}_${curRow}`;
        lm.exploredCells.add(cellId);

        const cellSize = 16;
        const startX = 80 - curCol * (cellSize + 4);
        const startY = 50 - curRow * (cellSize + 4);

        for (let key in deckData.rooms) {
            const [c, r] = key.split(',').map(Number);
            const rId = `${currentDeck}_${c}_${r}`;
            const isExplored = lm.exploredCells.has(rId);

            if (isExplored || (Math.abs(c - curCol) <= 1 && Math.abs(r - curRow) <= 1)) {
                const x = startX + c * (cellSize + 4);
                const y = startY + r * (cellSize + 4);
                const room = deckData.rooms[key];

                ctx.save();
                ctx.fillStyle = isExplored ? 'rgba(0, 240, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)';
                ctx.strokeStyle = isExplored ? '#00f0ff' : 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 1.5;

                if (room.type === 'save') ctx.strokeStyle = '#00ffaa';
                else if (room.type === 'boss') ctx.strokeStyle = '#ff0055';
                else if (room.type === 'item') ctx.strokeStyle = '#ffff00';

                ctx.fillRect(x, y, cellSize, cellSize);
                ctx.strokeRect(x, y, cellSize, cellSize);

                // Player dot
                if (c === curCol && r === curRow) {
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = '#00f0ff';
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.arc(x + cellSize / 2, y + cellSize / 2, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
        }
    }

    renderFullscreenMap(game) {
        const canvas = document.getElementById('fullMapCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const lm = game.levelManager;
        const p = game.player;

        const deckData = this.deckDefinitions[this.activeDeckTab];
        if (!deckData) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Deck Name
        document.getElementById('mapDeckTitle').innerText = deckData.name;

        // Calculate Completion %
        const totalRooms = Object.keys(deckData.rooms).length;
        let exploredCount = 0;
        for (let key in deckData.rooms) {
            const [c, r] = key.split(',').map(Number);
            if (lm.exploredCells.has(`${this.activeDeckTab}_${c}_${r}`)) exploredCount++;
        }
        const pct = Math.round((exploredCount / Math.max(1, totalRooms)) * 100);
        document.getElementById('mapCompletionVal').innerText = `${pct}%`;

        // Render Room Grid
        const cellSize = 64;
        const gap = 12;
        const offsetX = (canvas.width - (deckData.cols * (cellSize + gap))) / 2;
        const offsetY = (canvas.height - (deckData.rows * (cellSize + gap))) / 2;

        for (let key in deckData.rooms) {
            const [c, r] = key.split(',').map(Number);
            const room = deckData.rooms[key];
            const cellId = `${this.activeDeckTab}_${c}_${r}`;
            const isExplored = lm.exploredCells.has(cellId);

            const x = offsetX + c * (cellSize + gap);
            const y = offsetY + r * (cellSize + gap);

            ctx.save();
            if (isExplored) {
                // Room background & border
                ctx.fillStyle = 'rgba(8, 24, 42, 0.85)';
                let borderCol = '#00f0ff';
                if (room.type === 'save') borderCol = '#00ffaa';
                else if (room.type === 'boss') borderCol = '#ff0055';
                else if (room.type === 'item') borderCol = '#ffff00';
                else if (room.type === 'portal') borderCol = '#d900ff';

                ctx.strokeStyle = borderCol;
                ctx.shadowColor = borderCol;
                ctx.shadowBlur = 10;
                ctx.lineWidth = 2.5;

                ctx.fillRect(x, y, cellSize, cellSize);
                ctx.strokeRect(x, y, cellSize, cellSize);

                // Room type icon
                ctx.fillStyle = borderCol;
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                let icon = "";
                if (room.type === 'save') icon = "[S]";
                else if (room.type === 'boss') icon = "[!]";
                else if (room.type === 'item') icon = "[?]";
                else if (room.type === 'portal') icon = "[O]";
                ctx.fillText(icon, x + cellSize / 2, y + cellSize / 2 + 4);

                // Player location blip if on this deck
                if (this.activeDeckTab === lm.currentDeck) {
                    const curCol = Math.floor(p.x / 1200);
                    const curRow = Math.floor(p.y / 900);
                    if (c === curCol && r === curRow) {
                        const pulse = Math.sin(Date.now() * 0.008) * 3;
                        ctx.fillStyle = '#ffffff';
                        ctx.shadowColor = '#00ffaa';
                        ctx.shadowBlur = 12;
                        ctx.beginPath();
                        ctx.arc(x + cellSize / 2, y + cellSize / 2, 7 + pulse, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            } else {
                // Undiscovered room wireframe hint
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.setLineDash([4, 4]);
                ctx.strokeRect(x, y, cellSize, cellSize);
            }
            ctx.restore();
        }
    }
}

window.MapSystem = new WorldMapManager();
