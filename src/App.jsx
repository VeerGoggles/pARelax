import { useEffect, useRef, useState } from "react";
import ParallaxEngine from "./ParallaxEngine";
import { generateDemoImagePair } from "./demoImage";

function App() {
  const container = useRef(null);
  const engineRef = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    engineRef.current = new ParallaxEngine({
      container: container.current,
      images: [generateDemoImagePair()],
    });

    return () => {
      engineRef.current?.stop();
    };
  }, []);

  const start = async () => {
    setStarted(true);
    await engineRef.current.start();
  };

  return (
    <>
      <div
        id="container"
        ref={container}
        style={{ position: "fixed", inset: 0 }}
      />
      {!started && (
        <div id="landing">
          <h1>pARallax</h1>
          <p>
            A vision-based methodology for WebXR parallax: this tracks your
            face position relative to the screen and offsets a depth-mapped
            image accordingly, so it behaves like a window into the scene
            instead of a flat picture.
          </p>
          <button onClick={start}>Allow camera &amp; start</button>
        </div>
      )}
    </>
  );
}

export default App;
