# Zero Civic Sense

Zero Civic Sense is a vibrant 2D browser arcade game built with HTML, CSS, and JavaScript (Canvas API).  
The player moves in a top-down/slightly angled urban street and photobombs active photo zones while avoiding guards.

## Game Concept

- Round duration: **90 seconds**
- Core action: enter victim photo zones to score
  - **+10** for normal photobomb
  - **+20** for perfect center photobomb
- Combo mechanic: 3 quick photobombs activate **Chaos Mode**
- Lose condition: caught by guards **3 times**
- Win condition: survive until timer reaches **0**
- Dynamic pressure: civic sense meter drops on catches and increases difficulty

## Current Features

- Top-down free movement in a fixed arena (`WASD` / arrow keys)
- NPC victims that create temporary photo zones
- Guard AI chase + patrol behavior
- Ambient crowd pedestrians
- Camera flash + particle effects
- Funny live dialogue panel ("Street Commentary")
- Restart button on end screens
- Persistent **Best Score** tracking via browser localStorage

## Controls

- `W`, `A`, `S`, `D` or `Arrow Keys`: Move player
- Mouse click (first time only): Start game + enable audio
- `Restart` button: Start a fresh round after game over/completion

## Folder Structure

```text
/zero-civic-sense
│── index.html
│── style.css
│── README.md
│── /js
│     ├── main.js
│     ├── player.js
│     ├── npc.js
│     ├── gameManager.js
│     ├── collision.js
│     └── ui.js
│── /assets
│     ├── /sprites
│     ├── /sounds
│     └── /backgrounds
```

## Game Loop (How It Works)

Main loop is implemented with `requestAnimationFrame` in `js/main.js`:

1. Calculate `dt` (delta time) from frame timing
2. `game.update(dt)`:
   - updates player movement and NPC AI
   - processes scoring, combos, catches, timer, and state transitions
   - updates dialogue and UI state
3. `game.draw()`:
   - renders sky, buildings, roads, props, NPCs, player, glow, and particles
4. Repeat on next animation frame

## Visual Direction

The game world is designed as a colorful modern Indian urban street:

- Vibrant low-rise buildings with balcony grills
- Rooftop water tanks
- Local shop strips and clean overhead wires
- Warm-glow streetlights
- Sidewalk edges, road markings, and parked scooters/cars

## Tech Notes

- Canvas rendering only (no external game engine)
- Modular ES modules for maintainability
- Procedural Web Audio for lightweight ambient + effects
- Fast loading with no mandatory external asset downloads
