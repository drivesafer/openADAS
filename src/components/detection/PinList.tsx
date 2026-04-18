import { PinCard } from "./PinCard";

export interface PinData {
  id: string;
  imageUrl: string;
  pinnedAt: number;
}

interface Props {
  pins: PinData[];
}

export function PinList({ pins }: Props) {
  return (
    <div className="absolute left-2.5 top-2.5 z-5 flex max-w-[min(42vw,420px)] flex-col gap-2.5">
      {pins.map((p) => (
        <PinCard key={p.id} imageUrl={p.imageUrl} pinnedAt={p.pinnedAt} />
      ))}
    </div>
  );
}
