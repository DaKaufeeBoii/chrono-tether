/**
 * CHRONO TETHER: LAST RECORD OF THE NOMOS
 * Narrative Script, Audio Logs, Dialogue System & Lore
 */

const STORY_DATA = {
    // Terminals / Logs
    terminals: {
        'term_1_1': {
            sender: 'A.T.L.A.S. // SHIP MAIN-FRAME',
            title: 'BOOT PROTOCOL // CHRONAL ANOMALY DETECTED',
            portrait: 'atlas',
            color: '#00f0ff',
            lines: [
                "SYSTEM REBOOT: UNIT-7 Autonomous Maintenance Chassis initialized.",
                "CRITICAL WARNING: The colony ark U.S.S. Nomos has collided with micro-singularity NULL-7.",
                "Local spacetime is fractured across two simultaneous epochs: T-0 (Pristine Past) and T+60 (Ruined Void).",
                "Your chassis is equipped with an experimental Chronal Tether. Press [SPACE] or [RIGHT MOUSE] to phase between timelines.",
                "OBJECTIVE: Evacuate Cryo-Deck Alpha and reach Quantum Engineering."
            ]
        },
        'term_1_2': {
            sender: 'DR. ELENA WARD // AUDIO LOG #104',
            title: 'ANOMALY LOG // SABOTAGE',
            portrait: 'elena',
            color: '#00ffaa',
            lines: [
                "Audio log 104... Dr. Elena Ward recording. If anyone is picking this up...",
                "The singularity didn't pull us in by accident. Someone intentionally disabled the gravity stabilization coils.",
                "Captain Vance was terrified of the bio-quarantine alerts from Earth. He tried to force a blind hyperspace jump.",
                "Instead, he shattered time. Half of the ship is frozen in the moments before the crash. The other half is rotting sixty minutes in the future.",
                "I have to reach Maya in Cryo-Deck 404. I don't care if the ship is tearing apart—I'm getting to my daughter."
            ]
        },
        'term_2_1': {
            sender: 'CAPTAIN VANCE // SECURITY DIRECTIVE',
            title: 'ORDER 88 // IMMEDIATE SECTOR LOCKDOWN',
            portrait: 'vance',
            color: '#ff9900',
            lines: [
                "To all automated security units: Level 2 Engineering is under quarantine lockdown.",
                "The temporal paradox is generating hostiles—void aberrations born of collapsed probabilities.",
                "Laser barriers in T-0 are armed to lethal voltage. All personnel attempting to bypass will be neutralized.",
                "No one goes down to the Singularity Core. May God forgive us."
            ]
        },
        'term_2_2': {
            sender: 'DR. ELENA WARD // MEMORY CORE FRAGMENT',
            title: 'MNEMONIC ECHO // THE TETHER TRICK',
            portrait: 'elena',
            color: '#00ffaa',
            lines: [
                "Vance locked the titanium blast gates in the past, thinking he could seal off the core.",
                "He didn't realize: sixty minutes into the future, the void tears those exact blast gates into scrap iron!",
                "If you phase into the Future (T+60), you can walk right through the breached walls, then phase back to the Past (T-0) once you're on the other side!",
                "To whoever is piloting UNIT-7... please. Maya is sleeping in Cryo-Pod 404 at the center of the reactor. Save her."
            ]
        },
        'term_3_1': {
            sender: 'A.T.L.A.S. // SINGULARITY CORE SENSORS',
            title: 'EVENT HORIZON // PARADOX TITAN DETECTED',
            portrait: 'atlas',
            color: '#ff0055',
            lines: [
                "ALERT: Spacetime curvature infinite. The Paradox Nexus has materialized at the core.",
                "It is feeding on the chronal radiation of the ship's warp drive and blocking the emergency escape pods.",
                "Its defensive shields are anchored in both timelines. Overload the 4 Chrono-Pylons across the room to expose its core!",
                "UNIT-7 neural buffer synchronization at 99.8%... Dr. Ward? Is that... you?"
            ]
        },
        'term_1_vault': {
            sender: 'SECURITY OVERSEER // LOG ENTRY 9',
            title: 'DATA VAULT ENCRYPTION',
            portrait: 'vance',
            color: '#ffaa00',
            lines: [
                "Containment protocol engaged for Sector 1 server banks.",
                "Reinforced armor plates deployed to shield the secondary neural core.",
                "Hull expansion container cached at coordinates. Authorized personnel only."
            ]
        },
        'term_1_shaft': {
            sender: 'ENGINEERING COMM // LIFT MONITORS',
            title: 'TRANSIT ELEVATOR SECTOR 2',
            portrait: 'elena',
            color: '#00f0ff',
            lines: [
                "Elevator to Deck 2 locked behind the Maintenance Overseer security loop.",
                "To reboot transit: defeat the rogue Overseer Mech at the end of the central gantry."
            ]
        },
        'term_2_seed_manual': {
            sender: 'BOTANY LAB // ARCHIVE #44',
            title: 'TACHYON HYDRO-SPORE REPRODUCTION',
            portrait: 'elena',
            color: '#00ff88',
            lines: [
                "Note on Project Chrono-Flora: The genetically spliced tachyon vines respond to temporal anchoring.",
                "If a seed pod is planted in the pristine past (T-0), it will accelerate through six decades of growth in the future (T+60).",
                "Its calcified vines can bridge entire chasms and acid lakes!"
            ]
        },
        'term_2_spore_terminal': {
            sender: 'INCUBATOR RELAY // SEED CONTROL',
            title: 'CAUSALITY SEED DISPENSER',
            portrait: 'atlas',
            color: '#00ff88',
            lines: [
                "Incubator primed with active Tachyon Hydro-Spore.",
                "Interacting with this console in the Past will plant the spore.",
                "Within sixty minutes in the ruined future, massive bioluminescent vines will bridge the acid trench."
            ]
        },
        'term_3_goliath': {
            sender: 'CHIEF PHYSICIST KAUFMAN // LOG 801',
            title: 'GRAVITON GOLIATH CONTAINMENT',
            portrait: 'vance',
            color: '#7700ff',
            lines: [
                "The Goliath was designed to stabilize the Tachyon singularity.",
                "Now that spacetime has fractured, its grav-plates are firing in reverse.",
                "Do not engage without EMP disruption grenades to short-circuit its magnetic shielding."
            ]
        },
        'term_4_rift': {
            sender: 'A.T.L.A.S. // SUB-HULL TELEMETRY',
            title: 'SPACETIME CLEAVAGE REPORT',
            portrait: 'atlas',
            color: '#d900ff',
            lines: [
                "Warning: Hull breach detected in Sector 4. Outer space exposure.",
                "Phase-Dash Matrix required to pass through electrified high-voltage fields without taking kinetic damage.",
                "The Spectral Visor will reveal dimensional tears and invisible anomaly platforms."
            ]
        },
        'term_5_maya': {
            sender: 'DR. ELENA WARD // FINAL WILL & TESTAMENT',
            title: 'THE PARADOX OF UNIT-7',
            portrait: 'elena',
            color: '#00ffaa',
            lines: [
                "If you are reading this through UNIT-7's optical sensors...",
                "You are me. Before the singularity crushed my mortal body, I transferred my neural engram into this chassis.",
                "I stayed behind so you could pull Maya out of Stasis Pod 404.",
                "Break the loop, Elena. Save our daughter."
            ]
        },
        'term_5_chamber_404': {
            sender: 'STASIS POD #404 TELEMETRY',
            title: 'MAYA WARD // VITAL SIGNS: STABLE',
            portrait: 'elena',
            color: '#00ffaa',
            lines: [
                "Occupant: Maya Ward. Age: 7. Cryo-Stasis suspension optimal.",
                "Heart rate: 12 bpm. Brainwave activity: Dream state alpha.",
                "Singularity shield holding. Destroy the Paradox Nexus to initiate escape launch!"
            ]
        }
    },

    // In-game dialogue popups triggered at key story milestones
    cutscenes: {
        'intro': [
            { sender: 'A.T.L.A.S.', text: "Neural tether linked. Chassis online. Welcome back, UNIT-7." },
            { sender: 'UNIT-7 (YOU)', text: "Where am I...? My hands... they're titanium alloy. What happened to the Nomos?" },
            { sender: 'A.T.L.A.S.', text: "The ship is caught in a temporal shear. Press [SPACE] to toggle your chronal phase. Walk through the breaches in the future." }
        ],
        'saw_locked_gate': [
            { sender: 'UNIT-7 (YOU)', text: "The blast door is locked with biometric clearance in the Past..." },
            { sender: 'A.T.L.A.S.', text: "Phase into the Future (T+60). In the future, the bulkhead collapsed. You can bypass the obstruction." }
        ],
        'boss_intro': [
            { sender: 'THE PARADOX NEXUS', text: "ALL TIMELINES CONVERGE INTO OBLIVION. YOU CANNOT UNWRITE WHAT HAS BEEN RIPPED ASUNDER." },
            { sender: 'UNIT-7 (ELENA)', text: "I remember now... I didn't build this machine to survive. I built it so Maya could." },
            { sender: 'A.T.L.A.S.', text: "Pylons charged. Weapons free. Break the singularity, Dr. Ward!" }
        ],
        'boss_defeat': [
            { sender: 'A.T.L.A.S.', text: "Singularity collapsed! Cryo-Pod 404 is intact. Escape trajectory locked for Gliese 667Cc." },
            { sender: 'MAYA WARD', text: "Mom...? Is that you? Are the stars waking up now?" },
            { sender: 'UNIT-7 (ELENA)', text: "Yes, sweetheart. Sleep safe now. You're going to reach the new world. Mom's right here." },
            { sender: 'A.T.L.A.S.', text: "Tether severed. Escape pod launched successfully. Mission accomplished." }
        ]
    }
};

class DialogueManager {
    constructor() {
        this.active = false;
        this.currentScript = [];
        this.currentIndex = 0;
        this.displayedText = "";
        this.targetText = "";
        this.charIndex = 0;
        this.typeSpeed = 0.025; // seconds per char
        this.typeTimer = 0;
        this.sender = "";
        this.onComplete = null;
        this.tonePitch = 440;
    }

    start(dialogueList, onComplete = null) {
        if (!dialogueList || dialogueList.length === 0) return;
        this.active = true;
        this.currentScript = dialogueList;
        this.currentIndex = 0;
        this.onComplete = onComplete;
        this.loadLine(0);
    }

    loadLine(idx) {
        if (idx >= this.currentScript.length) {
            this.close();
            return;
        }
        const item = this.currentScript[idx];
        this.sender = item.sender || "COMM TRANSMISSION";
        this.targetText = item.text || item;
        this.displayedText = "";
        this.charIndex = 0;
        this.typeTimer = 0;

        // Choose tone pitch based on speaker
        if (this.sender.includes("A.T.L.A.S")) this.tonePitch = 520;
        else if (this.sender.includes("ELENA") || this.sender.includes("YOU")) this.tonePitch = 440;
        else if (this.sender.includes("VANCE")) this.tonePitch = 280;
        else if (this.sender.includes("MAYA")) this.tonePitch = 640;
        else this.tonePitch = 380;
    }

    update(dt) {
        if (!this.active) return;

        if (this.charIndex < this.targetText.length) {
            this.typeTimer += dt;
            if (this.typeTimer >= this.typeSpeed) {
                this.typeTimer = 0;
                this.charIndex++;
                this.displayedText = this.targetText.substring(0, this.charIndex);
                
                // Play subtle synthetic chirp for text
                if (this.charIndex % 2 === 0) {
                    window.AudioEngine.playDialogBlip(this.tonePitch);
                }
            }
        }
    }

    advance() {
        if (!this.active) return;
        // If still typing, skip to full line immediately
        if (this.charIndex < this.targetText.length) {
            this.charIndex = this.targetText.length;
            this.displayedText = this.targetText;
        } else {
            // Move to next line
            this.currentIndex++;
            this.loadLine(this.currentIndex);
        }
    }

    close() {
        this.active = false;
        if (this.onComplete) {
            const cb = this.onComplete;
            this.onComplete = null;
            cb();
        }
    }
}

window.DialogueSystem = new DialogueManager();
