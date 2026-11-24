# GAME DESIGN DOCUMENT (GDD)
# CHRONO TETHER: LAST RECORD OF THE NOMOS

**Project Codename:** `chrono-tether`  
**Studio / Developer:** DaKaufeeBoii  
**Event:** GAME ARENA: Build Your Game, Design Your Banner & Win with Google Gemini! (SVERI Pandharpur)  
**Target Platform:** Modern Web Browsers (Desktop & Mobile)  
**Live Demo:** [https://dakaufeeboii.github.io/chrono-tether/](https://dakaufeeboii.github.io/chrono-tether/)  
**Technology Stack:** Pure HTML5 Canvas 2D + Web Audio API (Zero External Asset Dependencies)  
**Document Version:** 2.0.0 (Production Master)  
**Last Updated:** November 2026  
**Status:** Released & Live  

---

## 1. EXECUTIVE SUMMARY & HIGH CONCEPT

### 1.1 One-Sentence Pitch (The Hook)
> *"What if your only path forward exists sixty minutes in the future, but the key to opening it was locked sixty minutes in the past?"*

*CHRONO TETHER* is a dual-timeline sci-fi action thriller and puzzle-adventure where players instantly phase-shift reality between **T-0 (The Pristine Past)** and **T+60 (The Ruined Void)** to dodge projectile swarms, phase through collapsed bulkheads, solve cross-temporal security grids, and rescue the final survivor of a dying colony ship.

### 1.2 Core Elevator Pitch
Aboard the colony ark *U.S.S. Nomos*, an encounter with micro-singularity *Null-7* has sheared local spacetime into two coexisting timelines. Players pilot **UNIT-7**, an emergency maintenance chassis carrying an experimental Chronal Tether. 

Rather than standard cover shooting, survival hinges on the **Phase-Shift** mechanic (`[SPACE]` / `[RIGHT CLICK]`): shifting timelines instantly relocates your spatial anchor, causing hostile projectile barrages in the opposite timeline to phase harmlessly through you ("PHASE DODGE!"). Obstacles that are impenetrable titanium in the past are collapsed rubble in the future, creating seamless, mind-bending traversal puzzles.

### 1.3 Target Audience & Genre
- **Genre:** Dual-Timeline Action-Adventure / Puzzle-Shooter / Sci-Fi Narrative Thriller.
- **Target Audience:** Fans of high-concept time manipulation mechanics (*Titanfall 2's Effect and Cause*, *Dishonored 2's A Crack in the Slab*, *Hyper Light Drifter*, *Portal*).
- **Tone & Mood:** Atmospheric cyberpunk mystery, synthwave acoustic tension, cosmic horror void, and an emotionally resonant core.

---

## 2. DESIGN PILLARS & PHILOSOPHY

### Pillar I: Zero-Friction Web Accessibility
No downloads, no installations, no missing DLLs, and no OS security warnings. The entire game is built with pure, unbloated HTML5 Canvas and mathematical Web Audio synthesis. It runs at a locked 60 FPS on any modern browser with 0 seconds of loading time.

### Pillar II: Time is Your Shield and Your Path
Every combat encounter and puzzle challenges spatial and temporal intuition:
- Dodging is not just moving in space; it is moving in *time*.
- Blast doors locked in T-0 are breached in T+60.
- Hazards active in T-0 (lasers) are dead in T+60, but replaced by void tears and shifting dimensional stalkers.

### Pillar III: Diegetic Emotional Storytelling
The narrative is integrated directly into the gameplay loop:
- Recoverable audio logs from Dr. Elena Ward and Captain Vance.
- Real-time typewriter comms with acoustic voice-blip telemetry.
- A poignant climax where the player realizes their true identity and sacrifices their tether to launch Cryo-Pod #404 to safety.

---

## 3. CORE GAMEPLAY MECHANICS

### 3.1 Dual-Timeline Phase Shifting (`[SPACE]` / `[RIGHT CLICK]`)
- **Execution:** Zero-latency toggle between **T-0 (Past)** and **T+60 (Future)** (0.3s internal cooldown).
- **Phase-Dodge:** Enemy projectiles belong strictly to their timeline of origin. Shifting timelines renders the player immune to the other timeline's bullets.
- **Bulkhead Phasing:** Bypassing locked doors by shifting to the future where they collapsed, moving through, and shifting back to the past.
- **Audiovisual Feedback:** Expanding chromatic aberration shockwave ripple, screen glitch slice, and dynamic Web Audio biquad filter sweeps (14kHz bright lead vs 650Hz suffocating void bass).

### 3.2 Kinetic Chrono-Blaster (`[LEFT CLICK]`)
- **Rapid Pulse:** High-velocity plasma bolts that neutralize security sentries in T-0 and dissolve void echoes in T+60.
- **Charged Piercing Beam:** Holding Left Click charges the chronal capacitors (0.9s). Releasing unleashes a devastating beam that pierces through multiple enemies and **damages across both timelines simultaneously**.

### 3.3 Thruster Dash (`[SHIFT]` or `[F]`)
- High-velocity emergency burst with invulnerability frames (I-frames), leaving holographic after-image ghost trails. Consumes regenerating Chrono Energy.

### 3.4 Interactive Elements
- **Data Terminals (`[E]`):** Lore terminals displaying encrypted logs with typewriter animations and character portraits.
- **Chrono-Pylons:** Resonance generators that must be synchronized across alternating timelines to lower security barriers or strip boss shields.
- **Pickups:** Nanite hull repair kits (+35 HP) and Chrono-Cores (instant max energy restore).

---

## 4. CAMPAIGN SECTORS & PROGRESSION

### Sector 1: Cryo-Deck Alpha (The Awakening)
- **Objective:** Awaken from cold storage, learn phase mechanics, and reach the Sector 2 Warp Lift.
- **Encounter:** Patrolling automated Sentry Drones in T-0; lingering Void Wraiths in T+60.
- **Key Puzzle:** Locked titanium blast doors in the Past bypassed by navigating through the breached hull in the Future. High-voltage red laser tripwire navigation.

### Sector 2: Quantum Hydro-Gardens (The Reactor Maze)
- **Objective:** Synchronize the 2 Chrono-Pylons across both timelines to unlock the Singularity Airlock.
- **Encounter:** Heavy dual-barrel Pulse Turrets and aggressive leaping Chrono Stalkers.
- **Key Puzzle:** Synchronized timeline overload—Pylon 1 is located in T-0 within a fortified bunker; Pylon 2 is located in T+60 within the flooded hydro-ruins.

### Sector 3: Singularity Core (The Event Horizon - Boss Battle)
- **Objective:** Defeat the **Paradox Nexus** and launch Cryo-Chamber #404.
- **The Boss: PARADOX NEXUS:**
  - *Phase 1 (Armored Overlord):* Boss rotates chronal shields and unleashes 12-way spiral plasma barrages and aimed tri-blasts. Player must overload 4 surrounding Chrono-Pylons across alternating timelines to shatter its shield.
  - *Phase 2 (Unbound Singularity):* At 45% HP, the boss sheds its physical chassis into a naked singularity, pulling the player toward its core via a gravitational vortex while firing 16-bullet dual-colored spiral shockwaves.
- **Climax & Epilogue:** Defeating the entity triggers the escape pod launch sequence, resolving Elena's promise to her daughter Maya with final mission stats and rank rating (S-Rank, A-Rank, B-Rank).

---

## 5. AUDIO & VISUAL SPECIFICATIONS

### 5.1 Procedural Web Audio Engine (`js/audio.js`)
- **Zero Assets:** 100% synthesized in real time via the native Web Audio API.
- **Dynamic Adaptive Soundtrack:** Polyphonic chord progressions, arpeggios, and synthesized 808-style kicks and snares.
- **Dynamic Timeline Filter:** Smooth exponential frequency ramping:
  - T-0: `14,000 Hz` ($Q=1.8$) — crisp, energetic, high-tech leads.
  - T+60: `650 Hz` ($Q=4.0$) — dark, muffled, resonant void sub-bass.
- **Procedural SFX:** 11 distinct synthesized sound effects (blasters, charged beams, phase shifts, explosions, dash whooshes, terminal pings, dialog chirps, alarm klaxons, and boss roars).

### 5.2 Visuals & Shader FX (`js/engine.js`, `css/style.css`)
- 60 FPS hardware-accelerated Canvas with dynamic sub-pixel camera and lookahead tracking.
- Quadratic trauma screen shake ($Offset = 24 \times Trauma^2$).
- Expanding chromatic shockwave ripples on phase shift.
- Post-processing vignette and subtle CRT scanlines.

---

## 6. CONTROLS MATRIX

| Action | Primary Input | Secondary / Alternative |
|---|---|---|
| **Move / Thruster** | `W`, `A`, `S`, `D` | Arrow Keys |
| **Aim** | Mouse Pointer | — |
| **Fire Blaster (Hold to Charge)** | **Left Mouse Button** | — |
| **Phase Shift (Toggle Timeline)** | **Spacebar** | **Right Mouse Button** |
| **Thruster Dash (I-Frames)** | **Left Shift** | `F` |
| **Interact / Advance Dialogue** | `E` | Spacebar / Click Dialogue Box |
| **Pause / Resume** | `Escape` | — |
| **Audio Mute Toggle** | Top-Right Audio Button | — |
