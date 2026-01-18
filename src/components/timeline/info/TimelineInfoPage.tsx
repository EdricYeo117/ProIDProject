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
        ? "group rounded-2xl border border-indigo-500/15 bg-slate-900/40 backdrop-blur-xl p-6 sm:p-7 shadow-[0_10px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_50px_rgba(99,102,241,0.15)] hover:border-indigo-400/25 transition-all duration-300 ease-out"
        : "group rounded-2xl border border-indigo-500/20 bg-slate-950/30 backdrop-blur-xl p-6 sm:p-7 shadow-[0_10px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_50px_rgba(139,92,246,0.12)] hover:border-indigo-400/30 transition-all duration-300 ease-out";

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
    {/* Large ambient orbs */}
    <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/15 via-indigo-600/10 to-transparent rounded-full blur-3xl animate-pulse" />
    <div
      className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-gradient-to-br from-purple-500/15 via-purple-600/10 to-transparent rounded-full blur-3xl animate-pulse"
      style={{ animationDelay: "1.5s" }}
    />
    <div
      className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-br from-blue-500/8 via-cyan-500/6 to-transparent rounded-full blur-3xl animate-pulse"
      style={{ animationDelay: "3s" }}
    />
    
    {/* Floating particles */}
    <div className="absolute top-[20%] left-[15%] w-2 h-2 bg-indigo-400/30 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />
    <div className="absolute top-[60%] right-[25%] w-1.5 h-1.5 bg-purple-400/25 rounded-full animate-pulse" style={{ animationDelay: "1.2s" }} />
    <div className="absolute bottom-[30%] left-[40%] w-1 h-1 bg-cyan-400/20 rounded-full animate-pulse" style={{ animationDelay: "2.5s" }} />
    <div className="absolute top-[45%] right-[10%] w-1.5 h-1.5 bg-indigo-300/25 rounded-full animate-pulse" style={{ animationDelay: "1.8s" }} />
    <div className="absolute bottom-[50%] left-[70%] w-1 h-1 bg-purple-300/20 rounded-full animate-pulse" style={{ animationDelay: "0.8s" }} />
    
    {/* Gradient mesh overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-transparent to-purple-950/20" />
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
  <div className="pt-3 pb-1 animate-fade-in">
    <div className="flex items-center gap-3.5 mb-3">
      <div className="w-1.5 h-7 bg-gradient-to-b from-indigo-400 via-indigo-500 to-purple-500 rounded-full shadow-lg shadow-indigo-500/30" />
      <div className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-200 to-purple-300 uppercase tracking-widest drop-shadow-sm">
        {text}
      </div>
    </div>
  </div>
));
BlockHeading.displayName = "BlockHeading";

const BlockList = memo(({ items }: { items: string[] }) => (
  <ParagraphBox tone="soft">
    <div className="text-slate-50 text-lg sm:text-xl font-bold mb-4 tracking-tight">
      Key points
    </div>
    <ol className="list-decimal pl-6 space-y-3 text-slate-100 leading-relaxed text-base sm:text-lg">
      {items.map((item, i) => (
        <li key={i} className="marker:text-indigo-400 marker:font-semibold hover:text-white transition-colors duration-200">
          {item}
        </li>
      ))}
    </ol>
  </ParagraphBox>
));
BlockList.displayName = "BlockList";

const BlockParagraph = memo(({ text }: { text: string }) => (
  <ParagraphBox>
    <p className="text-slate-100 leading-relaxed text-base sm:text-lg font-light tracking-wide">{text}</p>
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
        className="flex items-start gap-4 text-sm text-indigo-300 hover:text-indigo-100 transition-all duration-200 p-3.5 rounded-xl hover:bg-indigo-950/40 hover:shadow-lg hover:shadow-indigo-500/10 border border-transparent hover:border-indigo-500/20"
      >
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500/25 to-purple-500/20 flex items-center justify-center text-xs font-bold text-indigo-200 group-hover:from-indigo-500/40 group-hover:to-purple-500/30 transition-all duration-200 shadow-md group-hover:shadow-lg group-hover:scale-105">
          {index + 1}
        </span>
        <span className="break-all underline underline-offset-4 decoration-indigo-500/40 group-hover:decoration-indigo-400/70 font-medium">
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

      <div className="relative pt-24 md:pt-28 px-6 sm:px-12 pb-20 animate-fade-in">
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
          <div className="rounded-3xl border border-indigo-500/25 bg-slate-900/70 backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.4)] overflow-hidden hover:border-indigo-400/40 hover:shadow-[0_25px_90px_rgba(99,102,241,0.2)] transition-all duration-500 ease-out relative group">
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-500 pointer-events-none" />
            {/* Header */}
            <div className="relative p-8 sm:p-12 border-b border-indigo-500/15 bg-gradient-to-br from-indigo-950/90 via-slate-900/85 to-purple-950/90">
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/8 to-transparent rounded-bl-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/8 to-transparent rounded-tr-full blur-xl" />

              <div className="relative flex flex-col gap-5">
                <div className="flex items-center gap-5 flex-wrap">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400/35 via-yellow-400/30 to-amber-500/35 blur-2xl rounded-2xl group-hover:blur-3xl transition-all duration-300" />
                    <div className="relative text-6xl sm:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-amber-200 via-yellow-300 to-amber-400 drop-shadow-2xl">
                      {info.year}
                    </div>
                  </div>

                  {info.tag && (
                    <span className="relative text-xs font-extrabold px-5 py-2 rounded-full bg-gradient-to-r from-indigo-600/50 to-purple-600/50 border border-indigo-400/40 text-indigo-100 backdrop-blur-md shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 hover:scale-105">
                      {info.tag}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight text-white drop-shadow-2xl tracking-tight">
                  {info.title}
                </h1>
              </div>
            </div>

            {/* Content section */}
            <div className="relative p-8 sm:p-12">
              <MediaSection media={info.media} />

              {/* Content blocks */}
              <div className="space-y-5 mt-12">
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
              <div className="mt-14 pt-10 border-t border-indigo-500/15">
                <div className="flex items-center gap-3.5 mb-6">
                  <div className="w-1.5 h-7 bg-gradient-to-b from-indigo-400 via-indigo-500 to-purple-500 rounded-full shadow-lg shadow-indigo-500/30" />
                  <div className="text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-200 to-purple-300 uppercase tracking-widest drop-shadow-sm">
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
              <div className="mt-14 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/timeline"
                  className="flex-1 inline-flex justify-center items-center gap-2.5 rounded-xl border border-indigo-500/35 bg-slate-900/70 backdrop-blur-md px-6 py-3.5 text-indigo-200 hover:border-indigo-400/70 hover:bg-slate-800/70 hover:text-white transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:shadow-indigo-900/30 hover:scale-[1.02]"
                >
                  <span className="text-lg">←</span>
                  <span>Back to timeline</span>
                </Link>

                <button
                  onClick={handleCopyLink}
                  className="flex-1 inline-flex justify-center items-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-purple-500 px-6 py-3.5 font-bold text-white shadow-xl hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-[1.02]"
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
