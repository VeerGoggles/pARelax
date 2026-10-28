/**
 * @jest-environment node
 */
import * as THREE from "three";
import ParallaxEngine from "./ParallaxEngine";

// Stand-in for MindARThree (jest hoists this above the imports): the renderer/scene/camera ParallaxEngine uses,
// plus the controller slot it reads the face estimate from.
jest.mock("mind-ar/dist/mindar-face-three.prod.js", () => {
  const THREE = jest.requireActual("three");
  return {
    MindARThree: class {
      constructor() {
        this.renderer = { render: () => {} };
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(41, 4 / 3, 1, 10000);
        this.controller = { lastEstimateResult: null };
      }
      addFaceMesh() {
        return new THREE.Object3D();
      }
      async start() {}
      stop() {}
    },
  };
});

// A face estimate laid out exactly as MindAR's estimator returns it (row-major,
// OpenCV axes flipped to three.js): tx cm to the viewer's right, ty cm below
// the camera (OpenCV y points down), tz cm away.
const faceMatrix = (tx, ty, tz) => [1, 0, 0, tx, 0, -1, 0, -ty, 0, 0, -1, -tz, 0, 0, 0, 1];

function settle(engine, frames = 400) {
  for (let i = 0; i < frames; i++) engine.animate();
  return engine.mindarThree.camera.position;
}

beforeAll(() => {
  global.requestAnimationFrame = () => 0;
});

test("the camera follows the tracked head", () => {
  const engine = new ParallaxEngine({ container: {}, images: [] });

  engine.mindarThree.controller.lastEstimateResult = { faceMatrix: faceMatrix(6, -3, 48) };
  const p = settle(engine);
  expect(p.x).toBeCloseTo(6, 3);
  expect(p.y).toBeCloseTo(3 + engine.CAMERA_OFFSET.y, 3);
  expect(p.z).toBeCloseTo(48, 3);

  engine.mindarThree.controller.lastEstimateResult = { faceMatrix: faceMatrix(-10, 0, 55) };
  const q = settle(engine);
  expect(q.x).toBeCloseTo(-10, 3);
  expect(q.z).toBeCloseTo(55, 3);
});

test("before a face is found the camera sits at a typical viewing distance", () => {
  const engine = new ParallaxEngine({ container: {}, images: [] });
  const p = settle(engine);
  expect(p.x).toBeCloseTo(0, 3);
  expect(p.z).toBeCloseTo(50, 3);
});

test("reading the row-major matrix column-major would lose the translation", () => {
  const position = new THREE.Vector3().setFromMatrixPosition(
    new THREE.Matrix4().fromArray(faceMatrix(6, -3, 48))
  );
  expect(position.toArray()).toEqual([0, 0, 0]);
});
