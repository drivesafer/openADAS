import type { ReactNode } from "react";

export function AppGrid({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3.5 md:grid-cols-2">
      {children}
    </div>
  );
}
