import { createReactMiniApp } from "@/sdk/createReactMiniApp";
import { manifest } from "./manifest";
import type { MiniAppContext } from "@/sdk/types";

function ComboApp({ context }: { context: MiniAppContext }) {
  return (
    <div className="flex h-screen items-center justify-center bg-driving-bg text-white">
      <div className="text-center">
        <div className="text-5xl">{manifest.icon}</div>
        <h2 className="mt-4 text-xl font-bold">
          {manifest.name[context.i18n.language] ?? manifest.name.en}
        </h2>
        <p className="mt-2 text-gray-400">{context.i18n.t("coming_soon")}</p>
      </div>
    </div>
  );
}

export default createReactMiniApp(manifest, ComboApp);
