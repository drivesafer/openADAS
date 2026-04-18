import { createReactMiniApp } from "@/sdk/createReactMiniApp";
import { manifest } from "./manifest";
import { TrafficSignApp } from "./TrafficSignApp";

export default createReactMiniApp(manifest, TrafficSignApp);
