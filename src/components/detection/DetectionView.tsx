interface Props {
  showVideo: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function DetectionView({ showVideo, videoRef, canvasRef }: Props) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full bg-transparent"
        style={{ display: showVideo ? "none" : "block" }}
      />
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 h-full w-full bg-black object-cover"
        style={{ display: showVideo ? "block" : "none" }}
      />
    </div>
  );
}
