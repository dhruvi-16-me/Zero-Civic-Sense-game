import { GameManager } from "./gameManager.js";
import { GameUI } from "./ui.js";

const canvas = document.getElementById("gameCanvas");
const hud = document.getElementById("hud");
const message = document.getElementById("messageOverlay");

const ui = new GameUI(hud, message);
const game = new GameManager(canvas, ui);

let last = performance.now();
function gameLoop(now) {
  const dt = Math.min((now - last) / 1000, 0.033);
  last = now;
  game.update(dt);
  game.draw();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
