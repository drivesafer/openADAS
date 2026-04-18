const DEFAULT_CONSTRAINTS: MediaStreamConstraints = {
  video: { width: 640, height: 480, facingMode: "environment" },
  audio: false,
};

class CameraServiceImpl {
  private _stream: MediaStream | null = null;

  get currentStream() {
    return this._stream;
  }

  async requestStream(
    constraints?: MediaStreamConstraints,
  ): Promise<MediaStream> {
    this.stopStream();
    this._stream = await navigator.mediaDevices.getUserMedia(
      constraints ?? DEFAULT_CONSTRAINTS,
    );
    return this._stream;
  }

  async listDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === "videoinput");
  }

  stopStream(): void {
    if (this._stream) {
      this._stream.getTracks().forEach((t) => t.stop());
      this._stream = null;
    }
  }

  async bindToVideo(video: HTMLVideoElement, deviceId?: string) {
    const constraints: MediaStreamConstraints = {
      video: {
        width: 640,
        height: 480,
        facingMode: "environment",
        ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
      },
      audio: false,
    };

    const stream = await this.requestStream(constraints);
    video.srcObject = stream;
    await video.play();
    await this.waitVideoReady(video);
    return stream;
  }

  syncVideoAttributes(video: HTMLVideoElement) {
    const vw = video.videoWidth || 0;
    const vh = video.videoHeight || 0;
    if (!vw || !vh) return false;
    if (video.width !== vw) video.width = vw;
    if (video.height !== vh) video.height = vh;
    return true;
  }

  private waitVideoReady(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve) => {
      if (video.videoWidth && video.videoHeight) {
        resolve();
        return;
      }
      const onMeta = () => {
        video.removeEventListener("loadedmetadata", onMeta);
        resolve();
      };
      video.addEventListener("loadedmetadata", onMeta);
    });
  }
}

export const CameraService = new CameraServiceImpl();
