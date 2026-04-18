import type { ReactNode } from "react";

export function SafeArea({ children }: { children: ReactNode }) {
  return (
    <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {children}
    </div>
  );
}
