import type { ReactNode } from "react";

interface Props {
  visible: boolean;
  children: ReactNode;
}

export function SettingsPanel({ visible, children }: Props) {
  return (
    <div
      className={`absolute right-0 top-0 z-9 flex h-full w-[min(360px,86vw)] flex-col gap-3 border-l border-white/10 bg-[#111]/96 p-3.5 pb-4.5 transition-transform duration-200 ease-out ${
        visible ? "translate-x-0" : "translate-x-[102%]"
      }`}
    >
      {children}
    </div>
  );
}
