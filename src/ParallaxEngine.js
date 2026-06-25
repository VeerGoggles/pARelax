import * as THREE from "three";
import { MindARThree } from "mind-ar/dist/mindar-face-three.prod.js";

/**
 * Drives a depth-mapped "virtual window" scene from live face tracking.
 *
 * Pass one or more { map, depthMap, alphaMap?, depth? } image descriptors;
 * the engine cross-fades between them on a timer and offsets the render
 * camera using the tracked face position, so the picture appears to have
 * real depth as the viewer's head moves relative to the screen.
 */
class ParallaxEngine {
  constructor({ container, images = [], rotateIntervalMs = 10000, onStart }) {
    this.mindarThree = new MindARThree({
      container,
      uiError: "no",
      uiLoading: "no",
      uiScanning: "no",
      maxTrack: 4,
      numFaces: 2,
      showVideo: false,
    });

    this.renderer = this.mindarThree.renderer;
    this.scene = this.mindarThree.scene;
    this.camera = this.mindarThree.camera;
    this.images = images;
    this.rotateIntervalMs = rotateIntervalMs;
    this.onStart = onStart;
    this.targetIndex = 0;
    this.started = false;

    this.init();
  }

  init() {
    this.faceMesh = this.mindarThree.addFaceMesh();

    const light = new THREE.HemisphereLight(0x000000, 0xffffff, 0.5);
    this.scene.add(light);

    this.faceMatrix = new THREE.Matrix4();
    this.targetCameraPos = new THREE.Vector3();

    this.CAMERA_OFFSET = new THREE.Vector3(0, 0.4, 0);
    this.CAMERA_SCALAR = new THREE.Vector3(1, 1, 1);
    this.INERTIA_SMOOTHING = 0.95;
  }

  animate() {
    const faceMatrix = this.mindarThree.controller?.lastEstimateResult?.faceMatrix;
    if (faceMatrix?.length >= 16) {
      this.faceMatrix.fromArray(faceMatrix);
    }

    // map the tracked face position onto the render camera, smoothed with inertia
    this.targetCameraPos.setFromMatrixPosition(this.faceMatrix);
    this.targetCameraPos.multiplyVectors(this.targetCameraPos, this.CAMERA_SCALAR);
    this.targetCameraPos.add(this.CAMERA_OFFSET);

    if (this.mindarThree.camera) {
      this.mindarThree.camera.position.set(
        this.mindarThree.camera.position.x * this.INERTIA_SMOOTHING +
          (1 - this.INERTIA_SMOOTHING) * this.targetCameraPos.x,
        this.mindarThree.camera.position.y * this.INERTIA_SMOOTHING +
          (1 - this.INERTIA_SMOOTHING) * this.targetCameraPos.y,
        this.mindarThree.camera.position.z * this.INERTIA_SMOOTHING -
          (1 - this.INERTIA_SMOOTHING) * this.targetCameraPos.z
      );
    }

    this.images.forEach((image, imageIndex) => {
      if (image.photo) image.photo.visible = imageIndex === this.targetIndex;
    });

    this.animationFrame = requestAnimationFrame(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);
  }

  stop() {
    cancelAnimationFrame(this.animationFrame);
    clearInterval(this.rotateInterval);
    this.mindarThree.stop();
  }

  loadScene = async () => {
    this.images.forEach((image, imageIndex) => {
      image.photo = this.loadPhoto(imageIndex);
    });

    if (this.images.length > 1) {
      this.rotateInterval = setInterval(() => {
        this.targetIndex = (this.targetIndex + 1) % this.images.length;
      }, this.rotateIntervalMs);
    }
  };

  loadPhoto = (imageIndex) => {
    const checkStart = () => {
      if (mapLoaded && depthMapLoaded && alphaMapLoaded && !this.started) {
        this.start();
      }
    };

    const currImage = this.images[imageIndex];
    const pictureHolder = new THREE.Object3D();
    pictureHolder.rotation.x = 0.1;
    const pictureDepth = isNaN(currImage?.depth) ? 0.5 : currImage.depth;
    // the mesh is scaled up by FACE_SCALE after creation, which would also
    // amplify the vertex displacement (computed in local space) by the same
    // factor and push it out of the camera frustum entirely if left as-is
    const FACE_SCALE = 40;
    let pictureMesh,
      mapLoaded = false,
      alphaMapLoaded = false,
      depthMapLoaded = false;

    const pictureMap = new THREE.TextureLoader().load(currImage.map, (texture) => {
      pictureMesh = new THREE.Mesh(
        texture.image?.naturalWidth >= texture?.image?.naturalHeight
          ? new THREE.PlaneGeometry(
              texture.image.naturalWidth / texture.image.naturalHeight,
              1,
              180,
              90
            )
          : new THREE.PlaneGeometry(
              1,
              texture.image.naturalHeight / texture.image.naturalWidth,
              180,
              90
            ),
        new THREE.MeshPhongMaterial({
          map: texture,
          alphaMap: pictureAlphaMap || null,
          displacementMap: pictureDepthMap,
          displacementScale: pictureDepth / FACE_SCALE,
          transparent: true,
        })
      );
      pictureMesh.position.set(0, -5, -2);
      pictureHolder.add(pictureMesh);
      this.scene.add(pictureHolder);

      pictureMesh.scale.set(FACE_SCALE, FACE_SCALE, FACE_SCALE);

      this.images[imageIndex].photo = pictureMesh;
      mapLoaded = true;
      checkStart();
    });
    pictureMap.colorSpace = THREE.SRGBColorSpace;

    const pictureDepthMap = new THREE.TextureLoader().load(currImage.depthMap, () => {
      depthMapLoaded = true;
      checkStart();
    });

    let pictureAlphaMap;
    if (currImage.alphaMap) {
      pictureAlphaMap = new THREE.TextureLoader().load(currImage.alphaMap, () => {
        alphaMapLoaded = true;
        checkStart();
      });
    } else {
      alphaMapLoaded = true;
      checkStart();
    }

    return pictureHolder;
  };

  async start() {
    if (this.started) return;
    this.started = true;

    await this.mindarThree.start();
    this.onStart?.();
    this.loadScene();
    this.animate();
  }
}

export default ParallaxEngine;
