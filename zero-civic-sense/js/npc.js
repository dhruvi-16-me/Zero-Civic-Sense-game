import { clamp, rectsIntersect } from "./collision.js";

const NPC_COLORS = ["#ffcc35", "#ff7fd2", "#2ff0bd", "#44b6ff", "#ff9c45"];

export class Victim {
  constructor(arena) {
    this.arena = arena;
    this.width = 26;
    this.height = 34;
    this.x = arena.x + 30 + Math.random() * (arena.width - 70);
    this.y = arena.y + 30 + Math.random() * (arena.height - 70);
    this.color = NPC_COLORS[(Math.random() * NPC_COLORS.length) | 0];
    this.state = "walk";
    this.speed = 36 + Math.random() * 26;
    this.dir = Math.random() > 0.5 ? 1 : -1;
    this.photoTimer = 1.7 + Math.random() * 1.4;
    this.photoZone = null;
    this.scored = false;
    this.vy = Math.random() > 0.5 ? 1 : -1;
  }

  update(dt) {
    if (this.state === "walk") {
      this.x += this.dir * this.speed * dt;
      this.y += this.vy * this.speed * 0.65 * dt;
      if (this.x < this.arena.x + 4 || this.x > this.arena.x + this.arena.width - this.width - 4) this.dir *= -1;
      if (this.y < this.arena.y + 6 || this.y > this.arena.y + this.arena.height - this.height - 6) this.vy *= -1;
      this.photoTimer -= dt;
      if (this.photoTimer <= 0) {
        this.state = "photo";
        this.photoTimer = 2;
        this.photoZone = {
          x: this.x - 42 + Math.random() * 24,
          y: this.y - 42 + Math.random() * 24,
          width: 92,
          height: 92,
        };
      }
    } else {
      this.photoTimer -= dt;
      if (this.photoTimer <= 0) {
        this.state = "walk";
        this.photoTimer = 1.8 + Math.random() * 1.5;
        this.scored = false;
        this.photoZone = null;
        this.dir = Math.random() > 0.5 ? 1 : -1;
        this.vy = Math.random() > 0.5 ? 1 : -1;
      }
    }
    this.x = clamp(this.x, this.arena.x, this.arena.x + this.arena.width - this.width);
    this.y = clamp(this.y, this.arena.y, this.arena.y + this.arena.height - this.height);
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  draw(ctx) {
    const x = this.x;
    const y = this.y;

    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.beginPath();
    ctx.ellipse(x + 13, y + 31, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#111a36";
    ctx.fillRect(x + 5, y + 6, 16, 20);
    ctx.fillStyle = this.color;
    ctx.fillRect(x + 6, y + 7, 14, 18);
    ctx.fillStyle = "#ffd1ad";
    ctx.beginPath();
    ctx.arc(x + 13, y + 4, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1f2c5a";
    ctx.fillRect(x + 7, y + 25, 5, 8);
    ctx.fillRect(x + 15, y + 25, 5, 8);

    if (this.state === "photo" && this.photoZone) {
      const zone = this.photoZone;
      const glow = ctx.createRadialGradient(
        zone.x + zone.width * 0.5,
        zone.y + zone.height * 0.5,
        10,
        zone.x + zone.width * 0.5,
        zone.y + zone.height * 0.5,
        72
      );
      glow.addColorStop(0, "rgba(80,220,255,0.2)");
      glow.addColorStop(1, "rgba(80,220,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(zone.x - 10, zone.y - 10, zone.width + 20, zone.height + 20);

      ctx.strokeStyle = "rgba(98,240,255,0.95)";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
      ctx.setLineDash([]);
      ctx.fillStyle = "#e8ffff";
      ctx.fillRect(x + 1, y + 13, 8, 6);
    }
  }
}

export class Guard {
  constructor(arena) {
    this.arena = arena;
    this.width = 28;
    this.height = 34;
    this.x = arena.x + 30 + Math.random() * (arena.width - 60);
    this.y = arena.y + 30 + Math.random() * (arena.height - 60);
    this.baseSpeed = 78;
    this.dir = Math.random() > 0.5 ? 1 : -1;
    this.vy = Math.random() > 0.5 ? 1 : -1;
    this.alertRange = 190;
  }

  update(player, civicSense, dt) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.hypot(dx, dy);
    const difficultyBoost = (100 - civicSense) * 0.34;
    const speed = this.baseSpeed + difficultyBoost;

    if (distance < this.alertRange) {
      const inv = 1 / (distance || 1);
      this.x += dx * inv * speed * dt;
      this.y += dy * inv * speed * dt;
      this.dir = Math.sign(dx) || this.dir;
    } else {
      this.x += this.dir * (speed * 0.38) * dt;
      this.y += this.vy * (speed * 0.3) * dt;
      if (Math.random() < 0.008) this.dir *= -1;
      if (Math.random() < 0.008) this.vy *= -1;
    }

    if (this.x < this.arena.x + 2 || this.x > this.arena.x + this.arena.width - this.width - 2) this.dir *= -1;
    if (this.y < this.arena.y + 2 || this.y > this.arena.y + this.arena.height - this.height - 2) this.vy *= -1;
    this.x = clamp(this.x, this.arena.x, this.arena.x + this.arena.width - this.width);
    this.y = clamp(this.y, this.arena.y, this.arena.y + this.arena.height - this.height);
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  hasCaught(playerBounds) {
    return rectsIntersect(this.getBounds(), playerBounds);
  }

  draw(ctx) {
    const x = this.x;
    const y = this.y;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(x + 14, y + 31, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Distinct guard look: dark vest, red cap, baton.
    ctx.fillStyle = "#0d193d";
    ctx.fillRect(x + 6, y + 7, 16, 19);
    ctx.fillStyle = "#324f9f";
    ctx.fillRect(x + 8, y + 10, 12, 15);
    ctx.fillStyle = "#ff5b57";
    ctx.fillRect(x + 7, y - 1, 14, 4);
    ctx.fillStyle = "#ffd7b4";
    ctx.beginPath();
    ctx.arc(x + 14, y + 4, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1f2a56";
    ctx.fillRect(x + 8, y + 25, 5, 8);
    ctx.fillRect(x + 15, y + 25, 5, 8);
    ctx.fillStyle = "#1a1f31";
    ctx.fillRect(x + 20, y + 14, 8, 3);

    ctx.strokeStyle = "rgba(255,85,85,0.65)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(x + 14, y + 17, 24, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export class Pedestrian {
  constructor(arena) {
    this.arena = arena;
    this.width = 20;
    this.height = 26;
    this.x = arena.x + Math.random() * (arena.width - this.width);
    this.y = arena.y + Math.random() * (arena.height - this.height);
    this.speed = 28 + Math.random() * 30;
    this.dir = Math.random() > 0.5 ? 1 : -1;
    this.vy = Math.random() > 0.5 ? 1 : -1;
    this.color = NPC_COLORS[(Math.random() * NPC_COLORS.length) | 0];
  }

  update(dt) {
    this.x += this.dir * this.speed * dt;
    this.y += this.vy * this.speed * 0.7 * dt;
    if (this.x < this.arena.x || this.x > this.arena.x + this.arena.width - this.width) this.dir *= -1;
    if (this.y < this.arena.y || this.y > this.arena.y + this.arena.height - this.height) this.vy *= -1;
  }

  draw(ctx) {
    const x = this.x;
    const y = this.y;
    ctx.globalAlpha = 0.86;
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(x + 10, y + 24, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.color;
    ctx.fillRect(x + 5, y + 7, 10, 13);
    ctx.fillStyle = "#ffd9be";
    ctx.beginPath();
    ctx.arc(x + 10, y + 4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
