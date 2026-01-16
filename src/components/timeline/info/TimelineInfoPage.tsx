import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
} from "react";
import { Link, useParams } from "react-router-dom";
import type { TimelineInfo } from "./types";
import { timelineInfoLoaders } from "./registry";

/* ─────────────────────────── Paragraph boxing ─────────────────────────── */

type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

function parseLongTextToBlocks(longText: string): Block[] {
  const chunks = longText
    .split(/\n\s*\n/g)
    .map((c) => c.trim())
    .filter(Boolean);

  const blocks: Block[] = [];
  let i = 0;

  while (i < chunks.length) {
    const chunk = chunks[i];

    const headingMatch = chunk.match(/^([A-Za-z][A-Za-z\s]+):$/);
    if (headingMatch) {
      blocks.push({ type: "heading", text: headingMatch[1] });
      i += 1;
      continue;
    }

    const maybeHeading = chunk.match(/^(.+):$/);
    const next = chunks[i + 1] ?? "";
    const nextHasNumbered = next
      .split("\n")
      .some((l) => /^\d+\.\s+/.test(l.trim()));

    if (maybeHeading && nextHasNumbered) {
      blocks.push({ type: "heading", text: maybeHeading[1] });
      blocks.push({
        type: "list",
        items: next
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => l.replace(/^\d+\.\s+/, "")),
      });
      i += 2;
      continue;
    }

    const lines = chunk
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const isNumberedList =
      lines.length >= 2 && lines.every((l) => /^\d+\.\s+/.test(l));

    if (isNumberedList) {
      blocks.push({
        type: "list",
        items: lines.map((l) => l.replace(/^\d+\.\s+/, "")),
      });
      i += 1;
      continue;
    }

    blocks.push({ type: "paragraph", text: chunk });
    i += 1;
  }

  return blocks;
}

const ParagraphBox = memo(
  ({
    children,
    tone = "default",
  }: {
    children: React.ReactNode;
    tone?: "default" | "soft";
  }) => {
    const className =
      tone === "soft"
        ? "rounded-2xl border border-indigo-500/10 bg-slate-900/35 backdrop-blur p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
        : "rounded-2xl border border-indigo-500/15 bg-slate-950/25 backdrop-blur p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)]";

    return <div className={className}>{children}</div>;
  }
);

ParagraphBox.displayName = "ParagraphBox";

/* ─────────────────────────── Media Components ─────────────────────────── */

const FRAME_CLASS =
  "w-full max-w-4xl mx-auto rounded-2xl overflow-hidden border border-indigo-500/20 bg-slate-950/40 shadow-xl";
const RATIO_CLASS = "aspect-[16/9]";

const MediaImage = memo(
  ({
    src,
    alt,
    caption,
  }: {
    src: string;
    alt?: string;
    caption?: string;
  }) => (
    <div className="space-y-3">
      <div className={FRAME_CLASS}>
        <div className={`relative ${RATIO_CLASS}`}>
          <div className="absolute inset-0 ring-1 ring-white/5 pointer-events-none" />
          <img
            src={src}
            alt={alt ?? ""}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-contain bg-black"
          />
        </div>
      </div>
      {caption && (
        <div className="max-w-4xl mx-auto text-sm text-slate-400 italic">
          {caption}
        </div>
      )}
    </div>
  )
);

MediaImage.displayName = "MediaImage";

const MediaVideo = memo(
  ({
    src,
    poster,
    caption,
  }: {
    src: string;
    poster?: string;
    caption?: string;
  }) => (
    <div className="space-y-3">
      <div className={FRAME_CLASS}>
        <div className={`relative ${RATIO_CLASS}`}>
          <div className="absolute inset-0 ring-1 ring-white/5 pointer-events-none" />
          <video
            controls
            preload="metadata"
            poster={poster}
            className="absolute inset-0 w-full h-full object-contain bg-black"
          >
            <source src={src} />
          </video>
        </div>
      </div>
      {caption && (
        <div className="max-w-4xl mx-auto text-sm text-slate-400 italic">
          {caption}
        </div>
      )}
    </div>
  )
);

MediaVideo.displayName = "MediaVideo";

const MediaAudio = memo(
  ({ src, caption }: { src: string; caption?: string }) => (
    <div className="space-y-2">
      <div className={`${FRAME_CLASS} p-4`}>
        <audio controls className="w-full">
          <source src={src} />
        </audio>
      </div>
      {caption && (
        <div className="max-w-4xl mx-auto text-sm text-slate-400 italic">
          {caption}
        </div>
      )}
    </div>
  )
);

MediaAudio.displayName = "MediaAudio";

const MediaSection = memo(({ media }: { media?: TimelineInfo["media"] }) => {
  if (!media || media.length === 0) return null;

  return (
    <div className="mt-10 space-y-10">
      {media.map((m, idx) => {
        const key = `media-${idx}`;
        if (m.type === "image") {
          return (
            <MediaImage
              key={key}
              src={m.src}
              alt={m.alt}
              caption={m.caption}
            />
          );
        }
        if (m.type === "video") {
          return (
            <MediaVideo
              key={key}
              src={m.src}
              poster={m.poster}
              caption={m.caption}
            />
          );
        }
        if (m.type === "audio") {
          return <MediaAudio key={key} src={m.src} caption={m.caption} />;
        }
        return null;
      })}
    </div>
  );
});

MediaSection.displayName = "MediaSection";

/* ─────────────────────────── Background Component ─────────────────────────── */

const AnimatedBackground = memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />
    <div
      className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"
      style={{ animationDelay: "1s" }}
    />
    <div
      className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-pulse"
      style={{ animationDelay: "2s" }}
    />
  </div>
));

AnimatedBackground.displayName = "AnimatedBackground";

/* ─────────────────────────── Loading State ─────────────────────────── */

const LoadingState = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white relative overflow-hidden">
    <AnimatedBackground />
    <div className="relative pt-24 md:pt-28 px-6 sm:px-12 pb-20">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-3xl border border-indigo-500/20 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden p-8 sm:p-10">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-indigo-300 border-t-transparent animate-spin" />
            <div className="text-indigo-200 font-medium">Loading details…</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ─────────────────────────── Not Found State ─────────────────────────── */

const NotFoundState = ({ year }: { year?: string }) => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white relative overflow-hidden">
    <AnimatedBackground />
    <div className="relative pt-24 md:pt-28 px-6 sm:px-12 pb-20">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-3xl border border-indigo-500/20 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden p-8 sm:p-10">
          <div className="text-2xl font-bold mb-2">Info not found</div>
          <div className="text-slate-300 mb-6">
            No content is registered for{" "}
            <span className="font-mono text-slate-200">{year}</span>.
          </div>
          <Link
            to="/timeline"
            className="inline-flex justify-center items-center gap-2 rounded-xl border border-indigo-500/30 bg-slate-900/60 backdrop-blur px-6 py-3 text-indigo-200 hover:border-indigo-400/60 hover:bg-slate-800/60 hover:text-white transition-all font-medium"
          >
            <span>←</span>
            <span>Back to timeline</span>
          </Link>
        </div>
      </div>
    </div>
  </div>
);

/* ─────────────────────────── Content Blocks ─────────────────────────── */

const BlockHeading = memo(({ text }: { text: string }) => (
  <div className="pt-2">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
      <div className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-purple-200 uppercase tracking-wider">
        {text}
      </div>
    </div>
  </div>
));
BlockHeading.displayName = "BlockHeading";

const BlockList = memo(({ items }: { items: string[] }) => (
  <ParagraphBox tone="soft">
    <div className="text-slate-100 text-base sm:text-lg font-semibold mb-3">
      Key points
    </div>
    <ol className="list-decimal pl-5 space-y-2 text-slate-200 leading-relaxed text-base sm:text-lg">
      {items.map((item, i) => (
        <li key={i} className="marker:text-indigo-300">
          {item}
        </li>
      ))}
    </ol>
  </ParagraphBox>
));
BlockList.displayName = "BlockList";

const BlockParagraph = memo(({ text }: { text: string }) => (
  <ParagraphBox>
    <p className="text-slate-200 leading-relaxed text-base sm:text-lg">{text}</p>
  </ParagraphBox>
));
BlockParagraph.displayName = "BlockParagraph";

/* ─────────────────────────── Sources Section ─────────────────────────── */

const SourceLink = memo(
  ({ source, index }: { source: string; index: number }) => (
    <li className="group">
      <a
        href={source}
        target="_blank"
        rel="noreferrer"
        className="flex items-start gap-3 text-sm text-indigo-300 hover:text-indigo-200 transition-colors p-3 rounded-xl hover:bg-indigo-950/30"
      >
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300 group-hover:bg-indigo-500/30 transition-colors">
          {index + 1}
        </span>
        <span className="break-all underline underline-offset-4 decoration-indigo-500/30 group-hover:decoration-indigo-400/60">
          {source}
        </span>
      </a>
    </li>
  )
);
SourceLink.displayName = "SourceLink";

/* ─────────────────────────── Main Page Component ─────────────────────────── */

export default function TimelineInfoPage() {
  const { year } = useParams();
  const [info, setInfo] = useState<TimelineInfo | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">(
    "loading"
  );
  const [copied, setCopied] = useState(false);

  // Fix: correct timer lifecycle for “Copied!”
  const copiedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
        copiedTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!year) {
        setStatus("notfound");
        return;
      }

      const loader = timelineInfoLoaders[year];
      if (!loader) {
        setStatus("notfound");
        return;
      }

      setStatus("loading");
      try {
        const mod = await loader();
        if (!cancelled) {
          setInfo(mod.default);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("notfound");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [year]);

  const blocks = useMemo(
    () => (info ? parseLongTextToBlocks(info.longText) : []),
    [info]
  );

  const handleCopyLink = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url).catch(() => {});

    setCopied(true);

    if (copiedTimerRef.current !== null) {
      window.clearTimeout(copiedTimerRef.current);
    }

    copiedTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      copiedTimerRef.current = null;
    }, 2000);
  }, []);

  if (status === "loading") return <LoadingState />;
  if (status === "notfound" || !info) return <NotFoundState year={year} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative pt-24 md:pt-28 px-6 sm:px-12 pb-20">
        <div className="max-w-5xl mx-auto">
          {/* Top navigation */}
          <div className="mb-6">
            <Link
              to="/timeline"
              className="inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-white transition-colors group"
            >
              <span className="transform group-hover:-translate-x-1 transition-transform">
                ←
              </span>
              <span className="font-medium">Back to timeline</span>
            </Link>
          </div>

          {/* Main content card */}
          <div className="rounded-3xl border border-indigo-500/20 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden hover:border-indigo-500/30 transition-colors">
            {/* Header */}
            <div className="relative p-8 sm:p-10 border-b border-indigo-500/10 bg-gradient-to-br from-indigo-950/80 via-slate-900/80 to-purple-950/80">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-bl-full" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500/5 to-transparent rounded-tr-full" />

              <div className="relative flex flex-col gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="relative">
                    <div className="absolute inset-0 bg-amber-400/30 blur-xl rounded-2xl" />
                    <div className="relative text-5xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 drop-shadow-lg">
                      {info.year}
                    </div>
                  </div>

                  {info.tag && (
                    <span className="relative text-xs font-bold px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-600/40 to-purple-600/40 border border-indigo-400/30 text-indigo-200 backdrop-blur-sm shadow-lg">
                      {info.tag}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-white drop-shadow-md">
                  {info.title}
                </h1>
              </div>
            </div>

            {/* Content section */}
            <div className="p-8 sm:p-10">
              <MediaSection media={info.media} />

              {/* Content blocks */}
              <div className="space-y-4 mt-10">
                {blocks.map((b, idx) => {
                  const key = `${b.type}-${idx}`;
                  if (b.type === "heading")
                    return <BlockHeading key={key} text={b.text} />;
                  if (b.type === "list")
                    return <BlockList key={key} items={b.items} />;
                  return <BlockParagraph key={key} text={b.text} />;
                })}
              </div>

              {/* Sources */}
              <div className="mt-12 pt-8 border-t border-indigo-500/10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                  <div className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 uppercase tracking-wider">
                    Sources
                  </div>
                </div>

                <ul className="space-y-3">
                  {info.sources.map((s, idx) => (
                    <SourceLink key={s} source={s} index={idx} />
                  ))}
                </ul>
              </div>

              {/* Action buttons */}
              <div className="mt-12 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/timeline"
                  className="flex-1 inline-flex justify-center items-center gap-2 rounded-xl border border-indigo-500/30 bg-slate-900/60 backdrop-blur px-6 py-3 text-indigo-200 hover:border-indigo-400/60 hover:bg-slate-800/60 hover:text-white transition-all font-medium"
                >
                  <span>←</span>
                  <span>Back to timeline</span>
                </Link>

                <button
                  onClick={handleCopyLink}
                  className="flex-1 inline-flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-6 py-3 font-bold text-white shadow-lg hover:shadow-xl hover:shadow-indigo-500/25 transition-all"
                >
                  {copied ? (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Copy link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="h-12" />
        </div>
      </div>
    </div>
  );
}
