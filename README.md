# Adventure Runner 3D — Floating Gardens

A complete twelve-world browser platformer built with Vite, React 19, React Three Fiber and Three.js. All game geometry, effects and sounds are created in code. The four supplied images guide the red-capped backpack character, floating gardens, spinning red bars, checkpoint and blue portal.

## Download and play

The repository download includes the source, the ready-to-host production build in [dist/](dist/), the [implementation guide](docs/Adventure-Runner-3D-Implementation-and-Architecture.pdf), and [test reports and screenshots](docs/verification/). Upload the contents of dist to a static web host, or use the local launcher below.

## Play locally

Requires Node.js 20.19+ or 22.12+ (tested with Node 24).

1. Open this folder in a terminal.
2. Run `npm install` (first time only).
3. Run `npm run dev`.
4. Open the local address printed in the terminal.

On Windows you can double-click **Play Adventure Runner.cmd**. Keep its terminal open while playing. No account or paid assets are needed for local play.

## Controls

- **WASD / arrow keys:** move in the direction of the path.
- **Space:** jump. Release between jumps.
- **Esc / P:** pause or resume. Switching away from the browser also pauses the run.
- **R:** start a new run from the victory or game-over screen.
- On a phone or tablet, drag the left thumb joystick and tap the large Jump button with the right thumb. Gentle drags walk; full drags run.
- Top-right buttons control sound, fullscreen and pause.
- The menu offers Follow/Wide camera and High/Smooth graphics.

## Your adventure

Open **Choose world** from the main menu to explore the full atlas. All worlds are playable immediately; completion is tracked individually, and the victory screen offers the next world.

1. Floating Gardens — green islands, a castle and waterfalls.
2. Ember Canyon — crystals and lava falls.
3. Frostfall Peaks — snow, ice cliffs and snowy trees.
4. Sunstone Dunes — cacti, sandstone and pyramids.
5. Emerald Canopy — jungle palms and a stepped temple.
6. Coral Coast — tropical islands, turquoise water and a lighthouse.
7. Amberwood Valley — autumn forests and a turning windmill.
8. Moonstone Orbit — silver rocks, stars and a ringed planet.
9. Mushroom Hollow — giant mushrooms and glowing spores.
10. Thunderhead Isles — storm clouds, rain and electric beacons.
11. Obsidian Forge — dark volcanic rock and lava.
12. Aurora Summit — snow and northern-light ribbons.

Every world has its own route, moving platforms, obstacle placements, coin collection, checkpoint and finish portal. Finish for one star, collect at least 60% of coins for another, and finish within the world time target with at least two hearts for the third. Jump over gaps, spikes and rotating red bars. Moving platforms carry you; move toward the far edge and choose your jump timing.

You have three hearts. A fall or obstacle hit returns you to your latest safe spawn. The checkpoint activates on reaching its island, restores all hearts, and changes the respawn point. Collected coins remain collected after damage. A new run resets all progress. The timer stops while paused and on completion. Each world has its own fastest completed time. World completion and times are stored in this browser, when browser storage is allowed.

## Checks

- `npm test`: 41 automated checks covering movement, jump/landing, pause, damage, game over, coin persistence, checkpoint, rotating obstacles, platform carry, jump distances, local records and full input-driven completions of all twelve worlds with no damage or immunity, and save migration.
- `npm run build`: creates the production site in `dist/`.
- `npm run preview`: serves the production build locally.

## Project layout

- `src/game.js`: deterministic gameplay and the original two routes.
- `src/worlds.js`: ten additional route layouts and twelve visual themes.
- `src/Scene.jsx`: Three.js world, character animation, portal/water shaders and follow camera.
- `src/main.jsx`: menus, HUD, input, touch controls, settings and records.
- `src/audio.js`: locally synthesized sound effects.
- `src/game.test.js`: gameplay tests and complete route verification.

## Practical limits

A WebGL-capable browser with hardware acceleration is required. Smooth graphics disables shadows and uses a lower pixel density for smaller devices. Artwork is an original low-poly interpretation of the references, rather than an exact recreation of rendered concept art. The game has twelve complete worlds; there is no account, server leaderboard or multiplayer. Fullscreen and audio follow browser support and user-gesture restrictions. Vite may report a bundle-size advisory because the build includes the Three.js engine.

## Map, stars and Continue Adventure

- **MAP** in the top menu (or **M**) opens the world atlas and pauses an active run.
- **All worlds**, **Played** and **Completed** filter the map cards. Each card shows the route, best earned stars and coin/checkpoint/portal task progress.
- Finishing a world earns one star. Collecting at least 60% of its coins earns another; beating the world time target with at least two hearts earns the third. Replaying with a lower score never removes previously earned stars.
- Selecting the current world from an in-game map resumes that same run. Selecting another world previews it; **Start New Run** explicitly starts a new adventure there.
- **Continue Adventure** restores the saved world, timer, hearts and collected coins. Runs autosave approximately every two seconds and when paused or leaving the page.
- Continue restores the last safe position on solid ground. If you leave while jumping or riding a moving platform, you return to the last solid island with a brief grace period.
- Saved runs, tasks and stars stay in the same browser/site. Browser storage must be available. A finished or game-over run is not offered as a resumable run.
- Verification now includes **41 automated tests**, plus browser checks of Map pause/resume, Played/Completed filtering, old-star migration, and Continue after reload.

## Mobile play improvements

The old four-arrow pad has been replaced by a proportional thumb joystick. Movement and jump use separate pointer owners, so releasing jump does not stop steering. Quick jump taps are buffered until the next game step. A radial dead zone prevents drift; partial joystick deflection supports precise walking.

The phone camera looks toward upcoming platforms, offers a wider view and follows jump height less strongly. A green landing marker previews a reachable surface during a jump. Coin pickups animate the counter. Portrait and landscape layouts use larger controls, phone safe-area spacing and a compact HUD; detailed tasks remain available through Map.

Current validation: 41 automated tests passed, production build passed, and portrait (390×844) / landscape (844×390) browser layouts were checked without document overflow. Multi-touch control ownership and quick taps were tested in code; physical iPhone/Android play-testing remains to be done.


## Latest mobile and visual polish

Floating left-half joystick, independent right-thumb jump (94–112px in tested portrait layouts), hold-to-jump higher, coyote time and buffered quick taps. Tasks collapse above the controls; safe-area spacing, compact icons and landscape layout keep the play area clear. Browser gesture defaults are suppressed over the game.

Low-memory/core and touch devices start in Smooth mode. Four-second frame sampling reduces detail, disables shadows and lowers render resolution further when frame rate falls below 32 FPS. High mode provides soft shadows; both modes retain animated water, clouds, portal and particles. The scene is memoized independently of HUD updates, and coin details share one draw call per coin. No new runtime dependencies.

Pickup sparkles, run/landing dust, jump squash/stretch, camera look-ahead and FOV response, hit shake, respawn fade and animated victory medals add feedback. Audio and music initialize after a gesture; mute and haptics settings persist. Vibration is optional and depends on browser/device support.

New modules: `Effects.jsx` (pooled particles and performance sampling), `preferences.js` (settings, device profiles, haptics), `Icon.jsx` (HUD icons). Existing save keys and twelve worlds are preserved. See [the polish report](docs/verification/Polish-Verification.md) for checks and practical limits. Real phone hardware performance has not been measured; viewport testing is not physical device testing.

## Phone performance follow-up (2026-10-22)

Smooth mode now bakes static island scenery (including flowers, fences, trees and rocks) into a single colored mesh per island, while moving islands retain their transforms and hazards remain animated separately. Background scenery is batched too. In the same 430x820 start scene, drawing commands fell from 317 to 142 (55%). This measures submitted rendering work, not iPhone FPS.

Joystick movement writes its thumb transform directly and updates shared input immediately, avoiding React renders for every drag event. Physics runs before character animation to avoid an extra frame of visual delay. Phone HUD backdrop blur is disabled. Mobile antialias overhead is reduced; normal touch devices start at 1.25 render density and adapt to 1 when frame rate is below 50, sampled every two seconds. Low-power devices retain their lower density.

43 tests pass, including scenery colors, transforms, instances, and faster adaptation. Phone browser layout and graphics toggling were checked in the desktop preview. The updated build still needs physical Safari/Telegram retesting; universal frame-rate guarantees are not possible.
