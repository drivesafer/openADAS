import { createReactMiniApp } from "@/sdk/createReactMiniApp";
import { manifest } from "./manifest";
import { TrafficSignTuneApp } from "./TrafficSignTuneApp";

export default createReactMiniApp(manifest, TrafficSignTuneApp);
