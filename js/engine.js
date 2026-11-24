/**
 * CHRONO TETHER: LAST RECORD OF THE NOMOS
 * Core Rendering Engine, Dual-Timeline Shader Effects, Camera & Particles
 */

class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Resolution & DPI
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.resize();

        // Camera
        this.camera = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            zoom: 1.0,
            targetZoom: 1.0,
            smoothness: 0.1,
            lookaheadDistance: 90
        };

        // Screen Shake & Trauma
        this.trauma = 0;
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeAngle = 0;

        // Hit-stop / Freeze Frame
        this.freezeFrames = 0;

        // Dual-Timeline Shift Visual FX
        this.currentTimeline = 'past'; // 'past' or 'future'
        this.timelineTransition = 0;   // 0 = fully past, 1 = fully future
        this.targetTransition = 0;
        this.phaseRipples = [];        // [{x, y, radius, maxRadius, alpha, color}]
        this.glitchIntensity = 0;

        // Particle System
        this.particles = [];
        this.floatingTexts = [];

        // Ambient Motes
        this.ambientMotes = [];
        this.initAmbientMotes(120);

        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
        this.ctx.scale(this.dpr, this.dpr);
    }

    setTimeline(timeline, playerX, playerY) {
        this.currentTimeline = timeline;
        this.targetTransition = (timeline === 'future') ? 1.0 : 0.0;
        
        // Trigger visual shockwave ripple expanding from the player
        this.addPhaseRipple(playerX, playerY, timeline === 'past' ? '#00f0ff' : '#d900ff');
        this.addTrauma(0.4);
        this.glitchIntensity = 0.8;
    }

    addTrauma(val) {
        this.trauma = Math.min(1.0, this.trauma + val);
    }

    triggerFreeze(frames = 3) {
        this.freezeFrames = frames;
    }

    addPhaseRipple(worldX, worldY, color) {
        this.phaseRipples.push({
            x: worldX,
            y: worldY,
            radius: 10,
            maxRadius: Math.max(this.width, this.height) * 0.9,
            alpha: 1.0,
            color: color
        });
    }

    // ==========================================
    // PARTICLES & FLOATING TEXT
    // ==========================================
    addParticle(config) {
        this.particles.push({
            x: config.x,
            y: config.y,
            vx: config.vx || (Math.random() - 0.5) * 80,
            vy: config.vy || (Math.random() - 0.5) * 80,
            size: config.size || Math.random() * 4 + 2,
            color: config.color || '#00f0ff',
            alpha: config.alpha || 1.0,
            life: config.life || 0.6,
            maxLife: config.life || 0.6,
            decay: config.decay || 1.0,
            shape: config.shape || 'circle',
            rotation: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 6
        });
    }

    spawnBurst(x, y, color, count = 15, speed = 140) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = Math.random() * speed + 20;
            this.addParticle({
                x: x,
                y: y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                size: Math.random() * 3.5 + 1.5,
                color: color,
                life: Math.random() * 0.35 + 0.25
            });
        }
    }

    addFloatingText(text, x, y, color = '#00f0ff', size = 16) {
        this.floatingTexts.push({
            text: text,
            x: x,
            y: y,
            color: color,
            size: size,
            alpha: 1.0,
            life: 0.9,
            vy: -45
        });
    }

    initAmbientMotes(count) {
        for (let i = 0; i < count; i++) {
            this.ambientMotes.push({
                x: Math.random() * 4000,
                y: Math.random() * 4000,
                size: Math.random() * 2.5 + 1,
                vx: (Math.random() - 0.5) * 12,
                vy: -Math.random() * 20 - 5,
                alpha: Math.random() * 0.6 + 0.2,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    // ==========================================
    // UPDATE CYCLE
    // ==========================================
    update(dt, player, mouseWorld, level) {
        if (this.freezeFrames > 0) {
            this.freezeFrames--;
            return;
        }

        // Timeline transition smoothing
        this.timelineTransition += (this.targetTransition - this.timelineTransition) * Math.min(1, dt * 10);
        this.glitchIntensity = Math.max(0, this.glitchIntensity - dt * 3.5);

        // Camera tracking with lookahead towards mouse
        if (player) {
            const lookX = mouseWorld ? (mouseWorld.x - player.x) * 0.25 : 0;
            const lookY = mouseWorld ? (mouseWorld.y - player.y) * 0.25 : 0;
            const clampedLookX = Math.max(-this.camera.lookaheadDistance, Math.min(this.camera.lookaheadDistance, lookX));
            const clampedLookY = Math.max(-this.camera.lookaheadDistance, Math.min(this.camera.lookaheadDistance, lookY));

            this.camera.targetX = player.x + clampedLookX;
            this.camera.targetY = player.y + clampedLookY;

            // Clamp camera inside station level boundaries
            if (level) {
                const halfW = (this.width / 2) / this.camera.zoom;
                const halfH = (this.height / 2) / this.camera.zoom;
                if (level.width > halfW * 2) {
                    this.camera.targetX = Math.max(halfW, Math.min(level.width - halfW, this.camera.targetX));
                }
                if (level.height > halfH * 2) {
                    this.camera.targetY = Math.max(halfH, Math.min(level.height - halfH, this.camera.targetY));
                }
            }

            this.camera.x += (this.camera.targetX - this.camera.x) * this.camera.smoothness;
            this.camera.y += (this.camera.targetY - this.camera.y) * this.camera.smoothness;
            this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.08;
        }

        // Screen Shake calculation using trauma^2
        if (this.trauma > 0) {
            const shake = this.trauma * this.trauma;
            const maxOffset = 24 * shake;
            this.shakeX = (Math.random() * 2 - 1) * maxOffset;
            this.shakeY = (Math.random() * 2 - 1) * maxOffset;
            this.shakeAngle = (Math.random() * 2 - 1) * (0.04 * shake);
            this.trauma = Math.max(0, this.trauma - dt * 1.6);
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
            this.shakeAngle = 0;
        }

        // Phase Ripples
        for (let i = this.phaseRipples.length - 1; i >= 0; i--) {
            const rip = this.phaseRipples[i];
            rip.radius += dt * 1800;
            rip.alpha = 1.0 - (rip.radius / rip.maxRadius);
            if (rip.radius >= rip.maxRadius || rip.alpha <= 0) {
                this.phaseRipples.splice(i, 1);
            }
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.94;
            p.vy *= 0.94;
            p.rotation += p.vRot * dt;
            p.life -= dt;
            p.alpha = Math.max(0, p.life / p.maxLife);
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Floating Text
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy * dt;
            ft.life -= dt;
            ft.alpha = Math.max(0, ft.life / 0.9);
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }

        // Ambient Motes
        this.ambientMotes.forEach(m => {
            m.x += m.vx * dt;
            m.y += m.vy * dt;
            m.phase += dt * 2;
            if (m.y < 0) m.y = 4000;
            if (m.x < 0) m.x = 4000;
            if (m.x > 4000) m.x = 0;
        });
    }

    // Convert Screen coordinates to World coordinates
    screenToWorld(screenX, screenY) {
        const cx = this.width / 2;
        const cy = this.height / 2;
        const wx = (screenX - cx) / this.camera.zoom + this.camera.x;
        const wy = (screenY - cy) / this.camera.zoom + this.camera.y;
        return { x: wx, y: wy };
    }

    // Convert World coordinates to Screen coordinates
    worldToScreen(worldX, worldY) {
        const cx = this.width / 2;
        const cy = this.height / 2;
        const sx = (worldX - this.camera.x) * this.camera.zoom + cx;
        const sy = (worldY - this.camera.y) * this.camera.zoom + cy;
        return { x: sx, y: sy };
    }

    // ==========================================
    // RENDER PIPELINE
    // ==========================================
    beginFrame() {
        const ctx = this.ctx;
        ctx.save();
        ctx.clearRect(0, 0, this.width, this.height);

        // Camera transform & Shake
        ctx.translate(this.width / 2 + this.shakeX, this.height / 2 + this.shakeY);
        ctx.rotate(this.shakeAngle);
        ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.translate(-this.camera.x, -this.camera.y);
    }

    renderBackground(level) {
        const ctx = this.ctx;
        const t = this.timelineTransition; // 0 = Past (Cyan/Blue), 1 = Future (Purple/Violet)
        
        // Interpolated background color
        // Past: rgb(8, 16, 32) -> Future: rgb(16, 5, 24)
        const bgR = Math.round(8 + (16 - 8) * t);
        const bgG = Math.round(16 + (5 - 16) * t);
        const bgB = Math.round(32 + (24 - 32) * t);
        
        // Fill base canvas color
        const visibleL = this.camera.x - (this.width / 2) / this.camera.zoom - 100;
        const visibleT = this.camera.y - (this.height / 2) / this.camera.zoom - 100;
        const visibleW = this.width / this.camera.zoom + 200;
        const visibleH = this.height / this.camera.zoom + 200;

        ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
        ctx.fillRect(visibleL, visibleT, visibleW, visibleH);

        // Tech Grid overlay
        const gridSize = 64;
        const startX = Math.floor(visibleL / gridSize) * gridSize;
        const startY = Math.floor(visibleT / gridSize) * gridSize;

        ctx.lineWidth = 1;
        // Past grid: glowing cyan (#00f0ff 0.08), Future grid: fractured violet (#ff00ea 0.08)
        const gridAlpha = 0.09;
        ctx.strokeStyle = t < 0.5 
            ? `rgba(0, 240, 255, ${gridAlpha})` 
            : `rgba(230, 0, 255, ${gridAlpha})`;

        ctx.beginPath();
        for (let x = startX; x <= visibleL + visibleW; x += gridSize) {
            ctx.moveTo(x, visibleT);
            ctx.lineTo(x, visibleT + visibleH);
        }
        for (let y = startY; y <= visibleT + visibleH; y += gridSize) {
            ctx.moveTo(visibleL, y);
            ctx.lineTo(visibleL + visibleW, y);
        }
        ctx.stroke();

        // Render Ambient Motes
        ctx.save();
        this.ambientMotes.forEach(m => {
            if (m.x >= visibleL && m.x <= visibleL + visibleW && m.y >= visibleT && m.y <= visibleT + visibleH) {
                const moteColor = t < 0.5 ? 'rgba(0, 240, 255, ' : 'rgba(255, 60, 210, ';
                const pulse = Math.sin(m.phase) * 0.3 + 0.7;
                ctx.fillStyle = `${moteColor}${m.alpha * pulse})`;
                ctx.beginPath();
                ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.restore();
    }

    renderPhaseRipples() {
        const ctx = this.ctx;
        ctx.save();
        this.phaseRipples.forEach(rip => {
            ctx.beginPath();
            ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
            ctx.strokeStyle = rip.color;
            ctx.lineWidth = 6 * rip.alpha;
            ctx.globalAlpha = Math.max(0, rip.alpha);
            ctx.stroke();

            // Inner echo ring
            if (rip.radius > 40) {
                ctx.beginPath();
                ctx.arc(rip.x, rip.y, rip.radius * 0.85, 0, Math.PI * 2);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2 * rip.alpha;
                ctx.stroke();
            }
        });
        ctx.restore();
    }

    renderParticles() {
        const ctx = this.ctx;
        ctx.save();
        this.particles.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    renderFloatingText() {
        const ctx = this.ctx;
        ctx.save();
        this.floatingTexts.forEach(ft => {
            ctx.globalAlpha = ft.alpha;
            ctx.fillStyle = ft.color;
            ctx.font = `bold ${ft.size}px 'Courier New', monospace`;
            ctx.textAlign = 'center';
            ctx.shadowColor = ft.color;
            ctx.shadowBlur = 8;
            ctx.fillText(ft.text, ft.x, ft.y);
        });
        ctx.restore();
    }

    endFrame(player) {
        const ctx = this.ctx;
        ctx.restore(); // Undo camera translation

        // Post-processing: Screen-space Effects (Vignette, CRT scanlines, Glitch)
        this.renderPostProcessing(player);
    }

    renderPostProcessing(player) {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        // 1. Dynamic Radial Vignette
        const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, w * 0.7);
        const t = this.timelineTransition;
        // Past vignette has subtle cool blue edges; Future has oppressive dark void edges
        const edgeColor = t < 0.5 ? 'rgba(0, 15, 30, 0.65)' : 'rgba(18, 0, 25, 0.85)';
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, edgeColor);
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, w, h);

        // 2. Timeline Glitch Slice on phase transition
        if (this.glitchIntensity > 0.05) {
            ctx.save();
            const slices = Math.floor(Math.random() * 5 + 3);
            for (let i = 0; i < slices; i++) {
                const sliceY = Math.random() * h;
                const sliceH = Math.random() * 25 + 5;
                const offset = (Math.random() * 2 - 1) * (30 * this.glitchIntensity);
                ctx.fillStyle = (Math.random() > 0.5) 
                    ? `rgba(0, 240, 255, ${0.15 * this.glitchIntensity})` 
                    : `rgba(255, 0, 120, ${0.15 * this.glitchIntensity})`;
                ctx.fillRect(offset, sliceY, w, sliceH);
            }
            ctx.restore();
        }

        // 3. Subtle CRT Scanlines
        ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
        for (let y = 0; y < h; y += 4) {
            ctx.fillRect(0, y, w, 1.5);
        }
    }
}
