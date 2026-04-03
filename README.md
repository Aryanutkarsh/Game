# Chicken Fry 🐔🔥

Chicken Fry is a high-stakes, fast-paced casual "crash" style betting game wrapped in an aggressive **Neo-Brutalist** UI. Players take on the role of a daring chicken crossing perilous grates to multiply their bet. Keep moving, press your luck, and cash out before the chicken gets fried!

## Features

- **Push-Your-Luck Mechanics:** Every jump increments your multiplier, but increases the risk. Do you jump or cash out?
- **Neo-Brutalist Theme:** Thick borders, stark shadows, and vibrant colors (`#FF3333` Neo-Red, `#FFD93D` Neo-Yellow) for an intense UI feel.
- **Three Difficulties:** 
  - *Easy*: 95% survival chance.
  - *Medium*: 85% survival chance.
  - *Hardcore*: Diminishing survival returns for massive payouts (up to 140x).
- **Idle Pressure Mechanism:** You only have 3 seconds to make a move on a tile. Hesitating gets the chicken automatically fried!
- **Audio & Visual Effects:** Powered by Lottie Web Animations (`dotLottie`) bridging full-screen fire and falling money alongside dynamic click, reward, and explosion sounds.
- **Responsive Layout:** Automatically scales lane size and sprite alignment to fit mobile and desktop screens properly.

## Tech Stack
- **HTML5:** Structuring the core application layers (Z-indexed panels).
- **Tailwind CSS:** Used aggressively via CDN for rapid styling, custom themes, sizing, animations (`animate-hop`, `.animate-squash`), and Neo-Brutalism tokens.
- **Vanilla JavaScript:** Handles DOM updates without frameworks, orchestrates HTML5 `<Audio>` elements, math/bet states, and `setTimeout` intervals for sequence matching.
- **DotLottie Player:** Renders interactive, high-performance vector graphics (fire/cash).

---

## 💀 The "Fried" Logic (Death Mechanics)

In this game, the chicken faces multiple scenarios where it gets "fried" and the player loses their bet. This translates to the game ending with a $0 payout.

The death scenarios are powered by a combination of active and passive risks within the underlying engine.

### 1. Active Risk: RNG (Random Number Generator) Failure
When you choose to **Jump** to the next multiplier tile, the game computes a survival chance based on your selected difficulty.

*   `Math.random()` generates a random decimal number between `0` and `1`.
*   The game compares this number to the current tile's `survivalChance` inside the `GAME_DATA` object.
*   If your generated number falls above the `survivalChance`, the chicken dies (`survives = false`).

**Difficulty Behavior:**
*   **Easy & Medium:** Use a static flat survival percentage per jump (e.g., 95% and 85%).
*   **Hardcore:** Uses an *array* of shrinking survival chances (`[0.85, 0.80, 0.75, 0.70, 0.65...]`). The first jump is relatively safe, but taking deeper steps quickly plunges the survival rate drastically, guaranteeing you will ultimately have to test your luck on lower and lower probabilities. 

### 2. Passive Risk: The 3-Second Idle Penalty
If you manage to survive a jump, you cannot pause indefinitely. A pressure mechanic strictly enforces making rapid choices.

*   Once a jump animation completes and you land safely, `startIdleTimer()` starts a 3000ms (3-second) countdown loop using `setTimeout`.
*   If you don't interact with the game by triggering `takeStep()` (Jump) or `cashOut()` (Take the money) within those 3 seconds, `handleIdleDeath()` forcefully executes.
*   The chicken catches fire, the screen flashes **KEEP MOVING!**, and you lose the round automatically. 

### Visual & Audio Death Handling
Whenever the chicken fails a roll or hits the idle timeout:
1.  **Sprite Replacement:** The standard `Chicken.svg` is instantly swapped out for `fried.svg` (turning it into a cooked meal).
2.  **Animation Hook:** The CSS animation `.animate-squash` physically crushes the sprite on the DOM.
3.  **Fire Explosion:** `triggerExplosion()` reveals the full-screen Fire Lottie effect stretching natively across the app window, accompanied by the `fire.wav` audio blast. The normal `money.lottie` logic is skipped entirely on losses.
4.  **UI Sync:** The game state immediately terminates and returns a `0` profit.

## Setup & Running
The game is completely client-side. Simply open `index.html` in any modern web browser to play!