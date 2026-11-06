# Phone performance follow-up — 22 October 2026

Initial mobile feedback found lower responsiveness in an in-app browser than in Safari. This update addresses rendering and touch overhead across supported devices; no phone-specific browser was directly controlled during development.

Changes:
- Static island geometry, instance transforms and vertex colors bake into one mesh per island in Smooth mode. Moving platform parents, character, hazards, weather and portal animation remain separate.
- Static background islands and garden castle also batch. Extra checkpoint/portal point lights are omitted in Smooth mode; emissive portal effects remain.
- Joystick drag updates shared input and the composited thumb directly, without continuous React state updates.
- Simulation runs before character/obstacle animation each frame, removing the previous one-frame visual lag.
- Phone HUD backdrop blur is disabled. Normal touch render density starts at 1.25 and reduces to 1 if needed; weak devices use .85. Mobile antialias overhead is disabled. Adaptation samples two seconds and reacts below 50 FPS rather than waiting until below 32.

Verification:
- 43 tests passed, including all twelve complete gameplay routes, independent touch pointers, safe saves, baking color/transform preservation and adaptation at 45 FPS.
- Production build passed. Non-fatal Three.js bundle-size advisory remains.
- Controlled starting-scene comparison at 430x820, Smooth quality: 317 unbatched vs 142 final batched draw calls (55% fewer). The local switch was removed: production always uses batching in Smooth mode.
- Garden and Aurora Summit scenes visually inspected. Atlas, Jump, pause/resume and High-to-Smooth switching worked without console warnings/errors.
- Portrait 430x820 and landscape 767x355 actual CSS dimensions inspected without document overflow. Browser zoom changed during testing; requested landscape dimensions were not falsely treated as the actual CSS size.
- No save key or physics tuning changes. No new dependencies.

Limits:
Desktop render-call measurements do not establish iPhone frame rate. Physical Safari, Telegram and Android retesting is still needed. No browser game can guarantee identical performance on all hardware or embedded browsers. This update reduces submitted rendering work and input/UI overhead; it does not claim universal 60 FPS.

Published successfully as version 6. Production menu loaded, the previous World 2 Continue save remained available, and no console warnings/errors were captured.
