// Inference runs in a classic worker so MediaPipe can load its WASM loader.
let detector;
self.onmessage = async ({ data }) => {
  if (data.type === 'init') {
    try {
      const base = data.base || '/';
      const { FilesetResolver, HandLandmarker } = await import(`${base}vision/vision_bundle.mjs`);
      const files = await FilesetResolver.forVisionTasks(`${base}vision`);
      detector = await HandLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: `${base}vision/hand_landmarker.task`, delegate: 'CPU' },
        runningMode: 'VIDEO', numHands: 2,
        minHandDetectionConfidence: 0.6, minHandPresenceConfidence: 0.6, minTrackingConfidence: 0.6,
      });
      self.postMessage({ type: 'ready' });
    } catch (error) { self.postMessage({ type: 'error', message: String(error) }); }
  } else if (data.type === 'frame' && detector) {
    try {
      const result = detector.detectForVideo(data.bitmap, data.timestamp);
      self.postMessage({ type: 'hands', landmarks: result.landmarks });
    } catch (error) { self.postMessage({ type: 'error', message: String(error) }); }
    finally { data.bitmap.close(); }
  }
};
