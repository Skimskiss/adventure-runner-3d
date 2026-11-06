# Mobile and visual polish verification

Validated 2026-10-22. 41 automated tests passed; production build passed. No new runtime dependencies.

## Requirement audit

| Area | Delivered and evidence |
|---|---|
| Preserve gameplay and 12 worlds | All twelve full input-driven route completion tests pass without damage, teleporting or immunity. Moving platforms, spikes, rotating bars, coins, checkpoint, health and victory tests pass. Browser atlas displays all twelve routes. |
| Existing saves | Existing v1 storage keys retained. Tests cover legacy stars, records, unavailable storage, safe Continue. Browser Continue restored 13 coins, two hearts, checkpoint and elapsed time after reload. |
| Visuals | Soft shadow High toggle; themed sky gradient/fog/sun sprite; spinning single-mesh coins; pooled pickup sparkles/run and landing dust; squash/stretch; smoothed look-ahead/FOV camera; animated portal/water/clouds. Production build and live scene inspected. |
| HUD and victory | Shared SVG icons, coin counter animation, heart-loss shake, collapsible tasks, animated victory stars and time/coin/hearts medals. Victory screenshot used an isolated temporary UI fixture (42 seconds, 15/22 coins, 3 hearts), removed before packaging. Scoring is unit-tested. |
| Mobile controls | Floating left-half joystick with proportional dead zone and separate jump pointer ownership. Unit tests prove simultaneous run/jump, cancellation and quick-tap buffering. Jump sizes 94, 100 and 112 CSS pixels in tested portrait layouts. No physical multitouch hardware session was available. |
| Layout | Exact CSS viewport dimensions measured below. No document overflow, logo/tool collision or progress/jump overlap. Tasks expand above controls. Safe-area CSS and landscape layout retained; portrait rotate hint present. |
| Performance | Touch/weak devices start Smooth; shadows off and reduced DPR. Four-second monitor drops quality/DPR below 32 FPS. Detection/sampling unit-tested. Scene memoization prevents HUD-driven scene reconciliations; merged coin geometry, pooled particles, instanced portal sparks and reduced background detail reduce work. Host preview observed roughly 67–119 FPS at sampled scenes; these are desktop results, not phone measurements. |
| Feel | Coyote time, jump buffering and variable jump height tests pass. Instant checkpoint/respawn with short fade and bounded effects tested. |
| Audio/haptics | Gesture-only audio creation and synthesized music; mute persistence checked after reload. Tests prove pause/mute stops music scheduling. Vibration patterns guarded and optional; device-dependent and not physically verified. |

## Responsive checks

| CSS viewport | Document size | Jump target | Result |
|---|---|---|---|
| 375 x 812 | 375 x 812 | 94 x 94 | Pass |
| 390 x 844 | 390 x 844 | 100 x 100 | Pass |
| 768 x 1024 | 768 x 1024 | 112 x 112 | Pass |
| 1920 x 1080 | 1920 x 1080 | Keyboard controls | Pass |

Raw bounding boxes are in polish-layout-metrics.json. Screenshots accompany this report. Browser console showed no warnings or errors during final preview checks. Smooth quality was selected and confirmed by DOM state and canvas resolution. Map pauses and resumes the current run.

## Limits

Physical iPhone/Android testing is still needed to confirm actual phone FPS, vibration, browser chrome/notch behavior and two-thumb comfort. Adaptive rendering aims for 60 FPS and reduces load below 32 FPS; it cannot guarantee a minimum on every device. Browser viewports do not emulate phone GPU speed. The build reports a non-fatal large-bundle advisory for Three.js; total main JavaScript gzip is approximately 324 KB, plus the lazy scene chunk. Sound output was not independently listened to on phone hardware.

Publication: version 5 deployed successfully. Published-page smoke check restored the existing World 2 run, displayed the floating joystick and Jump control, selected Smooth graphics and paused successfully. No console warnings or errors were captured.
