import { forwardRef } from "react";

interface Props {
  showVideo?: boolean;
  className?: string;
}

export const VideoCanvas = forwardRef<
  { video: HTMLVideoElement; canvas: HTMLCanvasElement },
  Props
>(function VideoCanvas({ showVideo = true, className = "" }, _ref) {
  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <canvas
        id="detection-canvas"
        className="absolute inset-0 h-full w-full bg-transparent"
        style={{ display: showVideo ? "none" : "block" }}
      />
      <video
        id="detection-video"
        playsInline
        muted
        className="absolute inset-0 h-full w-full bg-black object-cover"
        style={{ display: showVideo ? "block" : "none" }}
      />
    </div>
  );
});
