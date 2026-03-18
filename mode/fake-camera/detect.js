// fake-camera/detect.js
// Reusable source controller for:
// 1) live camera
// 2) debug file source
//
// Any mode can import this module to reuse the same debug-video flow.

export function resolveDebugVideoSrc(relativePath = '../../input/test1.mp4') {
  return new URL(relativePath, document.baseURI).href;
}

export function createVideoSourceController({
  video,
  sourceSelect,
  cameraSelect,
  statusEl = null,
  defaultDebugVideoSrc = '../../input/test1.mp4',
  cameraConstraints = {
    width: 640,
    height: 480,
    facingMode: 'environment'
  }
}) {
  let stream = null;
  let activeDebugVideoSrc = resolveDebugVideoSrc(defaultDebugVideoSrc);

  function setStatus(message) {
    if (statusEl) statusEl.textContent = message;
  }

  function waitVideoReady() {
    return new Promise(res => {
      if (video.videoWidth && video.videoHeight) return res();

      const onReady = () => {
        video.removeEventListener('loadedmetadata', onReady);
        video.removeEventListener('loadeddata', onReady);
        video.removeEventListener('canplay', onReady);
        res();
      };

      video.addEventListener('loadedmetadata', onReady);
      video.addEventListener('loadeddata', onReady);
      video.addEventListener('canplay', onReady);
    });
  }

  async function stopCurrentSource() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }

    video.pause();
    video.loop = false;

    try { video.srcObject = null; } catch (_) {}
    try { video.removeAttribute('src'); } catch (_) {}
    try { video.load(); } catch (_) {}
  }

  async function listCameras() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter(d => d.kind === 'videoinput');
    const previous = cameraSelect?.value || '';

    if (cameraSelect) {
      cameraSelect.innerHTML = '';

      cams.forEach((c, idx) => {
        const opt = document.createElement('option');
        opt.value = c.deviceId;
        opt.textContent = c.label || `Camera ${idx + 1}`;
        cameraSelect.appendChild(opt);
      });

      if (previous && [...cameraSelect.options].some(o => o.value === previous)) {
        cameraSelect.value = previous;
      }
    }

    return cams;
  }

  async function startCameraSource(deviceId = null) {
    await stopCurrentSource();

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        ...cameraConstraints,
        deviceId: deviceId ? { exact: deviceId } : undefined
      },
      audio: false
    });

    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;

    await video.play();
    await waitVideoReady();

    return {
      type: 'camera',
      width: video.videoWidth,
      height: video.videoHeight
    };
  }

  async function startDebugFileSource(src = activeDebugVideoSrc) {
    await stopCurrentSource();

    activeDebugVideoSrc = resolveDebugVideoSrc(src);
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.src = activeDebugVideoSrc;
    video.load();

    await video.play();
    await waitVideoReady();

    return {
      type: 'file',
      src: activeDebugVideoSrc,
      width: video.videoWidth,
      height: video.videoHeight
    };
  }

  async function applySelectedSource() {
    if (sourceSelect?.value === 'file') {
      if (cameraSelect) cameraSelect.disabled = true;
      setStatus(`Loading debug video: ${activeDebugVideoSrc}`);
      return startDebugFileSource(activeDebugVideoSrc);
    }

    if (cameraSelect) cameraSelect.disabled = false;
    setStatus('Requesting camera permission...');
    const info = await startCameraSource(cameraSelect?.value || null);
    await listCameras();
    return info;
  }

  async function init() {
    if (sourceSelect) {
      sourceSelect.onchange = async () => {
        api.onBeforeSourceChange?.();
        try {
          await applySelectedSource();
          api.onAfterSourceChange?.();
        } catch (e) {
          api.onSourceError?.(e);
        }
      };
    }

    if (cameraSelect) {
      cameraSelect.onchange = async () => {
        if (sourceSelect?.value === 'file') return;
        api.onBeforeSourceChange?.();
        try {
          setStatus('Switching camera...');
          await startCameraSource(cameraSelect.value || null);
          api.onAfterSourceChange?.();
        } catch (e) {
          api.onSourceError?.(e);
        }
      };
    }

    return applySelectedSource();
  }

  const api = {
    onBeforeSourceChange: null,
    onAfterSourceChange: null,
    onSourceError: null,
    init,
    listCameras,
    applySelectedSource,
    startCameraSource,
    startDebugFileSource,
    stopCurrentSource,
    getDebugVideoSrc() {
      return activeDebugVideoSrc;
    },
    setDebugVideoSrc(relativePathOrUrl) {
      activeDebugVideoSrc = resolveDebugVideoSrc(relativePathOrUrl);
      return activeDebugVideoSrc;
    }
  };

  return api;
}
