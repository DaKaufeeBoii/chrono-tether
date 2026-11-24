/**
 * CHRONO TETHER: LAST RECORD OF THE NOMOS
 * Persistent Metroidvania Save & Progression System
 * Built on browser localStorage with Save Station Anchors
 */

class SaveManager {
    constructor() {
        this.STORAGE_KEY = 'chrono_tether_save_v1';
        this.saveNotificationTimer = 0;
    }

    hasSave() {
        try {
            return localStorage.getItem(this.STORAGE_KEY) !== null;
        } catch (e) {
            return false;
        }
    }

    getSaveHeader() {
        if (!this.hasSave()) return null;
        try {
            const data = JSON.parse(localStorage.getItem(this.STORAGE_KEY));
            return {
                deck: data.progression.currentDeck || 1,
                maxHp: data.player.maxHp || 100,
                weaponTier: data.player.weaponTier || 1,
                timeStr: this.formatTime(data.progression.elapsedSeconds || 0),
                completionPct: this.calculateCompletion(data)
            };
        } catch (e) {
            return null;
        }
    }

    formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    calculateCompletion(data) {
        let totalItems = 16 + 12 + 4; // Upgrades (16), Logs (12), Bosses (4)
        let collected = 0;
        if (data.progression.collectedPickups) collected += data.progression.collectedPickups.length;
        if (data.progression.readLogs) collected += data.progression.readLogs.length;
        if (data.progression.defeatedBosses) collected += data.progression.defeatedBosses.length;
        return Math.min(100, Math.round((collected / totalItems) * 100));
    }

    saveGame(game, stationId = null) {
        try {
            const p = game.player;
            const lm = game.levelManager;
            
            const saveData = {
                version: 1,
                timestamp: new Date().toISOString(),
                player: {
                    maxHp: p.maxHp,
                    maxEnergy: p.maxEnergy,
                    weaponTier: p.weaponTier || 1,
                    unlockedAbilities: { ...p.unlockedAbilities },
                    grenades: p.grenades || 3,
                    maxGrenades: p.maxGrenades || 5
                },
                progression: {
                    currentDeck: lm.currentDeck || 1,
                    spawnX: stationId ? p.x : 220,
                    spawnY: stationId ? p.y : 900,
                    stationId: stationId,
                    unlockedDoors: Array.from(lm.unlockedDoors || []),
                    activatedPylons: Array.from(lm.activatedPylons || []),
                    defeatedBosses: Array.from(lm.defeatedBosses || []),
                    collectedPickups: Array.from(lm.collectedPickups || []),
                    readLogs: Array.from(lm.readLogs || []),
                    causalityTriggers: { ...(lm.causalityTriggers || {}) },
                    exploredCells: Array.from(lm.exploredCells || []),
                    elapsedSeconds: game.stats.elapsedSeconds || 0,
                    phaseShifts: game.stats.phaseShifts || 0,
                    enemiesKilled: game.stats.enemiesKilled || 0
                }
            };

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.error("Save failed:", e);
            return false;
        }
    }

    loadGame(game) {
        if (!this.hasSave()) return false;
        try {
            const data = JSON.parse(localStorage.getItem(this.STORAGE_KEY));
            const p = game.player;
            const lm = game.levelManager;

            // Restore Player Caps & Upgrades
            p.maxHp = data.player.maxHp || 100;
            p.hp = p.maxHp;
            p.maxEnergy = data.player.maxEnergy || 100;
            p.energy = p.maxEnergy;
            p.weaponTier = data.player.weaponTier || 1;
            p.grenades = data.player.grenades || 3;
            p.maxGrenades = data.player.maxGrenades || 5;
            
            if (data.player.unlockedAbilities) {
                p.unlockedAbilities = { ...p.unlockedAbilities, ...data.player.unlockedAbilities };
            }

            // Restore Progression & World State
            lm.unlockedDoors = new Set(data.progression.unlockedDoors || []);
            lm.activatedPylons = new Set(data.progression.activatedPylons || []);
            lm.defeatedBosses = new Set(data.progression.defeatedBosses || []);
            lm.collectedPickups = new Set(data.progression.collectedPickups || []);
            lm.readLogs = new Set(data.progression.readLogs || []);
            lm.causalityTriggers = { ...(data.progression.causalityTriggers || {}) };
            lm.exploredCells = new Set(data.progression.exploredCells || []);

            // Stats
            game.stats.elapsedSeconds = data.progression.elapsedSeconds || 0;
            game.stats.phaseShifts = data.progression.phaseShifts || 0;
            game.stats.enemiesKilled = data.progression.enemiesKilled || 0;

            // Load Level Deck
            const deck = data.progression.currentDeck || 1;
            lm.loadDeck(deck, p);

            // Restore spawn position at save station
            if (data.progression.spawnX && data.progression.spawnY) {
                p.x = data.progression.spawnX;
                p.y = data.progression.spawnY;
            }

            return true;
        } catch (e) {
            console.error("Load failed:", e);
            return false;
        }
    }

    deleteSave() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (e) {
            return false;
        }
    }
}

window.SaveSystem = new SaveManager();
