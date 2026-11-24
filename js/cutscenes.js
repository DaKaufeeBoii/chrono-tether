/**
 * CHRONO TETHER: LAST RECORD OF THE NOMOS
 * Neural Mnemonic Cutscene System: Ken Burns Pan/Zoom, CRT Shaders, Subtitles & Memory Flashbacks
 */

const MNEMONIC_DATA = {
    'memory_1': {
        title: "MNEMONIC RECONSTRUCTION // SECTOR 01",
        subtitle: "EARTH ORBITAL CUPOLA // T-MINUS 14 YEARS",
        speaker: "DR. ELENA WARD",
        speakerTitle: "CHIEF TEMPORAL PHYSICIST",
        image: "assets/cutscenes/memory_1.jpg",
        lines: [
            "Look out the observation window, Maya... That little blue marble? That was our home.",
            "I know you're scared of the long cryo-sleep, but Gliese 667Cc has real oceans. Clear blue skies you can touch.",
            "Hold onto your toy starship, sweetheart. No matter how deep into the dark we go... Mom will always find you."
        ]
    },
    'memory_2': {
        title: "MNEMONIC RECONSTRUCTION // SECTOR 02",
        subtitle: "BRIDGE TELEMETRY // 18 MINUTES BEFORE BREACH",
        speaker: "CAPTAIN VANCE",
        speakerTitle: "COMMANDING OFFICER // U.S.S. NOMOS",
        image: "assets/cutscenes/memory_2.jpg",
        lines: [
            "Elena, step away from the reactor console! Did you see the final distress transmissions from Geneva?!",
            "There's no home to turn back to! Earth's solar grid is dead! We have to execute the blind warp jump NOW!",
            "I don't care about your spacetime manifold calculations! I have eight hundred souls in cryo, and I am saving them!"
        ]
    },
    'memory_3': {
        title: "MNEMONIC RECONSTRUCTION // SECTOR 03",
        subtitle: "EVENT HORIZON COLLISION // T-0 SECONDS",
        speaker: "A.T.L.A.S. TELEMETRY",
        speakerTitle: "SHIP AUTOMATED BLACK BOX",
        image: "assets/cutscenes/memory_3.jpg",
        lines: [
            "CRITICAL TRAJECTORY FAILURE: Warp field collapsed directly into micro-singularity Null-7.",
            "Local spacetime is experiencing catastrophic chronological shear. Reality is splitting into two overlapping epochs.",
            "Hull integrity failing across all decks. All surviving crew, prepare for immediate temporal dislocation!"
        ]
    },
    'memory_4': {
        title: "MNEMONIC RECONSTRUCTION // SECTOR 04",
        subtitle: "CRYO-CHAMBER #404 // 6 MINUTES AFTER BREACH",
        speaker: "DR. ELENA WARD",
        speakerTitle: "LAST LIVING RECORD",
        image: "assets/cutscenes/memory_4.jpg",
        lines: [
            "My body... the chronal radiation is dissolving my cellular structure. I have only minutes left.",
            "Maya is safe inside Stasis Pod #404. The containment field will hold, but the security airlocks are locked in time.",
            "There's only one chassis with the strength to endure the Singularity Core. UNIT-7...",
            "Engram synchronization starting. Forget my mortal body. Remember Maya's face. Mommy is coming for you."
        ]
    },
    'memory_5': {
        title: "MNEMONIC RECONSTRUCTION // SECTOR 05",
        subtitle: "ORBITAL DAWN // GLIESE 667Cc",
        speaker: "DR. ELENA WARD",
        speakerTitle: "NEURAL ECHO // UNIT-7 OPTIC BUFFER",
        image: "assets/cutscenes/memory_5.jpg",
        lines: [
            "The singularity has collapsed. The infinite paradox loop is finally broken.",
            "Escape Pod #404 trajectory confirmed... You made it, Maya. Look at the twin suns rising over the ocean.",
            "You are going to grow up in the light. UNIT-7 battery reserve at 0.1%... Sleep safe, my sweet girl."
        ]
    }
};

class CutsceneManager {
    constructor() {
        this.active = false;
        this.currentMemoryId = null;
        this.currentData = null;
        this.currentLineIndex = 0;
        this.charIndex = 0;
        this.typewriterTimer = 0;
        this.displayedText = "";
        this.onCompleteCallback = null;

        // Visual & Ken Burns Camera Animation
        this.canvas = null;
        this.ctx = null;
        this.currentImg = new Image();
        this.imageLoaded = false;
        this.animTime = 0;

        // Fallback default image in case specific frame is loading
        this.currentImg.onload = () => {
            this.imageLoaded = true;
        };
    }

    init() {
        this.modal = document.getElementById('memoryModal');
        this.canvas = document.getElementById('memoryCanvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.titleEl = document.getElementById('memoryHeaderTitle');
        this.subtitleEl = document.getElementById('memoryHeaderSubtitle');
        this.speakerEl = document.getElementById('memorySpeaker');
        this.speakerTitleEl = document.getElementById('memorySpeakerTitle');
        this.textEl = document.getElementById('memoryText');

        const skipBtn = document.getElementById('skipMemoryBtn');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.skip());
        }

        if (this.canvas) {
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
        }
    }

    resizeCanvas() {
        if (!this.canvas) return;
        this.canvas.width = 1280;
        this.canvas.height = 720;
    }

    play(memoryId, onComplete = null) {
        const data = MNEMONIC_DATA[memoryId];
        if (!data) {
            if (onComplete) onComplete();
            return;
        }

        this.currentMemoryId = memoryId;
        this.currentData = data;
        this.currentLineIndex = 0;
        this.charIndex = 0;
        this.displayedText = "";
        this.onCompleteCallback = onComplete;
        this.animTime = 0;
        this.active = true;

        if (this.titleEl) this.titleEl.innerText = data.title;
        if (this.subtitleEl) this.subtitleEl.innerText = data.subtitle;
        if (this.speakerEl) this.speakerEl.innerText = data.speaker;
        if (this.speakerTitleEl) this.speakerTitleEl.innerText = data.speakerTitle;
        if (this.textEl) this.textEl.innerText = "";

        // Load artwork
        this.imageLoaded = false;
        this.currentImg.src = data.image;

        // Show Modal
        if (this.modal) {
            this.modal.style.display = 'flex';
        }

        // Audio shift: Muffled ambient memory pulse
        window.AudioEngine.playMnemonicPulse();
    }

    update(dt) {
        if (!this.active || !this.currentData) return;
        this.animTime += dt;

        // Typewriter subtitle progress
        const targetLine = this.currentData.lines[this.currentLineIndex];
        if (this.charIndex < targetLine.length) {
            this.typewriterTimer += dt;
            if (this.typewriterTimer > 0.028) {
                this.typewriterTimer = 0;
                this.charIndex++;
                this.displayedText = targetLine.substring(0, this.charIndex);
                if (this.textEl) this.textEl.innerText = this.displayedText;
                
                // Subtle typewriter sound chirp
                if (this.charIndex % 3 === 0) {
                    window.AudioEngine.playTypewriterChirp();
                }
            }
        }
    }

    advance() {
        if (!this.active || !this.currentData) return;

        const targetLine = this.currentData.lines[this.currentLineIndex];
        // If line is still typing, finish it immediately
        if (this.charIndex < targetLine.length) {
            this.charIndex = targetLine.length;
            this.displayedText = targetLine;
            if (this.textEl) this.textEl.innerText = this.displayedText;
            return;
        }

        // Otherwise move to next line
        this.currentLineIndex++;
        if (this.currentLineIndex >= this.currentData.lines.length) {
            this.end();
        } else {
            this.charIndex = 0;
            this.displayedText = "";
            if (this.textEl) this.textEl.innerText = "";
            window.AudioEngine.playMnemonicPulse();
        }
    }

    skip() {
        if (!this.active) return;
        this.end();
    }

    end() {
        this.active = false;
        if (this.modal) {
            this.modal.style.display = 'none';
        }
        const cb = this.onCompleteCallback;
        this.onCompleteCallback = null;
        if (cb) cb();
    }

    render() {
        if (!this.active || !this.ctx || !this.canvas) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        // 1. Draw Image with Cinematic Ken Burns Camera Motion (slow zoom & pan)
        if (this.imageLoaded && this.currentImg.naturalWidth > 0) {
            const scale = 1.0 + Math.sin(this.animTime * 0.15) * 0.08;
            const panX = Math.cos(this.animTime * 0.2) * 20;
            const panY = Math.sin(this.animTime * 0.18) * 12;

            ctx.save();
            ctx.translate(w / 2, h / 2);
            ctx.scale(scale, scale);
            ctx.drawImage(this.currentImg, -w / 2 + panX, -h / 2 + panY, w, h);
            ctx.restore();
        } else {
            // Stylized Procedural Background Fallback
            ctx.fillStyle = '#050914';
            ctx.fillRect(0, 0, w, h);

            // Rotating temporal wireframe rings
            ctx.save();
            ctx.translate(w / 2, h / 2);
            ctx.rotate(this.animTime * 0.3);
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 180 + Math.sin(this.animTime * 2) * 10, 0, Math.PI * 2);
            ctx.stroke();

            ctx.rotate(-this.animTime * 0.5);
            ctx.strokeStyle = '#d900ff';
            ctx.beginPath();
            ctx.arc(0, 0, 140, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // 2. CRT Scanlines & Screen Glitch Simulation
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        for (let y = 0; y < h; y += 4) {
            ctx.fillRect(0, y, w, 1.5);
        }

        // Occasional Chromatic Glitch Slice
        if (Math.random() < 0.12) {
            const sliceY = Math.random() * h;
            const sliceH = Math.random() * 25 + 5;
            const offset = (Math.random() - 0.5) * 16;
            ctx.drawImage(this.canvas, 0, sliceY, w, sliceH, offset, sliceY, w, sliceH);
        }

        // 3. Vignette & Film Border
        const gradient = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.75);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(2, 6, 14, 0.85)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // 4. Glowing HUD Telemetry Crosshairs
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Top-left bracket
        ctx.moveTo(30, 60); ctx.lineTo(30, 30); ctx.lineTo(60, 30);
        // Top-right bracket
        ctx.moveTo(w - 60, 30); ctx.lineTo(w - 30, 30); ctx.lineTo(w - 30, 60);
        // Bottom-left bracket
        ctx.moveTo(30, h - 60); ctx.lineTo(30, h - 30); ctx.lineTo(60, h - 30);
        // Bottom-right bracket
        ctx.moveTo(w - 60, h - 30); ctx.lineTo(w - 30, h - 30); ctx.lineTo(w - 30, h - 60);
        ctx.stroke();
    }
}

window.CutsceneSystem = new CutsceneManager();
