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
