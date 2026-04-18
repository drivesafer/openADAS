interface Props {
  devices: MediaDeviceInfo[];
  value?: string;
  onChange: (deviceId: string) => void;
}

export function CameraSelect({ devices, value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-white/14 bg-[#0f0f0f] p-2.5 text-sm text-white"
    >
      {devices.map((d, i) => (
        <option key={d.deviceId} value={d.deviceId}>
          {d.label || `Camera ${i + 1}`}
        </option>
      ))}
    </select>
  );
}
