# Reality Composer

A browser-based particle studio: sculpt a galaxy, explore a wave field, or turn your initials into light. Built around a real WebGL canvas, with optional webcam gestures processed locally in a dedicated worker.

## First release

- Six deterministic scenes: spiral galaxy, Saturn, stellar core, double helix, wave field and custom text.
- GPU-interpolated transitions, additive particle glow and a supernova burst.
- Drag to orbit, scroll to zoom, colour palettes, expansion and luminosity controls.
- Hand tracking: palm movement, pinch attraction, fist collapse, open-palm burst and two-hand expansion.
- Fullscreen presentation, timed showcase, PNG export and device-local creation presets.
- 24,000 WebGL particles on capable desktop browsers, with a Canvas fallback for restricted browser environments. FPS is measured live; it is not a promised frame rate.

## Run

Requires Node.js 22.13+ and npm. Node.js 24 is recommended for native TypeScript configuration loading.

```sh
npm install
npm run dev
npm test
npm run build
```

The static production site is in `dist/client`. Serve it over HTTPS (or localhost for development) for camera access. The complete hand model and WASM files are served from `public/vision`; no inference API or API key is required.

## Controls

| Input | Action |
| --- | --- |
| Drag / touch-drag | Orbit |
| Scroll | Zoom |
| Space | Pause / resume |
| 1–6 | Select scene |
| E | Supernova |
| H | Hide / show controls |
| Escape | Leave presentation |
| Pinch | Attract particles |
| Fist → open palm | Collapse → burst |
| Two hands apart | Expand |

## Architecture

```mermaid
flowchart LR
  UI[React controls] --> State[Scene parameters]
  State --> Geometry[Seeded geometry generators]
  Geometry --> GPU[WebGL point renderer]
  Mouse[Mouse and touch] --> GPU
  Camera[Opt-in camera] --> Bitmap[One frame in flight]
  Bitmap --> Worker[MediaPipe worker / WASM]
  Worker --> Gestures[Normalized hand gestures]
  Gestures --> GPU
  GPU --> Canvas[Interactive canvas / PNG export]
```

The geometry buffers upload on scene changes; animation updates uniforms instead of uploading every point each frame. Morphs begin from the currently interpolated positions, including when interrupted. Hand inference is throttled and runs outside the rendering thread, with only one frame in flight. Camera tracks and workers are released when hand control stops or the component unmounts.

## Scope and verification

These are artistic mathematical scenes and visual force fields, not astrophysics, molecular dynamics or physically accurate N-body simulations. Webcam tracking depends on lighting, visibility and the device. Galaxy, Saturn, custom text, scene switching and the supernova control were checked in the restricted in-app browser; a real-camera gesture session is still pending. Automated checks cover geometry and gesture interpretation; production compilation and static-page generation are also checked.

The optional `compose_particle_scene` WebMCP tool is feature-detected. Its registration and execution require a compatible host; that host integration has not been verified here.

## Credits

Interface: React, Vinext/Vite, Tailwind CSS, Base UI/Shadcn, Lucide. Hand landmarks: [Google MediaPipe](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js), `@mediapipe/tasks-vision` 0.10.21 and the official float16 hand-landmarker model. See `THIRD_PARTY_NOTICES.md`.

## Next milestones

Real-device gesture calibration, measured performance profiles, touch pinch-to-zoom, music-reactive mode, and a short recorded demo. Public GitHub publication is a separate step.
