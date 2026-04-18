import type { MiniAppManifest } from "@/sdk/types";

export const manifest: MiniAppManifest = {
  id: "traffic-sign-tune",
  name: { en: "Traffic Sign (Tune/Debug)", vi: "Biển báo (Chỉnh/Debug)" },
  description: {
    en: "Debug and tune traffic sign detection parameters.",
    vi: "Chỉnh sửa và tinh chỉnh tham số nhận diện biển báo.",
  },
  version: "1.0.0",
  icon: "🔧",
  accentColor: "#f59e0b",
  author: "OpenADAS",
  permissions: ["camera", "opencv"],
  tags: ["detection", "debug"],
};
