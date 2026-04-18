import { useRef, useCallback } from "react";
import { DetectionLoopService } from "@/services/DetectionLoopService";

export function useDetectionLoop() {
  const loopRef = useRef<DetectionLoopService | null>(null);

  const start = useCallback((callback: (ts: number) => void, frameSkip = 0) => {
    if (!loopRef.current) loopRef.current = new DetectionLoopService();
    loopRef.current.start(callback, frameSkip);
  }, []);

  const stop = useCallback(() => {
    loopRef.current?.stop();
  }, []);

  return { start, stop };
}
