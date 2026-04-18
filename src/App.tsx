import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";

const HomePage = lazy(() => import("./pages/HomePage"));
const MarketplacePage = lazy(() => import("./pages/MarketplacePage"));
const MiniAppPage = lazy(() => import("./pages/MiniAppPage"));

export function App() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-surface text-text dark:bg-surface-dark dark:text-text-dark">
          Loading...
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/app/:appId" element={<MiniAppPage />} />
      </Routes>
    </Suspense>
  );
}
