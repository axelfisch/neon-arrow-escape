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

