import { rectsIntersect, pointInRect, clamp } from "./collision.js";
import { Player } from "./player.js";
import { Victim, Guard, Pedestrian } from "./npc.js";

export class GameManager {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ui = ui;
    this.arena = { x: 120, y: 190, width: 1040, height: 450 };
    this.player = new Player(this.arena);
    this.player.bindInput();
    this.victims = [];
    this.guards = [];
    this.pedestrians = [];
    this.particles = [];
    this.timeLeft = 90;
    this.score = 0;
    this.bestScore = this.loadBestScore();
    this.caught = 0;
    this.civicSense = 100;
    this.combo = 0;
    this.comboWindow = 2.8;
    this.lastPhotobombTime = -999;
    this.chaosMode = false;
    this.chaosTimer = 0;
    this.flashTimer = 0;
    this.catchCooldown = 0;
    this.state = "waiting";
    this.elapsed = 0;
    this.audioReady = false;
    this.audio = null;
    this.dialoguePool = [
      "Zero Civic Sense level: expert photobomber.",
      "Aunty: 'Beta, frame se bahar ho jao!'",
      "Public notice: this is not your personal selfie zone.",
      "Guard says: civic sense missing, suspect found.",
      "City mood: one photobomb away from chaos.",
      "You again? Every photo has your attendance.",
      "Breaking news: random stranger ruins perfect shot."
    ];
    this.dialogueTimer = 2.5;

    this.spawnInitialNPCs();
    window.addEventListener("pointerdown", () => this.initAudio(), { once: true });
    this.ui.showMessage("Click anywhere to start<br/>Move with WASD or Arrow Keys");
  }

  resetGame() {
    this.victims = [];
    this.guards = [];
    this.pedestrians = [];
    this.particles = [];
    this.timeLeft = 90;
    this.score = 0;
    this.caught = 0;
    this.civicSense = 100;
    this.combo = 0;
    this.lastPhotobombTime = -999;
    this.chaosMode = false;
    this.chaosTimer = 0;
    this.flashTimer = 0;
    this.catchCooldown = 0;
    this.elapsed = 0;
    this.player.x = this.arena.x + this.arena.width * 0.5 - this.player.width * 0.5;
    this.player.y = this.arena.y + this.arena.height * 0.65 - this.player.height * 0.5;
    this.player.walkCycle = 0;
    this.spawnInitialNPCs();
    this.state = "running";
    this.ui.hideMessage();
    this.ui.setDialogue("Back on the street. Civic sense still on vacation.");
  }

  spawnInitialNPCs() {
    for (let i = 0; i < 9; i++) this.victims.push(new Victim(this.arena));
    for (let i = 0; i < 2; i++) this.guards.push(new Guard(this.arena));
    for (let i = 0; i < 9; i++) this.pedestrians.push(new Pedestrian(this.arena));
  }

  initAudio() {
    if (this.audioReady) return;
    const ctx = new AudioContext();
    const drone = ctx.createOscillator();
    const hum = ctx.createOscillator();
    const ambientGain = ctx.createGain();
    drone.type = "triangle";
    drone.frequency.value = 110;
    hum.type = "sine";
    hum.frequency.value = 63;
    ambientGain.gain.value = 0.016;
    drone.connect(ambientGain);
    hum.connect(ambientGain);
    ambientGain.connect(ctx.destination);
    drone.start();
    hum.start();
    this.audio = { ctx, drone, hum, ambientGain };
    this.audioReady = true;
    this.state = "running";
    this.ui.hideMessage();
    this.ui.setDialogue("Game started. Try not to become local legend too quickly.");
  }

  playShutter() {
    if (!this.audioReady) return;
    const { ctx } = this.audio;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(740, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.07);
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.1);
  }

  playAlert() {
    if (!this.audioReady) return;
    const { ctx } = this.audio;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.value = 240;
    g.gain.setValueAtTime(0.06, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.16);
  }

  update(dt) {
    if (this.state !== "running") return;
    this.elapsed += dt;
    this.timeLeft -= dt;
    this.catchCooldown -= dt;
    this.flashTimer -= dt;

    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.state = "complete";
      this.updateBestScore();
      this.ui.showMessage(
        `Game Complete!<br/>Final Score: ${this.score}<br/>Best Score: ${this.bestScore}<br/><button id="restartBtn" class="overlay-btn">Restart</button>`
      );
      this.bindRestartButton();
      return;
    }

    this.player.update(dt);
    this.victims.forEach((v) => v.update(dt));
    this.pedestrians.forEach((p) => p.update(dt));
    this.guards.forEach((g) => g.update(this.player, this.civicSense, dt));
    this.updateParticles(dt);
    this.handlePhotoBombs();
    this.handleCatches();
    this.handleSpawns(dt);
    this.updateDialogue(dt);

    if (this.chaosMode) {
      this.chaosTimer -= dt;
      if (this.chaosTimer <= 0) this.chaosMode = false;
    }

    this.ui.update({
      score: this.score,
      bestScore: this.bestScore,
      timeLeft: this.timeLeft,
      caught: this.caught,
      combo: this.combo,
      civicSense: this.civicSense,
      chaosMode: this.chaosMode,
    });
  }

  handleSpawns(dt) {
    const difficulty = (100 - this.civicSense) / 100;
    if (Math.random() < (0.18 + difficulty * 0.26) * dt && this.victims.length < 12) {
      this.victims.push(new Victim(this.arena));
    }
    if (Math.random() < (0.015 + difficulty * 0.04) * dt && this.guards.length < 2) {
      this.guards.push(new Guard(this.arena));
    }
    if (Math.random() < 0.11 * dt && this.pedestrians.length < 12) {
      this.pedestrians.push(new Pedestrian(this.arena));
    }
  }

  handlePhotoBombs() {
    const playerBounds = this.player.getBounds();
    const playerCenter = this.player.getCenter();

    this.victims.forEach((victim) => {
      if (victim.state !== "photo" || victim.scored || !victim.photoZone) return;
      if (rectsIntersect(playerBounds, victim.photoZone)) {
        victim.scored = true;
        this.flashTimer = 0.16;
        this.playShutter();
        const centerRect = {
          x: victim.photoZone.x + victim.photoZone.width * 0.28,
          y: victim.photoZone.y + victim.photoZone.height * 0.28,
          width: victim.photoZone.width * 0.44,
          height: victim.photoZone.height * 0.44,
        };
        const perfect = pointInRect(playerCenter, centerRect);
        this.score += perfect ? 20 : 10;
        this.ui.setDialogue(
          perfect
            ? "Perfect photobomb. Zero civic sense, full precision."
            : "Nice entry. Somebody's profile pic is ruined."
        );
        this.spawnPhotobombParticles(playerCenter.x, playerCenter.y, perfect);
        const quick = this.elapsed - this.lastPhotobombTime < this.comboWindow;
        this.combo = quick ? this.combo + 1 : 1;
        this.lastPhotobombTime = this.elapsed;
        if (this.combo >= 3) {
          this.chaosMode = true;
          this.chaosTimer = 8;
        }
      }
    });

    if (this.elapsed - this.lastPhotobombTime > this.comboWindow) this.combo = 0;
  }

  handleCatches() {
    if (this.catchCooldown > 0) return;
    const playerBounds = this.player.getBounds();
    for (const guard of this.guards) {
      if (guard.hasCaught(playerBounds)) {
        this.caught += 1;
        this.civicSense = clamp(this.civicSense - 26, 0, 100);
        this.catchCooldown = 1.4;
        this.playAlert();
        this.ui.setDialogue("Caught! Guard says: 'Public nuisance detected.'");
        this.spawnAlertParticles(this.player.x + 16, this.player.y + 20);
        this.player.x = clamp(
          this.player.x - 120 + Math.random() * 240,
          this.arena.x + 10,
          this.arena.x + this.arena.width - this.player.width - 10
        );
        this.player.y = clamp(
          this.player.y - 80 + Math.random() * 160,
          this.arena.y + 10,
          this.arena.y + this.arena.height - this.player.height - 10
        );
        if (this.caught >= 3) {
          this.state = "gameover";
          this.updateBestScore();
          this.ui.showMessage(
            `Game Over<br/>You were caught ${this.caught} times<br/>Score: ${this.score}<br/>Best Score: ${this.bestScore}<br/><button id="restartBtn" class="overlay-btn">Restart</button>`
          );
          this.bindRestartButton();
        }
        break;
      }
    }
  }

  bindRestartButton() {
    const restartBtn = document.getElementById("restartBtn");
    if (!restartBtn) return;
    restartBtn.addEventListener("click", () => this.resetGame(), { once: true });
  }

  updateDialogue(dt) {
    this.dialogueTimer -= dt;
    if (this.dialogueTimer > 0) return;
    this.dialogueTimer = 4 + Math.random() * 2.5;
    const randomLine = this.dialoguePool[(Math.random() * this.dialoguePool.length) | 0];
    this.ui.setDialogue(randomLine);
  }

  loadBestScore() {
    try {
      return Number(localStorage.getItem("zero-civic-sense-best-score")) || 0;
    } catch {
      return 0;
    }
  }

  updateBestScore() {
    if (this.score <= this.bestScore) return;
    this.bestScore = this.score;
    try {
      localStorage.setItem("zero-civic-sense-best-score", String(this.bestScore));
    } catch {
      // Ignore storage failures and keep gameplay functional.
    }
  }

  spawnPhotobombParticles(x, y, perfect) {
    const count = perfect ? 18 : 10;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 220,
        vy: -70 - Math.random() * 120,
        life: 0.5 + Math.random() * 0.4,
        size: 2 + Math.random() * 3,
        color: perfect ? "#fff08c" : "#e4f8ff",
      });
    }
  }

  spawnAlertParticles(x, y) {
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 170,
        vy: -30 - Math.random() * 90,
        life: 0.4 + Math.random() * 0.35,
        size: 2 + Math.random() * 2,
        color: "#ff7b7b",
      });
    }
  }

  updateParticles(dt) {
    this.particles = this.particles.filter((p) => p.life > 0);
    this.particles.forEach((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 130 * dt;
    });
  }

  draw() {
    const ctx = this.ctx;
    const shakeX = this.chaosMode ? (Math.random() - 0.5) * 8 : 0;
    const shakeY = this.chaosMode ? (Math.random() - 0.5) * 6 : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);

    this.drawSky(ctx);
    this.drawBackgroundLayer(ctx);
    this.drawMidLayer(ctx);
    this.drawForeground(ctx);

    this.pedestrians.forEach((p) => p.draw(ctx));
    this.victims.forEach((v) => v.draw(ctx));
    this.guards.forEach((g) => g.draw(ctx));
    this.player.draw(ctx);
    this.drawParticles(ctx);

    if (this.flashTimer > 0) {
      const a = this.flashTimer / 0.16;
      ctx.fillStyle = `rgba(255,255,255,${a * 0.5})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    ctx.restore();
  }

  drawSky(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    g.addColorStop(0, "#1f2fe8");
    g.addColorStop(0.45, "#4a1fba");
    g.addColorStop(1, "#130f40");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawBackgroundLayer(ctx) {
    for (let x = 20; x < this.canvas.width; x += 145) {
      const floors = 2 + ((x / 145) | 0) % 3;
      const h = floors * 48 + 64;
      const y = 120 - floors * 8;
      const colors = ["#ffc914", "#00d9b6", "#ff7a30", "#ff4da6", "#5ad1ff"];
      const color = colors[Math.abs((x / 145) | 0) % colors.length];
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 128, h);
      this.drawWindows(ctx, x + 12, y + 14, 4, floors + 1);
      this.drawBalconies(ctx, x + 8, y + 42, floors);
      this.drawRooftopTanks(ctx, x + 74, y - 12);
    }
  }

  drawMidLayer(ctx) {
    for (let x = 0; x < this.canvas.width; x += 240) {
      ctx.fillStyle = "#f0f3ff";
      ctx.fillRect(x + 10, 302, 180, 62);
      ctx.fillStyle = "#28447f";
      ctx.fillRect(x + 18, 308, 164, 7);
      ctx.fillStyle = ["#ff9a1f", "#14cba8", "#ff4f8e"][((x / 240) | 0) % 3];
      ctx.fillRect(x + 20, 326, 70, 18);
      ctx.fillStyle = ["#43a8ff", "#ffd43b", "#ff6b3c"][((x / 240) | 0) % 3];
      ctx.fillRect(x + 104, 326, 70, 18);
      ctx.fillStyle = "#ffd369";
      ctx.fillRect(x + 20, 323, 70, 2);
      ctx.fillRect(x + 104, 323, 70, 2);
      for (let i = 0; i < 8; i++) {
        ctx.strokeStyle = "#405e95";
        ctx.beginPath();
        ctx.moveTo(x + 20 + i * 8, 363);
        ctx.lineTo(x + 20 + i * 8, 346);
        ctx.stroke();
      }
    }

    for (let i = 0; i < 7; i++) this.drawStreetLight(ctx, 80 + i * 185, 270);
    this.drawOverheadWires(ctx);
  }

  drawForeground(ctx) {
    const roadGrad = ctx.createLinearGradient(0, this.arena.y, 0, this.arena.y + this.arena.height);
    roadGrad.addColorStop(0, "#1e234b");
    roadGrad.addColorStop(1, "#0d1330");
    ctx.fillStyle = roadGrad;
    ctx.fillRect(this.arena.x, this.arena.y, this.arena.width, this.arena.height);
    ctx.fillStyle = "#2d3566";
    ctx.fillRect(this.arena.x, this.arena.y, this.arena.width, 14);
    ctx.fillRect(this.arena.x, this.arena.y + this.arena.height - 14, this.arena.width, 14);
    ctx.strokeStyle = "rgba(255,240,150,0.6)";
    ctx.setLineDash([18, 14]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.arena.x + this.arena.width * 0.5, this.arena.y + 16);
    ctx.lineTo(this.arena.x + this.arena.width * 0.5, this.arena.y + this.arena.height - 16);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#7681a6";
    ctx.fillRect(this.arena.x - 26, this.arena.y, 22, this.arena.height);
    ctx.fillRect(this.arena.x + this.arena.width + 4, this.arena.y, 22, this.arena.height);
    this.drawParkedVehicles(ctx);
  }

  drawWindows(ctx, x, y, cols, rows) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const glow = Math.random() > 0.48;
        ctx.fillStyle = glow ? "rgba(255,215,95,0.96)" : "rgba(115,188,255,0.88)";
        ctx.fillRect(x + c * 25, y + r * 23, 13, 12);
      }
    }
  }

  drawBalconies(ctx, x, y, floors) {
    ctx.strokeStyle = "#57739f";
    for (let f = 0; f < floors; f++) {
      ctx.strokeRect(x, y + f * 48, 104, 7);
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(x + 4 + i * 12, y + f * 48);
        ctx.lineTo(x + 4 + i * 12, y + f * 48 + 7);
        ctx.stroke();
      }
    }
  }

  drawRooftopTanks(ctx, x, y) {
    ctx.fillStyle = "#2871ba";
    ctx.fillRect(x, y, 24, 13);
    ctx.fillRect(x + 27, y + 2, 18, 11);
    ctx.fillStyle = "rgba(210,240,255,0.46)";
    ctx.fillRect(x + 4, y + 4, 8, 4);
  }

  drawStreetLight(ctx, x, y) {
    ctx.strokeStyle = "#5670a5";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 165);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y + 5);
    ctx.lineTo(x + 18, y + 5);
    ctx.stroke();
    const glow = ctx.createRadialGradient(x + 19, y + 10, 2, x + 19, y + 10, 48);
    glow.addColorStop(0, "rgba(255,210,70,0.9)");
    glow.addColorStop(1, "rgba(255,210,70,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - 30, y - 34, 100, 100);
  }

  drawOverheadWires(ctx) {
    ctx.strokeStyle = "rgba(25,35,70,0.82)";
    ctx.lineWidth = 1.8;
    for (let y = 182; y <= 246; y += 16) {
      ctx.beginPath();
      for (let x = 0; x <= this.canvas.width; x += 80) {
        const wave = Math.sin((x + y) * 0.014) * 4;
        if (x === 0) ctx.moveTo(x, y + wave);
        else ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }
  }

  drawParkedVehicles(ctx) {
    for (let i = 0; i < 5; i++) {
      const x = 160 + i * 210;
      const scooterColor = ["#ffc316", "#26d9ff", "#ff4f93"][((i + 9) * 7) % 3];
      ctx.fillStyle = scooterColor;
      ctx.fillRect(x + 4, this.arena.y + 22, 30, 11);
      ctx.fillStyle = "#212947";
      ctx.beginPath();
      ctx.arc(x + 10, this.arena.y + 36, 5, 0, Math.PI * 2);
      ctx.arc(x + 30, this.arena.y + 36, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = ["#3df4b8", "#ffb24e", "#4cb4ff"][((i + 1) * 3) % 3];
      ctx.fillRect(x + 48, this.arena.y + this.arena.height - 34, 54, 17);
      ctx.fillStyle = "rgba(215,238,255,0.95)";
      ctx.fillRect(x + 81, this.arena.y + this.arena.height - 31, 16, 8);
      ctx.fillStyle = "#212947";
      ctx.beginPath();
      ctx.arc(x + 58, this.arena.y + this.arena.height - 17, 6, 0, Math.PI * 2);
      ctx.arc(x + 89, this.arena.y + this.arena.height - 17, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawParticles(ctx) {
    this.particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life / 0.7);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
}
