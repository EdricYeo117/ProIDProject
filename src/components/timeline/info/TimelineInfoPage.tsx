import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { TimelineInfo } from "./types";
import { timelineInfoLoaders } from "./registry";

export default function TimelineInfoPage() {
  const { year } = useParams();
  const [info, setInfo] = useState<TimelineInfo | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">(
    "loading"
  );
  const [copied, setCopied] = useState(false);

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

  const infoPath = useMemo(() => {
    if (!year) return "/timeline";
    return `/timeline/${year}/info`;
  }, [year]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  // Loading state (styled)
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white relative overflow-hidden">
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

        <div className="relative pt-24 md:pt-28 px-6 sm:px-12 pb-20">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-3xl border border-indigo-500/20 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden p-8 sm:p-10">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-indigo-300 border-t-transparent animate-spin" />
                <div className="text-indigo-200 font-medium">
                  Loading details…
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not found state (styled)
  if (status === "notfound" || !info) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
        </div>

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
  }

  // Ready state
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white relative overflow-hidden">
      {/* Animated background elements */}
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
            {/* Header with gradient overlay */}
            <div className="relative p-8 sm:p-10 border-b border-indigo-500/10 bg-gradient-to-br from-indigo-950/80 via-slate-900/80 to-purple-950/80">
              {/* Decorative corner accents */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-bl-full" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500/5 to-transparent rounded-tr-full" />

              <div className="relative flex flex-col gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Year badge with glow effect */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-amber-400/30 blur-xl rounded-2xl" />
                    <div className="relative text-5xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 drop-shadow-lg">
                      {info.year}
                    </div>
                  </div>

                  {info.tag ? (
                    <span className="relative text-xs font-bold px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-600/40 to-purple-600/40 border border-indigo-400/30 text-indigo-200 backdrop-blur-sm shadow-lg">
                      {info.tag}
                    </span>
                  ) : null}
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-white drop-shadow-md">
                  {info.title}
                </h1>
              </div>
            </div>

            {/* Content section */}
            <div className="p-8 sm:p-10">
              <article className="prose prose-invert prose-lg max-w-none">
                <div className="text-slate-200 leading-relaxed whitespace-pre-wrap text-base sm:text-lg">
                  {info.longText}
                </div>
              </article>

              {/* Sources section */}
              <div className="mt-12 pt-8 border-t border-indigo-500/10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                  <div className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 uppercase tracking-wider">
                    Sources
                  </div>
                </div>

                <ul className="space-y-3">
                  {info.sources.map((s, idx) => (
                    <li key={s} className="group">
                      <a
                        href={s}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-start gap-3 text-sm text-indigo-300 hover:text-indigo-200 transition-colors p-3 rounded-xl hover:bg-indigo-950/30"
                      >
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300 group-hover:bg-indigo-500/30 transition-colors">
                          {idx + 1}
                        </span>
                        <span className="break-all underline underline-offset-4 decoration-indigo-500/30 group-hover:decoration-indigo-400/60">
                          {s}
                        </span>
                      </a>
                    </li>
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
