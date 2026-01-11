import type { TimelineInfo } from "./types";

// Map year -> dynamic import loader (keeps your app modular)
export const timelineInfoLoaders: Record<
  string,
  () => Promise<{ default: TimelineInfo }>
> = {
  "1963": () => import("./pages/1963"),
  "1970": () => import("./pages/1970"),
  "1982": () => import("./pages/1982"),
  "2013": () => import("./pages/2013"),
  "2023": () => import("./pages/2023"),
  // Add more years here later
};
