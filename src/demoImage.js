/**
 * Generates a self-contained color + depth-map pair on a <canvas>, so the
 * demo works out of the box with no bundled photos. Swap this out for your
 * own `{ map, depthMap }` image pair (see README) to see the effect with
 * real photography.
 *
 * The viewer ends up looking at a tiny, tightly-zoomed crop of this image
 * (the plane is scaled way up to fill the tracked face's view, and only
 * reveals more of it as the viewer's head moves), so the pattern uses a
 * high-frequency tiled checkerboard in saturated colors rather than a
 * single gradient — a static screenshot, or a small head movement, should
 * still land on visible contrast instead of one flat color.
 */
export function generateDemoImagePair() {
  const size = 1024;
  const tiles = 48;
  const tileSize = size / tiles;
  const palette = ["#ffb454", "#7bdfe6", "#ff6ec7", "#9bff7a"];

  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = size;
  colorCanvas.height = size;
  const colorCtx = colorCanvas.getContext("2d");

  const depthCanvas = document.createElement("canvas");
  depthCanvas.width = size;
  depthCanvas.height = size;
  const depthCtx = depthCanvas.getContext("2d");

  for (let row = 0; row < tiles; row++) {
    for (let col = 0; col < tiles; col++) {
      const x = col * tileSize;
      const y = row * tileSize;

      colorCtx.fillStyle = palette[(row + col) % palette.length];
      colorCtx.fillRect(x, y, tileSize, tileSize);

      const shade = (row * 7 + col * 13) % 100;
      depthCtx.fillStyle = `rgb(${shade * 2.5}, ${shade * 2.5}, ${shade * 2.5})`;
      depthCtx.fillRect(x, y, tileSize, tileSize);
    }
  }

  return {
    map: colorCanvas.toDataURL("image/png"),
    depthMap: depthCanvas.toDataURL("image/png"),
    depth: 0.4,
  };
}
