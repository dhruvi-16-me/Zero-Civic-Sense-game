# Zero Civic Sense

Zero Civic Sense is a 2D arcade browser game set in a colorful Indian urban street at sunset.  
The camera is fixed in a top-down/slightly angled view, and gameplay is about positioning inside active photo zones while avoiding guards.

## Game Concept

- Match lasts **60 seconds**
- Enter a victim photo zone to photobomb:
  - **+10** normal photobomb
  - **+20** perfect center photobomb
- Chain 3 quick photobombs to trigger **Chaos Mode** (screen shake + pressure gameplay)
- If guards catch you 3 times: **Game Over**
- If timer reaches 0: **Game Complete**
- Civic Sense meter drops when caught, making guards and spawns more aggressive

## Controls

- `WASD` or `Arrow Keys` to move
- Click once to enable browser audio

## Folder Structure

```text
/zero-civic-sense
│── index.html
│── style.css
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

## Game Loop Explanation

The game loop runs with `requestAnimationFrame` in `js/main.js`:

1. Compute delta time (`dt`) based on frame time
2. Call `game.update(dt)` to:
   - update player, NPCs, timers, combos, collisions, spawns, and states
3. Call `game.draw()` to render:
  - top-down city block background, street details, NPCs, glows, particles, and camera flash
4. Queue next frame

## Notes

- Rendering is Canvas API only, with modular ES modules.
- Audio is generated via Web Audio API for fast loading and no external sound dependency.
- Visual identity includes:
  - low-rise apartments with balcony grills
  - rooftop water tanks
  - parked scooters/cars
  - warm streetlights and shop strips
  - clean overhead electrical wires
