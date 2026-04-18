import { useEffect, useRef } from "react";
import type { MiniAppContext, MiniAppLifecycle } from "./types";

interface Props {
  lifecycle: MiniAppLifecycle;
  context: MiniAppContext;
}

export function MiniAppAdapter({ lifecycle, context }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mountedRef.current) return;

    mountedRef.current = true;
    const result = lifecycle.mount(el, context);

    const cleanup = () => {
      lifecycle.unmount();
      mountedRef.current = false;
    };

    if (result instanceof Promise) {
      result.catch((err) => console.error("[MiniAppAdapter] mount error:", err));
    }

    return cleanup;
  }, [lifecycle, context]);

  return <div ref={containerRef} className="h-full w-full" />;
}
