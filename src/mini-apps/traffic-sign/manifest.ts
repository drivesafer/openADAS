import type { MiniAppManifest } from "@/sdk/types";

export const manifest: MiniAppManifest = {
  id: "traffic-sign",
  name: { en: "Traffic Sign Recognition", vi: "Nhận diện biển báo" },
  description: {
    en: "Detect and recognize traffic signs in real time.",
    vi: "Phát hiện và nhận diện biển báo giao thông theo thời gian thực.",
  },
  version: "1.0.0",
  icon: "🛑",
  accentColor: "#2563eb",
  author: "OpenADAS",
  permissions: ["camera", "opencv"],
  tags: ["detection", "signs", "safety"],
};
