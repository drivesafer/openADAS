import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-text dark:bg-surface-dark dark:text-text-dark">
      {children}
    </div>
  );
}
