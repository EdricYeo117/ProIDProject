import type { TimelineInfo } from "./types";

// Map year -> dynamic import loader (keeps your app modular)
export const timelineInfoLoaders: Record<
  string,
  () => Promise<{ default: TimelineInfo }>
> = {
  "1963": () => import("./pages/1963"),
  "1970": () => import("./pages/1970"),
  // Add more years here later
};
