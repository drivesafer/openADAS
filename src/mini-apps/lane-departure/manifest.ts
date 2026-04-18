import type { MiniAppManifest } from "@/sdk/types";

export const manifest: MiniAppManifest = {
  id: "lane-departure",
  name: { en: "Lane Departure Warning", vi: "Cảnh báo lệch làn" },
  description: {
    en: "Warn when the vehicle drifts out of its lane.",
    vi: "Cảnh báo khi xe có xu hướng rời khỏi làn đường.",
  },
  version: "0.1.0",
  icon: "🛣️",
  accentColor: "#16a34a",
  author: "OpenADAS",
  permissions: ["camera", "opencv"],
  tags: ["lane", "safety"],
};
