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
    const armSwing = Math.sin(this.walkCycle + Math.PI * 0.5) * 1.8;

    // Strong ground shadow to anchor top-down readability.
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(x + 15, y + 37, 13, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(x + this.width / 2, y + this.height / 2);
    ctx.scale(this.direction, 1);
    ctx.translate(-this.width / 2, -this.height / 2);

    // Human proportions: head, neck, torso, arms and legs.
    ctx.fillStyle = "#121a39";
    ctx.fillRect(4, 9, 22, 25);

    // Jacket torso.
    ctx.fillStyle = "#ff3a36";
    ctx.fillRect(7, 14, 16, 14);
    ctx.fillStyle = "#ffd11f";
    ctx.fillRect(13, 14, 4, 14);

    // Neck.
    ctx.fillStyle = "#ffca9f";
    ctx.fillRect(13, 11, 4, 3);

    // Arms with slight walk swing.
    ctx.fillStyle = "#ff3a36";
    ctx.fillRect(5, 15 + armSwing, 3, 10);
    ctx.fillRect(22, 15 - armSwing, 3, 10);
    ctx.fillStyle = "#ffca9f";
    ctx.fillRect(5, 24 + armSwing, 3, 3);
    ctx.fillRect(22, 24 - armSwing, 3, 3);

    // Head.
    ctx.fillStyle = "#ffd1ad";
    ctx.beginPath();
    ctx.arc(15, 8, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Hair and facial hints.
    ctx.fillStyle = "#1b2451";
    ctx.fillRect(9, 1, 12, 4);
    ctx.fillRect(8, 4, 2, 3);
    ctx.fillRect(20, 4, 2, 3);
    ctx.fillStyle = "#1a233f";
    ctx.fillRect(12, 8, 1.6, 1.6);
    ctx.fillRect(16.4, 8, 1.6, 1.6);

    // Legs and shoes.
    ctx.fillStyle = "#213567";
    ctx.fillRect(9, 28, 5, 8 + legSwing);
    ctx.fillRect(16, 28, 5, 8 - legSwing);
    ctx.fillStyle = "#0d1228";
    ctx.fillRect(8, 36 + legSwing, 6, 2);
    ctx.fillRect(16, 36 - legSwing, 6, 2);

    // Visibility outline.
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.strokeRect(6.5, 13.5, 17, 15);
    ctx.strokeStyle = "rgba(255,242,130,0.72)";
    ctx.strokeRect(5.5, 12.5, 19, 17);

    ctx.restore();
  }
}
