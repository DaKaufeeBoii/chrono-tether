/**
 * CHRONO TETHER: LAST RECORD OF THE NOMOS
 * Procedural Audio & Dynamic Dual-Timeline Synthesizer
 * Built with standard Web Audio API - zero external audio files needed!
 */

class SoundSystem {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.timelineFilter = null;
        this.currentTimeline = 'past'; // 'past' (T-0) or 'future' (T+60)
        
        this.initialized = false;
        this.muted = false;
        this.volume = 0.7;

        // Music loop tracking
        this.isPlayingMusic = false;
        this.musicBeat = 0;
        this.musicTempo = 118; // BPM
        this.musicTimer = null;
        this.musicMode = 'explore'; // 'explore' or 'boss'
        
        // Progression chords (in Hz)
        // D minor / F / C / Bb progression
        this.chords = [
            [146.83, 220.00, 261.63, 349.23], // Dm7 (D3, A3, C4, F4)
            [174.61, 220.00, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
            [130.81, 196.00, 246.94, 293.66], // C (C3, G3, B3, D4)
            [116.54, 174.61, 233.08, 293.66]  // Bbmaj7 (Bb2, F3, Bb3, D4)
        ];
        this.bossChords = [
            [146.83, 220.00, 293.66, 311.13], // Dm/Eb tension
            [138.59, 207.65, 277.18, 329.63], // C#dim
            [146.83, 220.00, 293.66, 349.23], // Dm
            [110.00, 164.81, 220.00, 277.18]  // A7sus4
        ];
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();

            // Master Gain
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            // SFX Bus
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
            this.sfxGain.connect(this.masterGain);

            // Music Timeline Filter (Dynamic timbre shift between Past and Future!)
            this.timelineFilter = this.ctx.createBiquadFilter();
            this.timelineFilter.type = 'lowpass';
            this.timelineFilter.frequency.setValueAtTime(12000, this.ctx.currentTime);
            this.timelineFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

            // Music Bus
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.setValueAtTime(0.38, this.ctx.currentTime);
            this.musicGain.connect(this.timelineFilter);
            this.timelineFilter.connect(this.masterGain);

            // Pre-allocate Snare Noise Buffer
            const bufferSize = Math.floor(this.ctx.sampleRate * 0.1);
            this.snareBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = this.snareBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.03));
            }

            this.initialized = true;
            this.startMusic();
        } catch (e) {
            console.warn("Web Audio API could not initialize:", e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setTimeline(timeline) {
        if (!this.initialized) return;
        this.currentTimeline = timeline;
        const now = this.ctx.currentTime;
        
        // Dynamically shift audio filter when reality phases with click-free anchoring!
        const currentFreq = Math.max(20, this.timelineFilter.frequency.value);
        this.timelineFilter.frequency.cancelScheduledValues(now);
        this.timelineFilter.frequency.setValueAtTime(currentFreq, now);

        if (timeline === 'past') {
            // T-0: Bright, open high-frequency shimmer, crisp technological neon
            this.timelineFilter.frequency.exponentialRampToValueAtTime(14000, now + 0.35);
            this.timelineFilter.Q.setValueAtTime(1.8, now);
        } else {
            // T+60: Deep, suffocating, resonant void low-pass, decayed temporal echo
            this.timelineFilter.frequency.exponentialRampToValueAtTime(650, now + 0.35);
            this.timelineFilter.Q.setValueAtTime(4.0, now);
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
        }
        return this.muted;
    }

    setVolume(val) {
        this.volume = Math.max(0, Math.min(1, val));
        if (this.masterGain && this.ctx && !this.muted) {
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        }
    }

    setMusicMode(mode) {
        if (this.musicMode !== mode) {
            this.musicMode = mode;
            this.musicTempo = (mode === 'boss') ? 134 : 118;
        }
    }

    // ==========================================
    // PROCEDURAL MUSIC GENERATOR
    // ==========================================
    startMusic() {
        if (this.isPlayingMusic) return;
        this.isPlayingMusic = true;
        this.scheduleNextBeat();
    }

    scheduleNextBeat() {
        if (!this.isPlayingMusic || !this.ctx) return;
        
        const secondsPerBeat = 60.0 / this.musicTempo / 4; // 16th notes
        this.playBeatStep(this.musicBeat);
        this.musicBeat = (this.musicBeat + 1) % 64;

        this.musicTimer = setTimeout(() => {
            this.scheduleNextBeat();
        }, secondsPerBeat * 1000);
    }

    playBeatStep(step) {
        if (!this.ctx || this.muted) return;
        const now = this.ctx.currentTime;
        const currentChords = this.musicMode === 'boss' ? this.bossChords : this.chords;
        const chordIdx = Math.floor(step / 16) % currentChords.length;
        const chord = currentChords[chordIdx];
        const stepInBar = step % 16;

        // 1. Kick on 0, 4, 8, 12 in Boss; 0, 8 in Explore
        if (this.musicMode === 'boss') {
            if (stepInBar === 0 || stepInBar === 4 || stepInBar === 8 || stepInBar === 12) {
                this.playSynthKick(now);
            }
            if (stepInBar === 4 || stepInBar === 12) {
                this.playSynthSnare(now);
            }
        } else {
            if (stepInBar === 0 || stepInBar === 8) {
                this.playSynthKick(now);
            }
            if (stepInBar === 8) {
                this.playSynthHiHat(now, 0.08);
            }
        }

        // 2. Closed Hi-hat on 16ths
        if (stepInBar % 2 === 0) {
            this.playSynthHiHat(now, stepInBar % 4 === 2 ? 0.04 : 0.02);
        }

        // 3. Bassline on 8ths
        if (stepInBar % 2 === 0) {
            const rootFreq = chord[0] * 0.5; // Octave down
            const bassFreq = (stepInBar === 6 || stepInBar === 14) ? rootFreq * 1.25 : rootFreq;
            this.playSynthBass(bassFreq, now, 0.16);
        }

        // 4. Arpeggiator Melody
        const arpNotes = [chord[0], chord[1], chord[2], chord[3], chord[2] * 2, chord[1] * 2, chord[3], chord[0] * 2];
        const noteFreq = arpNotes[stepInBar % arpNotes.length];
        if (stepInBar % 2 === 1 || this.musicMode === 'boss') {
            this.playSynthArp(noteFreq, now, 0.12);
        }

        // 5. Ambient Pad on downbeat of each bar
        if (stepInBar === 0) {
            this.playSynthPad(chord, now, (60 / this.musicTempo) * 4);
        }
    }

    playSynthKick(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, time);
        osc.frequency.exponentialRampToValueAtTime(32, time + 0.14);
        gain.gain.setValueAtTime(0.7, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(time);
        osc.stop(time + 0.16);
    }

    playSynthSnare(time) {
        if (!this.snareBuffer) return;
        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = this.snareBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 800;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        whiteNoise.start(time);
    }

    playSynthHiHat(time, vol = 0.03) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(7500 + Math.random() * 500, time);
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(time);
        osc.stop(time + 0.04);
    }

    playSynthBass(freq, time, dur) {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 3.5, time);
        filter.frequency.exponentialRampToValueAtTime(freq * 1.2, time + dur);

        gain.gain.setValueAtTime(0.28, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        osc.start(time);
        osc.stop(time + dur);
    }

    playSynthArp(freq, time, dur) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(time);
        osc.stop(time + dur);
    }

    playSynthPad(chord, time, duration) {
        chord.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            // Slight detune for thick warm analog pad sound
            osc.detune.setValueAtTime((idx % 2 === 0 ? 7 : -7), time);
            osc.frequency.setValueAtTime(freq * 2, time);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1800, time);

            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(0.04, time + 0.8);
            gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);
            osc.start(time);
            osc.stop(time + duration);
        });
    }

    // ==========================================
    // PROCEDURAL SOUND EFFECTS (SFX)
    // ==========================================

    playPhaseShift(toPast = true) {
        if (!this.initialized || this.muted) return;
        const now = this.ctx.currentTime;

        // Sub-bass thump
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(160, now);
        subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.35);
        subGain.gain.setValueAtTime(0.8, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        subOsc.connect(subGain);
        subGain.connect(this.sfxGain);
        subOsc.start(now);
        subOsc.stop(now + 0.35);

        // Reality tear frequency sweep
        const sweepOsc = this.ctx.createOscillator();
        const sweepGain = this.ctx.createGain();
        sweepOsc.type = toPast ? 'sawtooth' : 'triangle';
        const startFreq = toPast ? 220 : 1200;
        const endFreq = toPast ? 1600 : 200;
        sweepOsc.frequency.setValueAtTime(startFreq, now);
        sweepOsc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.3);
        
        sweepGain.gain.setValueAtTime(0.35, now);
        sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        
        sweepOsc.connect(sweepGain);
        sweepGain.connect(this.sfxGain);
        sweepOsc.start(now);
        sweepOsc.stop(now + 0.32);
    }

    playBlaster(isCharged = false) {
        if (!this.initialized || this.muted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = isCharged ? 'sawtooth' : 'sine';
        const f0 = isCharged ? 1400 : 920;
        const f1 = isCharged ? 180 : 150;
        const dur = isCharged ? 0.22 : 0.09;

        osc.frequency.setValueAtTime(f0, now);
        osc.frequency.exponentialRampToValueAtTime(f1, now + dur);

        gain.gain.setValueAtTime(isCharged ? 0.5 : 0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + dur);
    }

    playEnemyShot() {
        if (!this.initialized || this.muted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    playHit(isFlesh = false) {
        if (!this.initialized || this.muted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = isFlesh ? 'triangle' : 'square';
        osc.frequency.setValueAtTime(isFlesh ? 200 : 480, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.08);
    }

    playExplosion(isLarge = false) {
        if (!this.initialized || this.muted) return;
        const now = this.ctx.currentTime;
        const dur = isLarge ? 0.55 : 0.28;

        // Low rumble
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(isLarge ? 90 : 130, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + dur);

        gain.gain.setValueAtTime(isLarge ? 0.75 : 0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + dur);
    }

    playDash() {
        if (!this.initialized || this.muted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(1100, now + 0.12);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.14);
    }

    playTerminal() {
        if (!this.initialized || this.muted) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const time = this.ctx.currentTime + idx * 0.05;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);
            gain.gain.setValueAtTime(0.18, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(time);
            osc.stop(time + 0.15);
        });
    }

    playDialogBlip(tone = 440) {
        if (!this.initialized || this.muted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(tone + (Math.random() * 40 - 20), now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.035);
    }

    playPickup() {
        if (!this.initialized || this.muted) return;
        const notes = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6
        notes.forEach((freq, idx) => {
            const time = this.ctx.currentTime + idx * 0.06;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);
            gain.gain.setValueAtTime(0.2, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(time);
            osc.stop(time + 0.2);
        });
    }

    playAlarm() {
        if (!this.initialized || this.muted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(659, now + 0.1);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    playBossRoar() {
        if (!this.initialized || this.muted) return;
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(65, now);
        osc1.frequency.linearRampToValueAtTime(35, now + 0.8);
        osc2.frequency.setValueAtTime(68, now);
        osc2.frequency.linearRampToValueAtTime(33, now + 0.8);

        gain.gain.setValueAtTime(0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.sfxGain);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.85);
        osc2.stop(now + 0.85);
    }
}

// Global audio singleton
window.AudioEngine = new SoundSystem();
