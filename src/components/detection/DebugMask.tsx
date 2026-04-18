import { forwardRef } from "react";

export const DebugMask = forwardRef<HTMLCanvasElement>(
  function DebugMask(_props, ref) {
    return (
      <canvas
        ref={ref}
        className="w-full rounded-[10px] border-2 border-[#333] bg-black"
      />
    );
  },
);
