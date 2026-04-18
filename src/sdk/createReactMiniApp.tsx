import { createRoot, type Root } from "react-dom/client";
import type {
  MiniAppContext,
  MiniAppLifecycle,
  MiniAppManifest,
} from "./types";

export function createReactMiniApp(
  manifest: MiniAppManifest,
  Component: React.ComponentType<{ context: MiniAppContext }>,
): MiniAppLifecycle {
  let root: Root | null = null;

  return {
    manifest,
    mount(container, context) {
      root = createRoot(container);
      root.render(<Component context={context} />);
    },
    unmount() {
      root?.unmount();
      root = null;
    },
  };
}
