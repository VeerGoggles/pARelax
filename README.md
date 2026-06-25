# pARallax

## A vision-based methodology for WebXR parallax

This experiment tracks the viewer's face position relative to the screen,
using [MindAR](https://github.com/hiukim/mind-ar-js)'s face tracking, and
offsets a depth-mapped image accordingly — so a flat photograph behaves like
a window into the scene instead of a static picture.

The engine (`src/ParallaxEngine.js`) is plain Three.js: give it one or more
`{ map, depthMap, alphaMap?, depth? }` image descriptors and a container
element, and it handles camera permission, face tracking, depth-displaced
plane geometry, and cross-fading between images on a timer. The demo in
`src/App.jsx` generates a synthetic color/depth pair on a `<canvas>` at
runtime (`src/demoImage.js`) so it runs with zero bundled assets — swap that
out for your own photo + depth map pair to see it with real photography:

```js
new ParallaxEngine({
  container: containerRef.current,
  images: [
    { map: "/my-photo.jpg", depthMap: "/my-photo-depth.jpg", depth: 0.5 },
  ],
});
```

Depth maps can come from any monocular depth-estimation tool (Depth Anything,
MiDaS, Photoshop's Depth Blur, etc.) — export them grayscale, white = near,
black = far.

## Getting started

Install dependencies:

```
npm install
```

Run a local dev server (HTTPS is required for camera access):

```
npm start
```

Build for production:

```
npm run build
```
