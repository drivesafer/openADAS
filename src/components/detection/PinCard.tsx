import { useEffect, useState } from "react";

interface Props {
  imageUrl: string;
  pinnedAt: number;
}

function relTime(msAgo: number): string {
  const s = Math.max(0, Math.floor(msAgo / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}m${ss}s ago`;
}

export function PinCard({ imageUrl, pinnedAt }: Props) {
  const [timeLabel, setTimeLabel] = useState("0s ago");

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLabel(relTime(performance.now() - pinnedAt));
    }, 500);
    return () => clearInterval(id);
  }, [pinnedAt]);

  return (
    <div className="flex items-center gap-2.5 rounded-[14px] border border-white/10 bg-[#0f0f0f]/86 p-2 shadow-lg backdrop-blur-md">
      <img
        src={imageUrl}
        alt="Detected sign"
        className="h-24 w-[170px] rounded-[10px] border border-white/12 bg-black object-cover"
      />
      <div className="flex min-w-[90px] flex-col items-start gap-1.5">
        <div className="flex items-center gap-2 text-[13px] text-gray-300">
          <span className="text-base text-green">📌</span>
          <span className="text-gray-400">{timeLabel}</span>
        </div>
      </div>
    </div>
  );
}
