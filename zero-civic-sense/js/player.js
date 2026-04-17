import { clamp } from "./collision.js";

export class Player {
  constructor(arena) {
    this.width = 30;
    this.height = 40;
    this.x = arena.x + arena.width * 0.5 - this.width * 0.5;
    this.y = arena.y + arena.height * 0.65 - this.height * 0.5;
    this.speed = 250;
    this.arena = arena;
    this.direction = 1;
    this.walkCycle = 0;
    this.keys = { left: false, right: false, up: false, down: false };
  }

  bindInput() {
    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") this.keys.left = true;
      if (k === "arrowright" || k === "d") this.keys.right = true;
      if (k === "arrowup" || k === "w") this.keys.up = true;
      if (k === "arrowdown" || k === "s") this.keys.down = true;
    });
    window.addEventListener("keyup", (e) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") this.keys.left = false;
      if (k === "arrowright" || k === "d") this.keys.right = false;
      if (k === "arrowup" || k === "w") this.keys.up = false;
      if (k === "arrowdown" || k === "s") this.keys.down = false;
    });
  }

  update(dt) {
    let vx = 0;
    let vy = 0;
    if (this.keys.left) vx -= 1;
    if (this.keys.right) vx += 1;
    if (this.keys.up) vy -= 1;
    if (this.keys.down) vy += 1;

    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy) || 1;
      vx /= len;
      vy /= len;
      this.x += vx * this.speed * dt;
      this.y += vy * this.speed * dt;
      this.walkCycle += dt * 12;
      if (vx > 0) this.direction = 1;
      if (vx < 0) this.direction = -1;
    }

    this.x = clamp(this.x, this.arena.x, this.arena.x + this.arena.width - this.width);
    this.y = clamp(this.y, this.arena.y, this.arena.y + this.arena.height - this.height);
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  getCenter() {
    return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
  }

  draw(ctx) {
    const x = this.x;
    const y = this.y;
    const legSwing = Math.sin(this.walkCycle) * 2.4;

    // Strong ground shadow to anchor top-down readability.
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(x + 15, y + 37, 13, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(x + this.width / 2, y + this.height / 2);
    ctx.scale(this.direction, 1);
    ctx.translate(-this.width / 2, -this.height / 2);

    // Outline first so the player remains visible on all surfaces.
    ctx.fillStyle = "#0d1733";
    ctx.fillRect(6, 8, 18, 26);

    // High-contrast colors as requested.
    ctx.fillStyle = "#ff3d3d";
    ctx.fillRect(8, 10, 14, 20);
    ctx.fillStyle = "#ffd21f";
    ctx.fillRect(9, 20, 12, 6);

    ctx.fillStyle = "#ffc38e";
    ctx.beginPath();
    ctx.arc(15, 7, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1d2f66";
    ctx.fillRect(8, 2, 14, 4);

    ctx.fillStyle = "#0b132e";
    ctx.fillRect(8, 30, 5, 7 + legSwing);
    ctx.fillRect(17, 30, 5, 7 - legSwing);

    // Thin glow edge.
    ctx.strokeStyle = "rgba(255,242,130,0.8)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(7, 9, 16, 22);

    ctx.restore();
  }
}
