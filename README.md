# pARelax

## A framework for WebXR parallax

<a href="https://veergoggles.github.io/lenticulAR/demos/"><img align="right" width="120" alt="QR code for the live demos" src="preview-qr-code.png"></a>

**▶ Live demo: [pARelax and lenticulAR, side by side](https://veergoggles.github.io/lenticulAR/demos/)**
— or [pARelax full screen](https://veergoggles.github.io/pARelax/).
Runs in the browser: allow the camera and move your head. Scan the code to
open it on a phone.

pARelax turns flat photographs into volumetric "windows" — the viewer's face
position drives a depth-displaced Three.js scene, so the image shifts in
parallax as they move, as if the screen were a pane of glass looking into the
scene rather than a surface a picture is printed on.

---

## How it works

There are three stages to producing a pARelax experience:

### 1 — Depth estimation with MiDaS

Each photograph needs a companion **depth map** — a grayscale image where
white means near and black means far. These are generated offline using
[MiDaS](https://github.com/isl-org/MiDaS), a monocular depth-estimation model
from Intel ISL, run via PyTorch:

```bash
# example using the MiDaS repo directly
python run.py \
  --model_type dpt_beit_large_512 \
  --input_path photos/ \
  --output_path depth_maps/
```

The output is a 16-bit or 8-bit grayscale PNG. Export or convert it to 8-bit
JPG/PNG and pair it with the original photo. Any monocular depth tool works
(Depth Anything, Photoshop Depth Blur, etc.) as long as the output convention
is white = near, black = far.

### 2 — Face tracking with MindAR

At runtime, [MindAR](https://github.com/hiukim/mind-ar-js) handles camera
permission and face tracking entirely in the browser — no native plugin, no
app install. It exposes a 4×4 face matrix every frame that encodes the
viewer's head position and orientation relative to the camera.

pARelax reads that matrix and maps the face's XY translation onto the render
camera's position, smoothed with an inertia factor so small jitter disappears
while deliberate head movement drives clear parallax.

### 3 — Depth-displaced rendering with Three.js (via R3F)

The photo is rendered on a subdivided `PlaneGeometry` (180×90 segments) whose
vertices are displaced along Z using the depth map as a `displacementMap` on a
`MeshPhongMaterial`. Moving the camera over a displaced plane produces genuine
3-D parallax — closer regions shift more than distant ones.

[React Three Fiber](https://github.com/pmndrs/react-three-fiber) (R3F) wires
the Three.js scene into the React component tree and owns the render loop,
with the MindAR camera feed composited underneath.

```
┌──────────────────────────────┐
│  Browser (HTTPS required)    │
│  ┌────────────────────────┐  │
│  │  React / R3F           │  │
│  │  ┌──────────────────┐  │  │
│  │  │  Three.js scene  │  │  │
│  │  │  PlaneGeometry   │  │  │
│  │  │  displacementMap │  │  │  ← depth map drives vertex Z
│  │  └──────────────────┘  │  │
│  └───────────▲────────────┘  │
│              │ face matrix   │
│  ┌───────────┴────────────┐  │
│  │  MindAR face tracker   │  │  ← live camera feed
│  └────────────────────────┘  │
└──────────────────────────────┘
```

---

## Usage

The engine is in `src/ParallaxEngine.js`. Give it a container element and one
or more `{ map, depthMap, alphaMap?, depth? }` image descriptors:

```js
new ParallaxEngine({
  container: containerRef.current,
  images: [
    { map: "/photo.jpg", depthMap: "/photo-depth.jpg", depth: 0.5 },
    { map: "/photo2.jpg", depthMap: "/photo2-depth.jpg" },
  ],
  rotateIntervalMs: 10000, // cross-fade interval (default 10 s)
});
```

`depth` controls the maximum vertex displacement (default `0.5`). Stronger
values read better from farther away; dial back if foreground subjects look
extruded.

The demo (`src/App.jsx`) generates a synthetic color/depth pair at runtime via
`src/demoImage.js` — no bundled assets required. Swap it for a real photo +
depth map pair to see it with actual photography.

---

## Getting started

```
npm install
npm start      # HTTPS is required for camera access
npm test       # the camera follows the tracked head
npm run build
```

`.github/workflows/pages.yml` tests and builds every push and pull request
and publishes `main` to GitHub Pages at <https://veergoggles.github.io/pARelax/>
(with *Settings → Pages → Source* set to *GitHub Actions*).

---

## See also

[lenticulAR](https://github.com/VeerGoggles/lenticulAR) builds on the same
technique: three depth-mapped scenes behind the screen, with a row of rotating
prisms flipping between them as the viewer moves — a lenticular print, faked.
Both run side by side on the [live demo page](https://veergoggles.github.io/lenticulAR/demos/).
