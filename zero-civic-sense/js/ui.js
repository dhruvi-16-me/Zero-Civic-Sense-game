export class GameUI {
  constructor(hudEl, messageEl) {
    this.hudEl = hudEl;
    this.messageEl = messageEl;
    this.hudEl.innerHTML = `
      <div class="hud-row">
        <div class="panel"><div class="label">Score</div><div class="value" id="scoreVal">0</div></div>
        <div class="panel"><div class="label">Best</div><div class="value" id="bestVal">0</div></div>
        <div class="panel"><div class="label">Time</div><div class="value" id="timeVal">90</div></div>
        <div class="panel"><div class="label">Caught</div><div class="value" id="caughtVal">0/3</div></div>
        <div class="panel"><div class="label">Combo</div><div class="value" id="comboVal">x0</div></div>
        <div class="panel bar-wrap">
          <div class="label">Civic Sense</div>
          <div class="bar"><div id="civicBar"></div></div>
        </div>
      </div>
      <div class="hud-row">
        <div class="panel dialogue-wrap">
          <div class="label">Street Commentary</div>
          <div class="dialogue" id="dialogueVal">Welcome to Zero Civic Sense.</div>
        </div>
      </div>
    `;
    this.scoreVal = document.getElementById("scoreVal");
    this.bestVal = document.getElementById("bestVal");
    this.timeVal = document.getElementById("timeVal");
    this.caughtVal = document.getElementById("caughtVal");
    this.comboVal = document.getElementById("comboVal");
    this.civicBar = document.getElementById("civicBar");
    this.dialogueVal = document.getElementById("dialogueVal");
  }

  update(state) {
    this.scoreVal.textContent = String(state.score);
    this.bestVal.textContent = String(state.bestScore);
    this.timeVal.textContent = String(Math.max(0, Math.floor(state.timeLeft)));
    this.caughtVal.textContent = `${state.caught}/3`;
    this.comboVal.textContent = state.chaosMode ? "CHAOS!" : `x${state.combo}`;
    this.comboVal.style.color = state.chaosMode ? "#ffef88" : "#ffffff";
    this.civicBar.style.width = `${state.civicSense}%`;
  }

  showMessage(text) {
    this.messageEl.innerHTML = text;
    this.messageEl.classList.remove("hidden");
  }

  hideMessage() {
    this.messageEl.classList.add("hidden");
  }

  setDialogue(text) {
    if (!this.dialogueVal) return;
    this.dialogueVal.textContent = text;
  }
}
