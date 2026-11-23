# GAME DESIGN DOCUMENT (GDD)
# ORBITAL FLAIL: KINETIC BREACH

**Project Codename:** `game-arena / Orbital Flail`  
**Studio / Developer:** Nano Banana Studios  
**Event:** Game Arena Hackathon  
**Target Engine:** Godot 4.7+ (Forward+ / Mobile)  
**Primary Platforms:** PC (Windows / Linux / macOS) & Local Shared-Screen Console  
**Document Version:** 1.0.0 (Production Master)  
**Last Updated:** November 2026  
**Status:** Living Document / Active Development  

---

## 1. EXECUTIVE SUMMARY & HIGH CONCEPT

### 1.1 One-Sentence Pitch (The Hook)
*Orbital Flail: Kinetic Breach* is a high-octane physics action brawler where you pilot an agile thruster drone tethered to a massive, spiked wrecking ball by a super-elastic plasma cord—turning centripetal momentum, whip cracks, and kinetic impacts into your only weapon, shield, and engine.

### 1.2 Core Elevator Pitch
In traditional arena shooters, weapons are abstracted into bullets and crosshairs. *Orbital Flail: Kinetic Breach* throws out projectile shooting entirely in favor of tangible, visceral Newtonian physics. Players pilot a dual-thruster orbital drone connected to a heavyweight spiked kinetic flail via a Verlet-simulated elastic energy cord. 

To destroy enemies, breach reinforced blast gates, and survive bullet swarms, players must master centrifugal velocity, sling the flail around obstacles, execute supersonic whip-cracks, and deflect incoming plasma bolts back at defensive turrets. Featuring solo sector breaches, single-screen co-op tactical strikes, and intense 1v1 arena gladiator duels, the game delivers instant mechanical comprehension paired with a sky-high skill ceiling.

### 1.3 Target Audience & Genre
- **Genre:** Kinetic Physics Action / Arena Brawler / Environmental Puzzle.
- **Target Audience:** Fans of high-mastery physics games (*Hammerfight*, *Rocket League*, *Laser League*, *Nidhogg*), arcade twin-stick combat, and local multiplayer party brawlers.
- **Tone & Mood:** High-tech industrial cyberpunk, raw mechanical inertia, electric neon contrast, bass-heavy acoustic feedback.
- **Age Rating:** PEGI 7 / ESRB E10+ (Fantasy mechanical destruction, no gore).

### 1.4 Comparative Matrix
| Title | Shared Elements | Unique Differentiation of *Orbital Flail* |
| :--- | :--- | :--- |
| **Hammerfight** | Centrifugal momentum melee combat | High-speed aerial drone agility, elastic Verlet rope dynamics, dynamic whip-crack mechanics, and projectile deflection. |
| **Rocket League** | Momentum mastery & tactile vehicular physics | Combat-focused arena breaches, breakable structural geometry, and lethal tethered flail physics. |
| **Laser League** | High-energy arena control & team synergy | Continuous tactile physical interactions, physical barrier demolition, and environmental switch puzzles. |

---

## 2. DESIGN PILLARS & PHILOSOPHY

### Pillar I: Momentum is the Only Currency
There are no laser guns, ammo pickups, or hitscan rifles. Your flail's lethality is a direct mathematical function of its physical velocity relative to its target. If it moves slowly, it nudges; if swung at mach speed through centripetal acceleration or a supersonic whip crack, it pulverizes titanium reinforced concrete and shatters combat turrets in a single strike.

### Pillar II: Visceral, Tactile "Juice"
Every physical interaction is felt through the screen and speakers:
- **Trauma-based camera shake** with rotational roll scaling quadratically ($Trauma^2$).
- **Hit-stop micro-pauses** (1-3 frames of physics freeze) on heavy impacts to give weight to crushing blows.
- **Harmonic procedural sound synthesis** where sub-bass booms, metallic clangs, and high-frequency whip-cracks are synthesized dynamically in real time without canned static sample latency.

### Pillar III: 5 Seconds to Learn, Endless Mastery Ceiling
Anyone can pick up the controls and swing a ball by moving in circles. However, advanced players will discover:
- Counter-swing momentum cancelation.
- Slingshot dashes using flail anchoring.
- Supersonic whip-cracks that transfer elastic wave pulses down the tether.
- Deflecting incoming projectiles with millisecond rotational timing.

### Pillar IV: Frictionless Shared-Screen Multiplayer
Local co-op and versus combat must operate seamlessly on a single display without split-screen disorientation. An intelligent multi-target bounding camera dynamically tracks all active drones, automatically framing combat arenas with smooth zoom and pan interpolation.

---

## 3. CORE GAMEPLAY MECHANICS & PHYSICS

```
               [ Omnidirectional Thruster Drone ]
                              │
                              ▼  (Verlet Tension & Wave Propagation)
             ═════════════════════════════════════  <--- Elastic Plasma Tether
                              ▲
                              │  (Centrifugal Velocity & Impact Force)
                 [ Spiked Kinetic Flail ]
```

### 3.1 The Drone (`Drone.gd` / `CharacterBody2D`)
The player controls a sleek, twin-engine thruster chassis engineered for instantaneous directional pivoting and rapid momentum shifts.

- **Movement Dynamics:**
  - `base_speed`: $380.0\text{ px/s}$
  - `acceleration`: $1400.0\text{ px/s}^2$
  - `friction`: $800.0\text{ px/s}^2$ (Controlled drift feel)
  - `boost_speed_mult`: $1.7\times$ (Overdrive sprint)
- **Boost Capacitor:**
  - Dedicated energy pool ($100.0\text{ units}$) that drains at $45.0\text{ units/s}$ during boost and recharges at $25.0\text{ units/s}$ when idle.
  - Enables explosive burst acceleration for slingshot flail launches and evasive dodges.
- **Tether Tension Feedback:**
  - The drone is physically constrained by the tether. When the flail reaches maximum cord extension, a counter-pull force ($180.0\text{ px/s}^2$ scaled by delta) acts on the drone, allowing players to swing around heavy flails or use the flail as an anchor to slingshot around sharp corners.
- **Visual Feedback:**
  - Sleek triangular fuselage with dark inner armor plating and a glowing visor cockpit.
  - Dynamic thruster exhaust particles and procedural flame cones that scale in length ($8\text{px}$ standard, $16\text{px}$ on boost).

### 3.2 The Verlet Plasma Tether (`Tether.gd`)
The tether connects the drone to the flail. Rather than a rigid rod or basic Godot spring joint, it is simulated using a custom **Verlet Integration Distance Constraint Chain**:

- **Verlet Physics Loop:**
  - Simulated across $N=12$ discrete particle points connected by $12.0\text{px}$ segments (total unstretched length: $144.0\text{px}$).
  - $6$ constraint relaxation iterations per physics frame guarantee rigid rope tension without jitter or numerical explosion.
  - Point damping factor of $0.98$ simulates atmospheric and internal mechanical drag.
- **Tension Calculation & Visuals:**
  $$\text{Tension} = \text{clamp}\left(\frac{\|\vec{P}_{\text{start}} - \vec{P}_{\text{end}}\|}{L_{\text{max}}}, 0.0, 2.0\right)$$
  - Renders as a dual-layer polyline: a high-luminosity white inner energy core overlaid by an outer plasma halo that dynamically shifts from cyan/gold to glowing danger red as tension spikes.
- **Transverse Wave Propagation (Whip-Crack Pulse):**
  - When a whip-crack is executed, an orthogonal sinusoidal wave displacement is injected into intermediate tether points:
    $$\Delta \vec{P}_i = \vec{D}_{\text{pulse}} \times \text{Strength} \times \sin\left(\frac{i}{N} \cdot \pi\right)$$
  - This sends a visible, rippling shockwave down the cord that snaps the flail forward.

### 3.3 The Kinetic Flail (`Flail.gd` / `RigidBody2D`)
The flail is a $3.5\text{ kg}$ spiked dense-metal wrecking ball operating with zero gravity, low linear damping ($0.8$), and continuous contact reporting.

- **Radius:** $16.0\text{ px}$ core with $8$ radial hardened tungsten alloy perimeter spikes.
- **Mass & Inertia:** High inertia preserves centrifugal energy generated by circular drone flight paths.
- **Tether Pull Force:**
  $$\vec{F}_{\text{pull}} = (\vec{P}_{N-2} - \vec{P}_{\text{flail}}) \cdot \Delta d \cdot 450.0$$
  Provides spring-like elasticity while preventing flail runaway.

### 3.4 Kinetic Damage Formulation
Damage in *Orbital Flail* is strictly velocity-dependent, preventing static contact cheese:

$$\text{Damage} = \text{clamp}\left(\frac{v_{\text{current}}}{v_{\text{max}}} \times \text{Damage}_{\text{base}}, 10.0, 100.0\right)$$
- `min_impact_speed`: $180.0\text{ px/s}$ (Speeds below this threshold bounce harmlessly without dealing damage).
- `max_impact_speed`: $900.0\text{ px/s}$ (Yields maximum impact rating of $100.0$ damage).
- `base_damage`: $35.0$

### 3.5 Core Combat Maneuvers
1. **The Centrifugal Orbital:** Flying in tight circular arcs builds centripetal acceleration, causing the flail to orbit the drone like a protective sawblade, obliterating small targets and creating a 360-degree kinetic shield.
2. **The Whip-Crack Snap:** Pressing the Whip action launches a $950.0\text{ impulse}$ directly along the drone's flight vector, accompanied by an orthogonal tether pulse and a $-180.0\text{ impulse}$ drone recoil. Launches the flail across the screen to snipe distant turrets.
3. **Mid-Air Flail Clash:** When two flails collide (in Versus or Co-op), an explosive clash triggers:
   $$\vec{I}_{\text{recoil}} = \frac{\vec{P}_1 - \vec{P}_2}{\|\vec{P}_1 - \vec{P}_2\|} \cdot v_{\text{impact}} \cdot 0.8$$
   Accompanied by resonant metallic clangs and trauma camera shake.
4. **Plasma Reflection:** Striking an enemy plasma projectile with the flail reverses the projectile's trajectory, boosts its velocity by $1.4\times$, and shifts its color to allied cyan, allowing players to swat enemy fire back at the turrets that fired them.

---

## 4. GAME MODES & STRUCTURE

```
                               ┌────────────────────────────────┐
                               │       MAIN MENU SELECTION      │
                               └───────────────┬────────────────┘
                 ┌─────────────────────────────┼─────────────────────────────┐
                 ▼                             ▼                             ▼
   ┌───────────────────────────┐ ┌───────────────────────────┐ ┌───────────────────────────┐
   │   SINGLE-PLAYER CAMPAIGN  │ │     2-PLAYER CO-OP        │ │      VERSUS ARENA         │
   │      "Sector Breach"      │ │     "Dual Strike"         │ │   "Gladiator Brawler"     │
   └─────────────┬─────────────┘ └─────────────┬─────────────┘ └─────────────┬─────────────┘
                 │                             │                             │
                 ▼                             ▼                             ▼
       Industrial Gateways            Synchronized Puzzles          1v1 Elimination
       Defensive Turret Swarms        Enemy Juggling Combos         Tactical Hazard Walls
       Physics Switch Gates           Shared Bounding Camera        Clash Recoil Duels
```

### 4.1 Mode 1: Single-Player Campaign ("Sector Breach")
- **Premise:** You pilot an autonomous infiltration drone designated *Nano Banana P-1*. Your objective is to breach fortified automated industrial sectors, eliminate rogue automated defense systems, and breach security gates.
- **Gameplay Progression:**
  1. *Traversal & Breaching:* Navigate winding industrial sectors sealed by reinforced concrete blast barriers.
  2. *Kinetic Puzzle Solving:* Strike high-velocity **Impact Switches** requiring minimum impact thresholds ($>220\text{ px/s}$) to reroute power grids and lower containment bulkheads.
  3. *Turret Neutralization:* Engage automated point-defense turrets either by building momentum to batter them directly or by swatting their plasma orbs back into their sensor arrays.
- **Victory Condition:** Neutralize all sector defense turrets and breach the exit perimeter.

### 4.2 Mode 2: 2-Player Co-op Strike ("Dual Strike")
- **Premise:** Two linked drones—*Nano Banana* (Player 1, Gold) and *Cyan Echo* (Player 2, Cyan)—deploy simultaneously to dismantle fortified security hubs.
- **Cooperative Synergy Mechanics:**
  - **Shared Bounding Screen:** Camera smoothly tracks the midpoint and bounding box of both drones, zooming out to $0.65\times$ as players separate and in to $1.25\times$ during close-quarters maneuvers.
  - **Enemy Juggling:** Player 1 uses a whip-crack to launch a defensive drone or projectile across the arena; Player 2 intercepts the airborne target mid-flight with a spinning centrifugal strike, earning massive combo bonus points.
  - **Dual Synchronized Switches:** Heavy blast doors linked to dual impact switches that must both be struck within a tight time window.
  - **Tether Weaving:** Two drones flying in tandem can sweep their tethers across minefields or projectile swarms.

### 4.3 Mode 3: Versus Arena ("Gladiator Brawler")
- **Premise:** Pure, unadulterated 1v1 kinetic gladiator combat inside an enclosed, hazard-lined arena.
- **Competitive Ruleset:**
  - Drones spawn on opposing sides of a symmetrically designed gladiatorial chamber.
  - Health: $100.0\text{ HP}$ per drone. First player to reduce the opponent's hull to $0\text{ HP}$ wins the match.
  - Tactical destructible walls provide cover from initial whip-cracks but collapse when struck by heavy flail momentum.
  - Mid-air flail clashes trigger recoil and spark showers, rewarding players who out-angle and out-speed their rival.

---

## 5. ENVIRONMENT, HAZARDS & ENEMY ARCHETYPES

### 5.1 Destructible Breakable Wall (`BreakableWall.gd`)
- **Structure:** Modular composite concrete-and-steel blocks ($64 \times 64\text{ px}$).
- **Health & Cracking:** $60.0\text{ HP}$.
  - When damaged, procedural fracture lines appear across the surface, with visual crack intensity scaling inversely with remaining health:
    $$\text{Crack Ratio} = 1.0 - \frac{\text{Health}_{\text{current}}}{\text{Health}_{\text{max}}}$$
- **Destruction Effect:** Shatters into dynamic debris pieces accompanied by high-pass acoustic crunch and trauma camera shake ($+0.3$).

### 5.2 Kinetic Impact Switch (`ImpactSwitch.gd`)
- **Structure:** Circular industrial pressure terminal.
- **Activation Gate:**
  - Will **not** trigger on passive drone contact or low-speed nudges.
  - Requires a physical flail velocity exceeding $220.0\text{ px/s}$ or direct impact damage.
- **Feedback:** Shifts state from inactive industrial crimson (`#cc3333`) to energized hydraulic emerald (`#1ae64d`) with a heavy metallic chime.

### 5.3 Automated Point-Defense Turret (`Turret.gd`)
- **Structure:** Static hexagonal heavy armor base with a rotating plasma cannon turret head.
- **Health:** $75.0\text{ HP}$.
- **Targeting AI:**
  - Scans for the nearest active drone within a $650.0\text{ px}$ detection radius.
  - Rotates smoothly toward the target ($lerp\_angle$ with factor $0.08$).
- **Firing Pattern:**
  - Fires high-energy plasma orbs every $2.2\text{ seconds}$ at $320.0\text{ px/s}$.
  - Projectiles deal $20.0\text{ damage}$ on direct contact with a drone hull.
  - If a projectile contacts a spinning flail, its velocity reverses ($v = -v \times 1.4$), its color shifts to allied cyan, and it deals full damage back to any enemy structure it strikes.

---

## 6. CONTROLS & INPUT ARCHITECTURE

The input system supports local multi-device play, accommodating two players simultaneously on a single keyboard or dual gamepads.

### 6.1 Control Scheme Overview

| Action | Player 1 (Nano Banana - Gold) | Player 2 (Cyan Echo - Cyan) | Gamepad (P1 / P2) |
| :--- | :--- | :--- | :--- |
| **8-Way Thrusters** | `W`, `A`, `S`, `D` / Arrow Keys | Keypad `8`, `4`, `5`, `6` / `I`,`J`,`K`,`L` | Left Analog Stick / D-Pad |
| **Kinetic Boost** | `Spacebar` or `Left Mouse Button` | Keypad `0` or Period (`.`) | Right Trigger (`RT`) / Button South (`A` / `Cross`) |
| **Whip-Crack Launch**| `Left Shift` or `Right Mouse Button`| Keypad Enter or Slash (`/`) | Right Bumper (`RB`) / Button West (`X` / `Square`) |
| **Return to Menu** | `Escape` | `Escape` | `Start` / `Options` |

---

## 7. VISUAL DESIGN & ART DIRECTION

### 7.1 Aesthetic Theme: "Neo-Industrial Cyber-Kinetic"
- **High-Contrast Dark Canvas:** Deep charcoal and slate arena floors (`#12141a`) provide maximum visual contrast against radiant energy effects.
- **Player Color Palettes:**
  - **Player 1 (Nano Banana):** Radiant Solar Gold (`#ffc70d`) with white cockpit accents.
  - **Player 2 (Cyan Echo):** Luminescent Cyan (`#1acdff`) with electric blue trails.
  - **Player 3 (Crimson Rift):** Neon Crimson (`#ff404d`).
  - **Player 4 (Verdant Surge):** Emerald Plasma (`#4dfc66`).
- **Hazard Palette:** Alert Orange (`#ff801a`) and Hostile Laser Red (`#ff3333`).

### 7.2 Lighting & Shader Pipeline
- **2D Architecture:** Pure procedural vector and polygon drawing (`_draw()`), ensuring zero texture loading overhead, razor-sharp anti-aliased geometry at any resolution, and $120+\text{ FPS}$ stability.
- **3D Evolution Roadmap:**
  - Godot 4 Forward+ Clustered Renderer.
  - Volumetric Fog with directional light shafts filtering through industrial ceiling grates.
  - Screen-Space Ambient Occlusion (SSAO) and Screen-Space Reflections (SSR) on metallic ground plates.
  - Modular low-poly industrial kitbashing (pipes, catwalks, blast doors).

---

## 8. AUDIO DESIGN & PROCEDURAL SYNTHESIS

To guarantee zero asset loading friction, instantaneous startup, and absolute platform independence, the audio architecture is built on a **100% self-contained procedural synthesis engine** (`SoundManager.gd`). All audio waveforms are mathematically synthesized into memory on startup at $22,050\text{ Hz}$ 8-bit unsigned PCM:

```
[ Math Waveform Generator ] ──> [ PackedByteArray Buffer ] ──> [ AudioStreamWAV ] ──> [ 8x AudioStreamPlayer Pool ]
```

### 8.1 Sound Library Synthesis Recipes

| SFX Identifier | Duration | Mathematical Synthesis Formula | In-Game Purpose |
| :--- | :--- | :--- | :--- |
| `whip_crack` | $0.25\text{ s}$ | High-frequency downward frequency sweep ($800\text{ Hz} \to 60\text{ Hz}$) mixed with decaying white noise and steep exponential envelope ($e^{-22t}$). | Supersonic flail whip-crack launch. |
| `impact` | $0.35\text{ s}$ | Dual fundamental bass sine waves ($110\text{ Hz} + 55\text{ Hz}$) with high-damp click transient ($e^{-80t}$) and warm exponential tail ($e^{-12t}$). | Kinetic flail collisions with walls, switches, and hulls. |
| `clash` | $0.40\text{ s}$ | Multi-tone metallic overtone cluster ($880\text{ Hz} + 1320\text{ Hz} + 1760\text{ Hz}$) decayed over $e^{-10t}$. | Mid-air flail clashes and switch locks. |
| `shatter` | $0.30\text{ s}$ | Wideband white noise fused with high resonant ringing ($2400\text{ Hz}$) over rapid exponential decay ($e^{-14t}$). | Blast wall collapse and turret destruction. |
| `boost` | $0.20\text{ s}$ | Upward pitch-gliding tone ($200\text{ Hz} \to 600\text{ Hz}$) mixed with low-amplitude thruster hiss. | Thruster overdrive activation. |

---

## 9. USER INTERFACE & CAMERA FEEL

### 9.1 Trauma-Based Screen Shake (`CameraTracker.gd`)
Screen shake is implemented using a non-linear trauma model:

$$\text{Shake} = \text{Trauma}^2$$
$$\text{Offset}_x = 18.0 \cdot \text{Shake} \cdot \text{randf\_range}(-1.0, 1.0)$$
$$\text{Offset}_y = 18.0 \cdot \text{Shake} \cdot \text{randf\_range}(-1.0, 1.0)$$
$$\text{Rotation} = 0.05 \cdot \text{Shake} \cdot \text{randf\_range}(-1.0, 1.0)$$

- Trauma decays linearly at a rate of $1.8 \cdot \Delta t$.
- Minor impacts add $+0.2$ trauma; turret shatters add $+0.5$; drone explosions inject $+0.8$ trauma.

### 9.2 Multi-Target Smart Bounding Camera
- In single-player mode, the camera tracks the active drone smoothly with an interpolation factor of $6.0 \cdot \Delta t$.
- In multiplayer modes (Co-op and Versus), the camera calculates the min/max bounding coordinates of all active drones, adding a $160\text{ px}$ margin:
  $$Z = \text{clamp}\left(\min\left(\frac{W_{\text{viewport}}}{W_{\text{bounding}}}, \frac{H_{\text{viewport}}}{H_{\text{bounding}}}\right), 0.65, 1.25\right)$$
- Drones are never clipped by the viewport edges regardless of separation distance.

### 9.3 Heads-Up Display (HUD)
- **Hull Integrity Bar:** Segmented health bar in the top-left corner, colored to match the player's drone palette.
- **Boost Capacitor Gauge:** Sleek radial or horizontal bar displaying remaining thruster overdrive.
- **Mission Status Ticker:** Minimalist cyber-ticker at top center indicating remaining sector targets, switch states, and victory banners.

---

## 10. TECHNICAL ARCHITECTURE & GODOT 4 IMPLEMENTATION

```
res://
├── project.godot                     # Project configuration & Autoload declarations
├── src/
│   ├── autoload/
│   │   ├── GameManager.gd            # Global state machine, mode management, scoring
│   │   └── SoundManager.gd           # 8-player audio pool & procedural waveform generator
│   ├── entities/
│   │   ├── drone/
│   │   │   ├── Drone.gd              # Flight physics, boost capacitor, whip trigger
│   │   │   └── Drone.tscn
│   │   ├── flail/
│   │   │   ├── Flail.gd              # RigidBody2D spiked flail, kinetic damage calculations
│   │   │   └── Flail.tscn
│   │   ├── tether/
│   │   │   └── Tether.gd             # 12-point Verlet distance constraint rope simulation
│   │   └── enemies/
│   │       ├── Turret.gd             # Target tracking, automated plasma firing
│   │       ├── Turret.tscn
│   │       └── PlasmaProjectile.gd   # Deflectable energy projectile
│   ├── environment/
│   │   ├── BreakableWall.gd          # Destructible barrier with stress crack drawing
│   │   ├── BreakableWall.tscn
│   │   ├── ImpactSwitch.gd           # Velocity-thresholded physical toggle
│   │   ├── ImpactSwitch.tscn
│   │   └── WallBorder.tscn           # Arena boundary collision hull
│   ├── levels/
│   │   ├── LevelController.gd        # Objective tracking, victory triggers, scene inputs
│   │   ├── Level_Campaign.tscn       # Single-Player Sector Breach arena
│   │   ├── Level_Coop.tscn           # 2-Player Co-op Strike arena
│   │   └── Level_Versus.tscn         # 1v1 Gladiator Brawler arena
│   └── ui/
│       ├── CameraTracker.gd          # Multi-target bounding zoom & trauma shake
│       ├── HUD.gd                    # Real-time telemetry & objective displays
│       ├── HUD.tscn
│       ├── MainMenu.gd               # Mode selection & controls briefing
│       └── MainMenu.tscn
```

### 10.1 Engine Specifications
- **Godot Engine Version:** 4.7.2-stable Forward+ (Console & Headless certified).
- **Physics Processing Rate:** $60\text{ Hz}$ physics ticks with automatic 2D transform interpolation.
- **Resolution:** $1280 \times 720$ base canvas viewport with `expand` aspect ratio mode for widescreen multi-monitor scaling.
- **Automated Verification:** Verified via headless engine runner with exit code 0 across all core scenes.

---

## 11. PRODUCTION ROADMAP & MILESTONES

### Phase 1: 2D Kinetic Foundation (COMPLETE ✅)
- [x] Full Verlet integration distance-constraint rope tether.
- [x] Velocity-scaled kinetic damage calculations and impact thresholds.
- [x] Supersonic whip-crack mechanic with orthogonal wave injection.
- [x] Self-contained procedural sound synthesis engine (`SoundManager.gd`).
- [x] Deflectable projectile system with velocity boosting.
- [x] Destructible walls with procedural fracture drawing.
- [x] High-velocity impact switches for gate activation.
- [x] Multi-target dynamic zoom bounding camera with trauma shake.
- [x] Complete playable Campaign, 2-Player Co-op, and 1v1 Versus scenes.
- [x] Headless engine verification with 0 errors and 0 warnings.

### Phase 2: 3D Engine Migration & Asset Integration (IN PROGRESS 🔨)
- [ ] Transition entities to Godot 4 3D nodes (`CharacterBody3D`, `RigidBody3D`).
- [ ] Implement 3D Verlet tether using dynamic mesh generation (`ImmediateMesh`).
- [ ] Source and integrate permissive (CC0) 3D sci-fi modular models (chassis, industrial catwalks, turrets).
- [ ] Deploy Forward+ WorldEnvironment with volumetric fog, bloom, and dynamic directional shadows.
- [ ] Implement 3D camera tracker with smooth 3D bounding box calculation and pitch tilt.

### Phase 3: Content Expansion & Boss Encounters (PLANNED 📋)
- [ ] **Heavy Industrial Excavator Boss:** A multi-jointed mechanical boss featuring shielded armor plates that must be shattered sequentially.
- [ ] **Chaser AI Swarms:** Light kamikaze drones that swarm the player, encouraging rapid centrifugal flail orbits.
- [ ] **Environmental Hazards:** Magnetic disruption zones that alter tether tension; high-voltage shock rails along arena boundaries.

### Phase 4: Networked Multiplayer & Release Polish (PLANNED 📋)
- [ ] Godot 4 high-level ENet multiplayer integration (`MultiplayerSynchronizer` / `MultiplayerSpawner`).
- [ ] 2-4 Player online lobby system for Gladiator Brawler.
- [ ] Leaderboard tracking for Campaign Sector speedruns.
- [ ] Gamepad vibration / haptic rumble integration.

---

## 12. CONCLUSION & DESIGN SUMMARY
*Orbital Flail: Kinetic Breach* redefines the arena action genre by replacing conventional shooting with pure, tactile Newtonian kinetic mastery. By leveraging continuous Verlet physics, procedural audio synthesis, and an instant-gratification game feel loop, the title stands as a premier showcase of innovative indie game architecture.
