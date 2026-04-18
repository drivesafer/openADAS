import type { MiniAppManifest } from "@/sdk/types";

export const manifest: MiniAppManifest = {
  id: "combo",
  name: { en: "Signs + Lane Departure", vi: "Biển báo + Lệch làn" },
  description: {
    en: "Combined traffic sign recognition and lane departure warning.",
    vi: "Kết hợp cả nhận diện biển báo và cảnh báo lệch làn.",
  },
  version: "0.1.0",
  icon: "🛑➕🛣️",
  accentColor: "#f59e0b",
  author: "OpenADAS",
  permissions: ["camera", "opencv"],
  tags: ["detection", "lane", "combo"],
};
