import { useRef, useEffect } from "react";
import { MatLifecycleService } from "@/services/MatLifecycleService";

export function useMatLifecycle() {
  const serviceRef = useRef(new MatLifecycleService());

  useEffect(() => {
    return () => serviceRef.current.disposeAll();
  }, []);

  return serviceRef.current;
}
