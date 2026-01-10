import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { TimelineInfo } from "./types";
import { timelineInfoLoaders } from "./registry";

export default function TimelineInfoPage() {
  const { year } = useParams();
  const [info, setInfo] = useState<TimelineInfo | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");

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

  if (status === "loading") {
    return (
      <div className="p-6 text-slate-100">
        Loading…
      </div>
    );
  }

  if (status === "notfound" || !info) {
    return (
      <div className="p-6 text-slate-100">
        <div className="text-xl font-semibold mb-2">Info not found</div>
        <div className="opacity-80 mb-4">
          No content is registered for year: <span className="font-mono">{year}</span>
        </div>
        <Link className="underline" to="/timeline">Back to timeline</Link>
      </div>
    );
  }

  return (
    <div className="p-6 text-slate-100">
      <div className="max-w-3xl mx-auto">
        <Link to="/timeline" className="inline-block mb-6 underline">
          ← Back to timeline
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="text-3xl font-bold">{info.year}</div>
          {info.tag ? (
            <span className="text-xs px-2 py-1 rounded-full bg-slate-800 border border-slate-700">
              {info.tag}
            </span>
          ) : null}
        </div>

        <h1 className="text-xl font-semibold mb-4">{info.title}</h1>

        <div className="whitespace-pre-wrap leading-7 text-slate-200">
          {info.longText}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="font-semibold mb-3">Sources</div>
          <ul className="list-disc pl-5 space-y-2">
            {info.sources.map((s) => (
              <li key={s}>
                <a className="underline" href={s} target="_blank" rel="noreferrer">
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
