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
        avatar: "icon-elena",
        image: "assets/cutscenes/memory_1.jpg",
        lines: [
            "Look out the observation window, <span class='hl-cyan'>Maya</span>... That little blue marble? That was our home.",
            "I know you're scared of the long cryo-sleep, but <span class='hl-gold'>Gliese 667Cc</span> has real oceans. Clear blue skies you can touch.",
            "Hold onto your toy starship, sweetheart. No matter how deep into the dark we go... <span class='hl-cyan'>Mom will always find you</span>."
        ]
    },
    'memory_2': {
        title: "MNEMONIC RECONSTRUCTION // SECTOR 02",
        subtitle: "BRIDGE TELEMETRY // 18 MINUTES BEFORE BREACH",
        speaker: "CAPTAIN VANCE",
        speakerTitle: "COMMANDING OFFICER // U.S.S. NOMOS",
        avatar: "icon-vance",
        image: "assets/cutscenes/memory_2.jpg",
        lines: [
            "Elena, step away from the reactor console! Did you see the final distress transmissions from Geneva?!",
            "There's no home to turn back to! Earth's solar grid is dead! We have to execute the <span class='hl-alert'>blind warp jump NOW!</span>",
            "I don't care about your spacetime manifold calculations! I have <span class='hl-gold'>eight hundred souls</span> in cryo, and I am saving them!"
        ]
    },
    'memory_3': {
        title: "MNEMONIC RECONSTRUCTION // SECTOR 03",
        subtitle: "EVENT HORIZON COLLISION // T-0 SECONDS",
        speaker: "A.T.L.A.S. TELEMETRY",
        speakerTitle: "SHIP AUTOMATED BLACK BOX",
        avatar: "icon-atlas",
        image: "assets/cutscenes/memory_3.jpg",
        lines: [
            "<span class='hl-alert'>CRITICAL TRAJECTORY FAILURE</span>: Warp field collapsed directly into micro-singularity Null-7.",
            "Local spacetime is experiencing catastrophic chronological shear. Reality is splitting into <span class='hl-magenta'>two overlapping epochs</span>.",
            "Hull integrity failing across all decks. All surviving crew, prepare for <span class='hl-magenta'>immediate temporal dislocation</span>!"
        ]
    },
    'memory_4': {
        title: "MNEMONIC RECONSTRUCTION // SECTOR 04",
        subtitle: "CRYO-CHAMBER #404 // 6 MINUTES AFTER BREACH",
        speaker: "DR. ELENA WARD",
        speakerTitle: "LAST LIVING RECORD",
        avatar: "icon-elena",
        image: "assets/cutscenes/memory_4.jpg",
        lines: [
            "My body... the chronal radiation is dissolving my cellular structure. I have only minutes left.",
            "<span class='hl-cyan'>Maya</span> is safe inside Stasis Pod #404. The containment field will hold, but the security airlocks are locked in time.",
            "There's only one chassis with the strength to endure the Singularity Core. <span class='hl-cyan'>UNIT-7</span>...",
            "Engram synchronization starting. Forget my mortal body. Remember Maya's face. <span class='hl-cyan'>Mommy is coming for you</span>."
        ]
    },
    'memory_5': {
        title: "MNEMONIC RECONSTRUCTION // SECTOR 05",
        subtitle: "ORBITAL DAWN // GLIESE 667Cc",
        speaker: "DR. ELENA WARD",
        speakerTitle: "NEURAL ECHO // UNIT-7 OPTIC BUFFER",
        avatar: "icon-unit7",
        image: "assets/cutscenes/memory_5.jpg",
        lines: [
            "The singularity has collapsed. The infinite paradox loop is finally broken.",
            "Escape Pod #404 trajectory confirmed... You made it, <span class='hl-cyan'>Maya</span>. Look at the <span class='hl-gold'>twin suns</span> rising over the ocean.",
            "You are going to grow up in the light. <span class='hl-cyan'>UNIT-7</span> battery reserve at 0.1%... <span class='hl-gold'>Sleep safe, my sweet girl</span>."
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
        this.displayedHTML = "";
        this.rawText = "";
        this.onCompleteCallback = null;

        // Visual & Ken Burns Camera Animation
        this.canvas = null;
        this.ctx = null;
        this.currentImg = new Image();
        this.imageLoaded = false;
        this.animTime = 0;
        this.trauma = 0;
        this.flash = 0;

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
        this.avatarEl = document.getElementById('memoryAvatarIcon');
        this.textEl = document.getElementById('memoryText');

        const skipBtn = document.getElementById('skipMemoryBtn');
        if (skipBtn) {
            skipBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.skip();
            });
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
        this.displayedHTML = "";
        this.onCompleteCallback = onComplete;
        this.animTime = 0;
        this.trauma = 0.5;
        this.flash = 0.8;
        this.active = true;

        if (this.titleEl) this.titleEl.innerText = data.title;
        if (this.subtitleEl) this.subtitleEl.innerText = data.subtitle;
        if (this.speakerEl) this.speakerEl.innerText = data.speaker;
        if (this.speakerTitleEl) this.speakerTitleEl.innerText = data.speakerTitle;
        if (this.textEl) this.textEl.innerHTML = "";

        if (this.avatarEl) {
            this.avatarEl.className = 'avatar-icon ' + (data.avatar || 'icon-elena');
        }

        // Cache raw plain text for typewriter timing calculation
        this.prepareLine();

        // Load artwork
        this.imageLoaded = false;
        this.currentImg.src = data.image;

        // Show Modal
        if (this.modal) {
            this.modal.style.display = 'flex';
        }

        // Audio: Start immersive cinematic darksynth atmosphere and pulse
        if (window.AudioEngine) {
            window.AudioEngine.startCutsceneAtmosphere();
            window.AudioEngine.playMnemonicPulse();
        }
    }

    prepareLine() {
        if (!this.currentData) return;
        const lineHTML = this.currentData.lines[this.currentLineIndex] || "";
        // Strip HTML tags to measure raw character count
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = lineHTML;
        this.rawText = tempDiv.textContent || tempDiv.innerText || "";
        this.targetHTML = lineHTML;
        this.charIndex = 0;
        this.typewriterTimer = 0;
    }

    update(dt) {
        if (!this.active || !this.currentData) return;
        this.animTime += dt;
        if (this.trauma > 0) this.trauma = Math.max(0, this.trauma - dt * 1.5);
        if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2.2);

        // Typewriter progress
        if (this.charIndex < this.rawText.length) {
            this.typewriterTimer += dt;
            if (this.typewriterTimer > 0.024) {
                this.typewriterTimer = 0;
                this.charIndex++;
                
                // Render revealed portion maintaining HTML tags
                this.updateTextDisplay();

                if (this.charIndex % 3 === 0 && window.AudioEngine) {
                    window.AudioEngine.playTypewriterChirp();
                }
            }
        }
    }

    updateTextDisplay() {
        if (!this.textEl) return;
        if (this.charIndex >= this.rawText.length) {
            this.textEl.innerHTML = this.targetHTML;
            return;
        }

        // Partially reveal tags while preserving styling
        let rawCount = 0;
        let inTag = false;
        let result = "";

        for (let i = 0; i < this.targetHTML.length; i++) {
            const ch = this.targetHTML[i];
            if (ch === '<') inTag = true;
            result += ch;
            if (ch === '>') {
                inTag = false;
                continue;
            }
            if (!inTag) {
                rawCount++;
                if (rawCount >= this.charIndex) {
                    // Close any open tags cleanly for valid DOM rendering
                    break;
                }
            }
        }
        this.textEl.innerHTML = result;
    }

    advance() {
        if (!this.active || !this.currentData) return;

        // If line is still typing, finish line instantly
        if (this.charIndex < this.rawText.length) {
            this.charIndex = this.rawText.length;
            if (this.textEl) this.textEl.innerHTML = this.targetHTML;
            return;
        }

        // Advance to next line
        this.currentLineIndex++;
        if (this.currentLineIndex >= this.currentData.lines.length) {
            this.end();
        } else {
            this.prepareLine();
            if (this.textEl) this.textEl.innerHTML = "";
            this.trauma = 0.35;
            if (window.AudioEngine) {
                window.AudioEngine.playGlitchImpact();
            }
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
        if (window.AudioEngine) {
            window.AudioEngine.stopCutsceneAtmosphere();
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

        // Screen Shake calculation
        let shakeX = 0;
        let shakeY = 0;
        if (this.trauma > 0) {
            const mag = this.trauma * this.trauma * 16;
            shakeX = (Math.random() - 0.5) * mag;
            shakeY = (Math.random() - 0.5) * mag;
        }

        // 1. Draw Image with Scene-Specific Cinematic Camera Choreography
        if (this.imageLoaded && this.currentImg.naturalWidth > 0) {
            let scale = 1.05;
            let panX = 0;
            let panY = 0;

            const mem = this.currentMemoryId;
            if (mem === 'memory_1') {
                // The Promise: Slow emotional zoom toward Elena & Maya
                scale = 1.04 + Math.min(this.animTime * 0.015, 0.12);
                panY = -Math.min(this.animTime * 3, 24);
            } else if (mem === 'memory_2') {
                // The Mutiny: Tense camera jitter with diagonal motion
                scale = 1.1 + Math.sin(this.animTime * 0.6) * 0.04;
                panX = Math.cos(this.animTime * 0.8) * 18;
                panY = Math.sin(this.animTime * 0.5) * 12;
            } else if (mem === 'memory_3') {
                // Chronal Collapse: Gravitational pull zoom towards singularity
                scale = 1.12 + Math.sin(this.animTime * 0.3) * 0.08;
                panX = Math.sin(this.animTime * 0.4) * 22;
            } else if (mem === 'memory_4') {
                // The Neural Transfer: Gentle downward pan from pod to UNIT-7
                scale = 1.06 + Math.sin(this.animTime * 0.1) * 0.04;
                panY = Math.min(this.animTime * 4, 30);
            } else if (mem === 'memory_5') {
                // Orbital Dawn: Wide horizontal sunrise pan across twin suns
                scale = 1.05;
                panX = -15 + this.animTime * 4;
            }

            ctx.save();
            ctx.translate(w / 2 + shakeX, h / 2 + shakeY);
            ctx.scale(scale, scale);
            ctx.drawImage(this.currentImg, -w / 2 + panX, -h / 2 + panY, w, h);
            ctx.restore();

            // Emergency red klaxon strobe on Bridge Mutiny
            if (mem === 'memory_2') {
                const strobe = Math.sin(this.animTime * 5) * 0.12 + 0.12;
                ctx.fillStyle = `rgba(255, 0, 50, ${strobe})`;
                ctx.fillRect(0, 0, w, h);
            }
        } else {
            // Stylized Procedural Background Fallback
            ctx.fillStyle = '#050914';
            ctx.fillRect(0, 0, w, h);

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
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        for (let y = 0; y < h; y += 4) {
            ctx.fillRect(0, y, w, 1.5);
        }

        // Chromatic Glitch Slice during singularity or memory tension
        const isGlitchScene = (this.currentMemoryId === 'memory_3' || this.currentMemoryId === 'memory_2');
        const glitchChance = isGlitchScene ? 0.25 : 0.08;
        if (Math.random() < glitchChance) {
            const sliceY = Math.random() * h;
            const sliceH = Math.random() * 30 + 6;
            const offset = (Math.random() - 0.5) * 22;
            ctx.drawImage(this.canvas, 0, sliceY, w, sliceH, offset, sliceY, w, sliceH);
        }

        // 3. Vignette & Film Border
        const gradient = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.78);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(2, 6, 14, 0.88)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // 4. White Screen Transition Flash
        if (this.flash > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.flash * 0.85})`;
            ctx.fillRect(0, 0, w, h);
        }

        // 5. Glowing HUD Telemetry Crosshairs & Frame Elements
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        // Top-left bracket
        ctx.moveTo(35, 70); ctx.lineTo(35, 35); ctx.lineTo(70, 35);
        // Top-right bracket
        ctx.moveTo(w - 70, 35); ctx.lineTo(w - 35, 35); ctx.lineTo(w - 35, 70);
        // Bottom-left bracket
        ctx.moveTo(35, h - 70); ctx.lineTo(35, h - 35); ctx.lineTo(70, h - 35);
        // Bottom-right bracket
        ctx.moveTo(w - 70, h - 35); ctx.lineTo(w - 35, h - 35); ctx.lineTo(w - 35, h - 70);
        ctx.stroke();

        // Subtle Center Target Crosshair
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 45, 0, Math.PI * 2);
        ctx.moveTo(w / 2 - 60, h / 2); ctx.lineTo(w / 2 + 60, h / 2);
        ctx.moveTo(w / 2, h / 2 - 60); ctx.lineTo(w / 2, h / 2 + 60);
        ctx.stroke();
    }
}

window.CutsceneSystem = new CutsceneManager();
