import { useMemo } from "react";
import { MiniAppAdapter } from "@/sdk/MiniAppAdapter";
import { buildMiniAppContext } from "@/sdk/context";
import type { MiniAppLifecycle } from "@/sdk/types";

interface Props {
  lifecycle: MiniAppLifecycle;
}

export function MiniAppHost({ lifecycle }: Props) {
  const context = useMemo(
    () => buildMiniAppContext(lifecycle.manifest.id),
    [lifecycle.manifest.id],
  );

  return (
    <div className="h-screen w-screen overflow-hidden bg-driving-bg">
      <MiniAppAdapter lifecycle={lifecycle} context={context} />
    </div>
  );
}
