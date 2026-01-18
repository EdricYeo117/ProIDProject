export type MediaItem =
  | {
      type: "image";
      src: string;
      alt?: string;
      caption?: string;
    }
  | {
      type: "video";
      src: string;
      poster?: string;
      caption?: string;
    }
  | {
      type: "audio";
      src: string;
      caption?: string;
    };

export interface TimelineInfo {
  year: number;
  title: string;
  tag?: string;
  longText: string;
  sources: string[];

  // NEW (optional, backward compatible)
  media?: MediaItem[];
}
