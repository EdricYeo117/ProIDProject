// src/components/timeline/NPTimeline.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "react-qr-code";
import {
  Calendar,
  Award,
  Building2,
  GraduationCap,
  Lightbulb,
  Globe,
  Leaf,
  Users,
} from "lucide-react";
import { timelineInfoLoaders } from "./info/registry";

/* ─────────────────────────── Types & utils ─────────────────────────── */

type Milestone = {
  id: number;
  year: number;
  title: string;
  description: string;
  category: string | null;
  era_name: string | null;
  image_url?: string | null;
  display_order?: number | null;
};

const API_BASE = (import.meta.env.VITE_API_BASE ?? "")
  .toString()
  .replace(/\/+$/, "");

async function jsonFetch<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function normalizeRows(rows: any[]): Milestone[] {
  return (rows || []).map((r) => {
    const obj = Object.fromEntries(
      Object.entries(r).map(([k, v]) => [k.toLowerCase(), v]),
    );
    return {
      id: Number(obj.id),
      year: Number(obj.year),
      title: String(obj.title ?? ""),
      description: String(obj.description ?? ""),
      category: (obj.category ?? null) as string | null,
      era_name: (obj.era_name ?? null) as string | null,
      image_url: (obj.image_url ?? null) as string | null,
      display_order:
        obj.display_order == null ? null : Number(obj.display_order),
    };
  });
}

const categoryIcons: Record<string, any> = {
  Foundation: Building2,
  Identity: Award,
  Campus: Building2,
  Academic: GraduationCap,
  Technology: Lightbulb,
  Innovation: Lightbulb,
  Milestone: Award,
  International: Globe,
  Sustainability: Leaf,
  Partnership: Users,
  Governance: Building2,
  Recognition: Award,
  "Student Support": Users,
};

const categoryColors: Record<string, string> = {
  Foundation: "from-amber-500 to-orange-600",
  Identity: "from-purple-500 to-pink-600",
  Campus: "from-blue-500 to-indigo-600",
  Academic: "from-emerald-500 to-teal-600",
  Technology: "from-cyan-500 to-blue-600",
  Innovation: "from-violet-500 to-purple-600",
  Milestone: "from-rose-500 to-pink-600",
  International: "from-sky-500 to-blue-600",
  Sustainability: "from-green-500 to-emerald-600",
  Partnership: "from-indigo-500 to-purple-600",
  Governance: "from-slate-500 to-gray-600",
  Recognition: "from-yellow-500 to-amber-600",
  "Student Support": "from-pink-500 to-rose-600",
};

function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

/* ─────────────────────────── Event Card ─────────────────────────── */
function Chip({
  active,
  onClick,
  children,
  tone = "blue",
  gradient,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  tone?: "blue" | "purple";
  gradient?: string; // expects: "from-... to-..."
}) {
  const activeClass = gradient
    ? `bg-gradient-to-r ${gradient} border-white/20 text-white shadow`
    : tone === "purple"
      ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 border-purple-400/50 text-white shadow"
      : "bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-400/50 text-white shadow";

  const idleClass =
    "bg-slate-800/70 border-slate-600 hover:bg-slate-800/90 hover:border-slate-400/70";

  return (
    <button
      onClick={onClick}
      aria-pressed={!!active}
      className={[
        "shrink-0 whitespace-nowrap rounded-full border transition-colors",
        "px-2.5 py-1 sm:px-3 sm:py-1.5",
        "text-[12px] sm:text-[13px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
        tone === "purple"
          ? "text-purple-100/90 focus-visible:ring-purple-400/50"
          : "text-blue-100/90 focus-visible:ring-blue-400/50",
        active ? activeClass : idleClass,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function EventCard({
  milestone,
  side,
  onClick,
}: {
  milestone: Milestone;
  side: "left" | "right";
  onClick: () => void;
}) {
  const IconComponent = categoryIcons[milestone.category ?? ""] || Calendar;
  const colorClass =
    categoryColors[milestone.category ?? ""] || "from-blue-500 to-indigo-600";

  return (
    <div
      className="bg-slate-800/95 backdrop-blur-lg rounded-2xl px-4 py-4 sm:px-6 sm:py-5 border border-slate-700/50 shadow-2xl hover:border-blue-500/50 transition-all duration-200 cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start gap-3">
        {side === "right" && (
          <div
            className={cx(
              "p-2 rounded-lg bg-gradient-to-br",
              colorClass,
              "flex-shrink-0",
            )}
          >
            <IconComponent className="w-5 h-5 text-white" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {milestone.category && (
              <span
                className={cx(
                  "text-xs font-semibold px-2 py-1 rounded-full bg-gradient-to-r",
                  colorClass,
                  "text-white shadow",
                )}
              >
                {milestone.category}
              </span>
            )}
            <span
              className={cx(
                "p-1 rounded-md bg-gradient-to-br",
                colorClass,
                "text-white/90 inline-flex",
              )}
            >
              <IconComponent className="w-4 h-4" />
            </span>
          </div>

          {/* Title + a short teaser so users see content *inline* */}
          <h3 className="font-bold text-white leading-tight mb-1">
            {milestone.title}
          </h3>
          <p className="text-slate-300/90 text-sm leading-relaxed max-h-[2.6rem] overflow-hidden">
            {milestone.description}
          </p>
        </div>

        {side === "left" && (
          <div
            className={cx(
              "p-2 rounded-lg bg-gradient-to-br",
              colorClass,
              "flex-shrink-0",
            )}
          >
            <IconComponent className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Main ─────────────────────────── */
const NAVBAR_OFFSET_PX = 88;
const ERA_CLEARANCE_PX = 48; // extra space between filters and the first ERA badge

export default function NPTimeline() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set()); // empty = ALL
  const [eraFilter, setEraFilter] = useState<Set<string>>(new Set()); // empty = ALL
  const [eraH, setEraH] = useState(72); // fallback height for the era pill
  const firstEraRef = useRef<HTMLDivElement | null>(null);

  // Info page loaders

  // ⬇️ MOVE THESE INSIDE THE COMPONENT
  const trayRef = useRef<HTMLDivElement | null>(null);
  const [trayH, setTrayH] = useState(0);

  useEffect(() => {
    let alive = true;

    // —— Sticky tray measurement —— //
    const el = trayRef.current;
    const update = () => setTrayH(el ? el.offsetHeight : 0);

    let ro: ResizeObserver | null = null;
    if (el) {
      update(); // initial
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(update);
        ro.observe(el);
      }
      window.addEventListener("resize", update);
    }

    // —— Data load —— //
    (async () => {
      try {
        const raw = await jsonFetch<any[]>(
          `${API_BASE}/api/milestones?limit=5000`,
        );
        const data = normalizeRows(raw).filter((m) => Number.isFinite(m.year));
        data.sort(
          (a, b) =>
            a.year - b.year ||
            (a.display_order ?? 0) - (b.display_order ?? 0) ||
            a.id - b.id,
        );
        if (!alive) return;
        setMilestones(data);

        // after chips render, re-measure tray height
        requestAnimationFrame(update);
      } catch (e) {
        console.error("Failed to load milestones:", e);
        if (alive) setMilestones([]);
      } finally {
        if (alive) setIsLoading(false);
      }
    })();

    return () => {
      alive = false;
      if (ro) ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  // Unique filters
  const allCategories = useMemo(() => {
    return Array.from(
      new Set(milestones.map((m) => m.category).filter(Boolean) as string[]),
    ).sort();
  }, [milestones]);

  const allEras = useMemo(() => {
    // build ranges once from milestones (or keep your existing eraYearRanges memo)
    const ranges = new Map<string, { min: number; max: number }>();

    milestones.forEach((m) => {
      const e = (m.era_name ?? "").trim();
      if (!e) return;
      const r = ranges.get(e);
      if (!r) ranges.set(e, { min: m.year, max: m.year });
      else {
        r.min = Math.min(r.min, m.year);
        r.max = Math.max(r.max, m.year);
      }
    });

    // unique eras
    const eras = Array.from(ranges.keys());

    // sort by min year asc (then max asc, then name)
    eras.sort((a, b) => {
      const ra = ranges.get(a)!;
      const rb = ranges.get(b)!;
      return ra.min - rb.min || ra.max - rb.max || a.localeCompare(b);
    });

    return eras;
  }, [milestones]);

  // Era year ranges for labels
  const eraYearRanges = useMemo(() => {
    const ranges = new Map<string, { min: number; max: number }>();
    milestones.forEach((m) => {
      if (!m.era_name) return;
      const existing = ranges.get(m.era_name);
      if (!existing) {
        ranges.set(m.era_name, { min: m.year, max: m.year });
      } else {
        existing.min = Math.min(existing.min, m.year);
        existing.max = Math.max(existing.max, m.year);
      }
    });
    return ranges;
  }, [milestones]);

  // Apply filters
  const filtered = useMemo(() => {
    return milestones.filter((m) => {
      const catOK =
        categoryFilter.size === 0 ||
        (m.category && categoryFilter.has(m.category));
      const eraOK =
        eraFilter.size === 0 || (m.era_name && eraFilter.has(m.era_name));
      return catOK && eraOK;
    });
  }, [milestones, categoryFilter, eraFilter]);

  // Group by year (only years that actually have events after filter)
  const grouped = useMemo(() => {
    const map = new Map<number, Milestone[]>();
    for (const m of filtered) {
      if (!map.has(m.year)) map.set(m.year, []);
      map.get(m.year)!.push(m);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filtered]);

  useEffect(() => {
    const el = firstEraRef.current;
    if (!el) return;

    const measure = () => setEraH(el.offsetHeight + 12); // +12 for its margin gap
    measure();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }
    window.addEventListener("resize", measure);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [grouped.length]);

  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white"
        style={{
          scrollPaddingTop: NAVBAR_OFFSET_PX + trayH + eraH + ERA_CLEARANCE_PX,
        }}
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-blue-200 text-lg">Loading Timeline...</p>
        </div>
      </div>
    );
  }

  /* helpers for chips */
  const toggleSet = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    value: string,
  ) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  /* era de-dup for the vertical spine */
  let lastEraShown = ""; // updated while rendering rows

  // Helpers to track number of filtered items
  const hasAnyData = milestones.length > 0;
  const hasResults = grouped.length > 0;
  const hasActiveFilters = categoryFilter.size > 0 || eraFilter.size > 0;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white"
      style={{ scrollPaddingTop: NAVBAR_OFFSET_PX + trayH + eraH }}
    >
      {/* Space for fixed navbar */}
      <div className="pt-28 md:pt-36 px-4 sm:px-6 md:px-12 pb-20">
        <div className="max-w-6xl mx-auto mb-6 rounded-2xl bg-slate-900/70 border border-slate-700/50 shadow-xl backdrop-blur px-5 py-4">
          {/* ── Filters row ───────────────────────────────────────────── */}
          <div
            ref={trayRef}
            className="md:sticky z-40" // was z-20
            style={{ top: NAVBAR_OFFSET_PX }}
          >
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/95 backdrop-blur-md shadow-lg px-4 sm:px-5 py-4">
              <div className="flex flex-col gap-4">
                {/* Category chips */}
                <div>
                  <div className="mb-2 text-xs font-medium text-blue-300/90 uppercase tracking-wider">
                    Category
                  </div>
                  <div className="flex gap-2 overflow-x-auto flex-nowrap pb-2 -mx-1 px-1 md:flex-wrap md:overflow-visible md:pb-0 md:mx-0 md:px-0">
                    <Chip
                      active={categoryFilter.size === 0}
                      onClick={() => setCategoryFilter(new Set())}
                    >
                      All
                    </Chip>
                    {allCategories.map((c) => (
                      <Chip
                        key={c}
                        active={categoryFilter.has(c)}
                        onClick={() => toggleSet(setCategoryFilter, c)}
                        gradient={categoryColors[c]} // ✅ THIS is what makes Foundation orange
                      >
                        {c}
                      </Chip>
                    ))}
                  </div>
                </div>

                {/* Era chips */}
                <div>
                  <div className="mb-2 text-xs font-medium text-purple-300/90 uppercase tracking-wider">
                    Era
                  </div>

                  <div
                    className="flex gap-2 overflow-x-auto flex-nowrap pb-2 -mx-1 px-1 items-center
                  md:flex-wrap md:overflow-visible md:pb-0 md:mx-0 md:px-0"
                  >
                    <Chip
                      tone="purple"
                      active={eraFilter.size === 0}
                      onClick={() => setEraFilter(new Set())}
                    >
                      All
                    </Chip>

                    {allEras.map((e) => {
                      const range = eraYearRanges.get(e);
                      const label = range
                        ? `${e} (${range.min} - ${range.max})`
                        : e;

                      return (
                        <Chip
                          key={e}
                          tone="purple"
                          active={eraFilter.has(e)}
                          onClick={() => toggleSet(setEraFilter, e)}
                        >
                          {label}
                        </Chip>
                      );
                    })}

                    {(categoryFilter.size > 0 || eraFilter.size > 0) && (
                      <button
                        onClick={() => {
                          setCategoryFilter(new Set());
                          setEraFilter(new Set());
                        }}
                        className="shrink-0 ml-auto px-4 py-1.5 rounded-full text-sm font-medium border-2 border-slate-600 text-slate-300 hover:border-red-400 hover:text-white hover:bg-red-600 transition-all"
                        title="Clear all filters"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Timeline ──────────────────────────────────────────────── */}

          {/* ── Timeline / Empty state ──────────────────────────────────────────────── */}
          <div
            className="relative"
            style={{ marginTop: trayH + eraH + ERA_CLEARANCE_PX }}
          >
            {hasResults ? (
              <>
                {/* vertical spine */}
                <div
                  className="absolute left-5 md:left-1/2 top-0 bottom-0 w-[2px] z-0
  bg-gradient-to-b from-blue-500/70 via-indigo-500/50 to-pink-500/40
  md:-translate-x-1/2"
                />
                <div className="space-y-28 md:space-y-32">
                  {grouped.map(([year, items], idx) => {
                    const isLeft = idx % 2 === 0;
                    const era = (items[0]?.era_name || "").trim();
                    const showEra = era && era !== lastEraShown;
                    if (showEra) lastEraShown = era;

                    return (
                      <div key={year} className="relative">
                        {/* -------------------- MOBILE (single column) -------------------- */}
                        <div className="md:hidden relative pl-10">
                          {/* Era badge (mobile) */}
                          {showEra && (
                            <div className="mb-4">
                              <div
                                className="inline-block px-5 py-2 rounded-full font-bold text-[14px]
            bg-gradient-to-r from-blue-600 to-purple-600 border-2 border-blue-400/50
            text-white shadow-lg"
                              >
                                {era}
                              </div>
                            </div>
                          )}

                          {/* Year (mobile sized) */}
                          <div
                            className="text-yellow-400 text-[56px] sm:text-[72px] leading-[0.95]
        drop-shadow-[0_6px_20px_rgba(0,0,0,.35)] font-black tracking-tight mb-4"
                          >
                            {year}
                          </div>

                          {/* Dot aligned to spine */}
                          <div className="absolute left-5 top-8 -translate-x-1/2">
                            <div className="w-8 h-8 rounded-full bg-yellow-400 ring-[5px] ring-yellow-300/50 shadow-[0_0_30px_rgba(250,204,21,.45)]" />
                          </div>
                          {/* Cards full width */}
                          <div className="space-y-4">
                            {items.map((m) => (
                              <EventCard
                                key={m.id}
                                milestone={m}
                                side="left"
                                onClick={() => setSelectedMilestone(m)}
                              />
                            ))}
                          </div>
                        </div>

                        {/* -------------------- DESKTOP (your original 2-column) -------------------- */}
                        <div className="hidden md:block">
                          <div className="flex items-start justify-center">
                            {/* LEFT column */}
                            <div
                              className={cx(
                                "w-[44%]",
                                isLeft ? "pr-12" : "invisible",
                              )}
                            >
                              {isLeft && (
                                <>
                                  <div
                                    className="text-yellow-400 hover:text-yellow-300 text-[72px] md:text-[96px] lg:text-[120px] leading-[0.9]
                drop-shadow-[0_6px_20px_rgba(0,0,0,.35)] font-black tracking-tight mb-6 transition-colors"
                                  >
                                    {year}
                                  </div>

                                  <div className="space-y-4">
                                    {items.map((m) => (
                                      <EventCard
                                        key={m.id}
                                        milestone={m}
                                        side="left"
                                        onClick={() => setSelectedMilestone(m)}
                                      />
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Center */}
                            <div className="relative z-0 flex-shrink-0">
                              {showEra && (
                                <div
                                  ref={idx === 0 ? firstEraRef : undefined}
                                  className="absolute z-0 bottom-full left-1/2 -translate-x-1/2 mb-10 md:mb-12"
                                >
                                  <div
                                    className="px-6 md:px-7 py-2.5 md:py-3 rounded-full font-bold text-[15px] md:text-[17px]
                bg-gradient-to-r from-blue-600 to-purple-600 border-2 border-blue-400/50 text-white shadow-lg whitespace-nowrap"
                                  >
                                    {era}
                                  </div>
                                </div>
                              )}
                              <div className="w-9 h-9 rounded-full bg-yellow-400 ring-[5px] ring-yellow-300/50 shadow-[0_0_30px_rgba(250,204,21,.45)]" />
                            </div>

                            {/* RIGHT column */}
                            <div
                              className={cx(
                                "w-[44%]",
                                !isLeft ? "pl-12" : "invisible",
                              )}
                            >
                              {!isLeft && (
                                <>
                                  <div
                                    className="text-yellow-400 hover:text-yellow-300 text-[72px] md:text-[96px] lg:text-[120px] leading-[0.9]
                drop-shadow-[0_6px_20px_rgba(0,0,0,.35)] font-black tracking-tight mb-6 transition-colors"
                                  >
                                    {year}
                                  </div>

                                  <div className="space-y-4">
                                    {items.map((m) => (
                                      <EventCard
                                        key={m.id}
                                        milestone={m}
                                        side="right"
                                        onClick={() => setSelectedMilestone(m)}
                                      />
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="grid place-items-center py-24">
                <div className="max-w-xl w-full rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur px-6 py-8 text-center shadow-xl">
                  <h2 className="text-xl font-semibold text-white mb-2">
                    {hasAnyData
                      ? "No milestones match your filters"
                      : "No milestones available yet"}
                  </h2>

                  <p className="text-sm text-slate-300 mb-6">
                    {hasAnyData
                      ? "Adjust the Category/Era filters, or clear them to see all milestones."
                      : "Insert milestone data to populate the timeline."}
                  </p>

                  <div className="flex items-center justify-center gap-3">
                    {hasActiveFilters && (
                      <button
                        onClick={() => {
                          setCategoryFilter(new Set());
                          setEraFilter(new Set());
                        }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow"
                      >
                        Clear filters
                      </button>
                    )}

                    <button
                      onClick={() =>
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }
                      className="px-4 py-2 rounded-xl border border-slate-600 text-slate-200 hover:border-slate-400 hover:bg-slate-800/50"
                    >
                      Back to filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="h-24" />
        </div>
      </div>

      {/* Detail Modal: click any card to open; show image(s) here */}
      {selectedMilestone && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8"
          onClick={() => setSelectedMilestone(null)}
        >
          <div
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-slate-700/50"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const color =
                categoryColors[selectedMilestone.category ?? ""] ||
                "from-blue-500 to-indigo-600";
              const Ico =
                categoryIcons[selectedMilestone.category ?? ""] || Calendar;
              // Support optional multiple images as comma/semicolon-separated string
              const imgs = (selectedMilestone.image_url ?? "")
                .split(/[;,]/)
                .map((s) => s.trim())
                .filter(Boolean);
              return (
                <>
                  <div className="flex items-start gap-6 mb-6">
                    <div
                      className={cx(
                        "p-4 rounded-2xl bg-gradient-to-br",
                        color,
                        "shadow-lg",
                      )}
                    >
                      <Ico className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl font-bold text-blue-400">
                          {selectedMilestone.year}
                        </span>
                        {selectedMilestone.category && (
                          <span
                            className={cx(
                              "text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r",
                              color,
                              "text-white",
                            )}
                          >
                            {selectedMilestone.category}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {selectedMilestone.title}
                      </h2>
                      {selectedMilestone.era_name && (
                        <p className="text-sm text-blue-400/80 font-medium">
                          {selectedMilestone.era_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {imgs.length > 0 && (
                    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {imgs.slice(0, 4).map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          className="w-full h-40 object-cover rounded-xl border border-slate-700/60"
                        />
                      ))}
                    </div>
                  )}

                  <p className="text-slate-300 leading-relaxed mb-6">
                    {selectedMilestone.description}
                  </p>
                  {(() => {
                    const yearStr = String(selectedMilestone.year);

                    // ✅ Only show QR + link if an info page exists in the registry
                    const hasInfo = !!timelineInfoLoaders[yearStr];
                    if (!hasInfo) return null;

                    const infoPath = `/timeline/${yearStr}/info`;

                    // Use a public base URL if you want phone scanning to work on LAN
                    // e.g. VITE_PUBLIC_BASE_URL=http://192.168.1.23:5173
                    const base = (
                      import.meta.env.VITE_PUBLIC_BASE_URL ||
                      window.location.origin
                    )
                      .toString()
                      .replace(/\/+$/, "");

                    const infoUrl = `${base}${infoPath}`;

                    return (
                      <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-slate-700/60 bg-slate-900/40 p-4">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white">
                            More information
                          </div>
                          <div className="text-xs text-slate-300">
                            Scan or click the QR code to open the full page.
                          </div>
                          <div className="mt-1 text-[11px] font-mono text-slate-400 break-all">
                            {infoPath}
                          </div>

                          <Link
                            to={infoPath}
                            className="mt-2 inline-block text-xs text-blue-300 hover:text-blue-200 underline underline-offset-2"
                          >
                            Open details page
                          </Link>
                        </div>

                        {/* Clickable QR */}
                        <Link
                          to={infoPath}
                          className="shrink-0 rounded-lg bg-white p-2 shadow-sm hover:opacity-95"
                          aria-label={`Open ${yearStr} info page`}
                          title="Open details page"
                        >
                          <QRCode value={infoUrl} size={84} />
                        </Link>
                      </div>
                    );
                  })()}

                  <button
                    onClick={() => setSelectedMilestone(null)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-lg"
                  >
                    Close
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
