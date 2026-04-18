import { useTranslation } from "react-i18next";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function ModeSelector({ value, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-white/14 bg-[#0f0f0f] p-2.5 text-sm text-white"
    >
      <option value="day">{t("day_mode")}</option>
      <option value="night">{t("night_mode")}</option>
    </select>
  );
}
