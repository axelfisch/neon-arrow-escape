# Third-party notices

## Arrow Escape — Umang

Copyright (c) 2026 Umang. MIT License.

Source: https://github.com/crudeGithub/Arrow-Escape-Game-Source-Code
Source tree SHA: 1358ad91c7f93c5d18e58a1602f09d156f92cff6

Adaptations in this project:
- `src/game/complex-shapes.generated.json`: all 21 DemoLevels_SO level geometries, converted from Unity XY (upward Y) to board column/row (downward row). Colors and campaign order are changed.
- `src/game/escape.ts`: TypeScript implementation adapted from the head-first, tail-following movement in `ArrowUnit.cs`.
- Touch navigation and long-press behavior take inspiration from `CameraController.cs` and `ArrowUnit.cs`, with a new Pointer Events implementation.

The original MIT notice is reproduced without changes in `public/licenses/arrow-escape-MIT.txt`, included in the built app and linked from its footer. This notice does not relicense the rest of Neon Arrow. No Unity runtime, advertising SDK, bundled third-party assets, or third-party packages from the upstream project are imported.



## iOS runtime and bundled fonts

Capacitor 8.5.3 (Ionic team) is distributed under MIT; full notice: public/licenses/capacitor-MIT.txt. The iOS build uses the official Capacitor and Cordova XCFrameworks from capacitor-swift-pm release 8.5.3. The preparation script pins and verifies their published SHA-256 checksums.

IBM Plex Mono, IBM Plex Sans, and Syne are bundled locally from the Google Fonts distribution under SIL Open Font License 1.1. Their original notices are in public/licenses/ibmplexmono-OFL.txt, ibmplexsans-OFL.txt and syne-OFL.txt. These notices ship in the app and are linked from Settings. Font files are unmodified Latin subset distributions.

The iOS layout uses the Claude Design handoff supplied by Axel on 2026-10-30 as a visual reference. Its demonstration engine and design runtime (support.js) are not imported; the application keeps the tested Neon Arrow engine.
