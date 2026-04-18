import { useState, useEffect } from "react";
import { OpenCVService } from "@/services/OpenCVService";

export function useOpenCV() {
  const [ready, setReady] = useState(OpenCVService.ready);
  const [error, setError] = useState<string | null>(OpenCVService.error);

  useEffect(() => {
    if (ready) return;
    const unsub = OpenCVService.onReady(() => setReady(true));
    OpenCVService.load().catch((e) => setError(e.message));
    return unsub;
  }, [ready]);

  return { ready, error, cv: OpenCVService.cv };
}
