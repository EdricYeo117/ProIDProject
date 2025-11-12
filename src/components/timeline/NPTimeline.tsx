// src/components/timeline/NPTimeline.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar, Award, Building2, GraduationCap, Lightbulb, Globe, Leaf, Users,
} from 'lucide-react';

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

const API_BASE = (import.meta.env.VITE_API_BASE ?? '').toString().replace(/\/+$/, '');

async function jsonFetch<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { Accept: 'application/json', ...(init?.headers ?? {}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function normalizeRows(rows: any[]): Milestone[] {
  return (rows || []).map((r) => {
    const obj = Object.fromEntries(Object.entries(r).map(([k, v]) => [k.toLowerCase(), v]));
    return {
      id: Number(obj.id),
      year: Number(obj.year),
      title: String(obj.title ?? ''),
      description: String(obj.description ?? ''),
      category: (obj.category ?? null) as string | null,
      era_name: (obj.era_name ?? null) as string | null,
      image_url: (obj.image_url ?? null) as string | null,
      display_order: obj.display_order == null ? null : Number(obj.display_order),
    };
  });
}

const categoryIcons: Record<string, any> = {
  Foundation: Building2, Identity: Award, Campus: Building2, Academic: GraduationCap,
  Technology: Lightbulb, Innovation: Lightbulb, Milestone: Award, International: Globe,
  Sustainability: Leaf, Partnership: Users, Governance: Building2, Recognition: Award,
  'Student Support': Users,
};

const categoryColors: Record<string, string> = {
  Foundation:'from-amber-500 to-orange-600', Identity:'from-purple-500 to-pink-600',
  Campus:'from-blue-500 to-indigo-600', Academic:'from-emerald-500 to-teal-600',
  Technology:'from-cyan-500 to-blue-600', Innovation:'from-violet-500 to-purple-600',
  Milestone:'from-rose-500 to-pink-600', International:'from-sky-500 to-blue-600',
  Sustainability:'from-green-500 to-emerald-600', Partnership:'from-indigo-500 to-purple-600',
  Governance:'from-slate-500 to-gray-600', Recognition:'from-yellow-500 to-amber-600',
  'Student Support':'from-pink-500 to-rose-600',
};

function EventCard({
  milestone, side, onClick,
}: { milestone: Milestone; side: 'left' | 'right'; onClick: () => void }) {
  const IconComponent = categoryIcons[milestone.category ?? ''] || Calendar;
  const colorClass = categoryColors[milestone.category ?? ''] || 'from-blue-500 to-indigo-600';

  return (
    <div
      className="bg-slate-800/95 backdrop-blur-lg rounded-2xl px-6 py-5 border border-slate-700/50 shadow-2xl hover:border-blue-500/50 transition-all duration-200 cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start gap-3">
        {side === 'right' && (
          <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClass} flex-shrink-0`}>
            <IconComponent className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full bg-gradient-to-r ${colorClass} text-white shadow`}>
              {milestone.category}
            </span>
            <span className={`p-1 rounded-md bg-gradient-to-br ${colorClass} text-white/90 inline-flex`}>
              <IconComponent className="w-4 h-4" />
            </span>
          </div>
          <h3 className="font-bold text-white leading-tight">{milestone.title}</h3>
        </div>
        {side === 'left' && (
          <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClass} flex-shrink-0`}>
            <IconComponent className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function NPTimeline() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [collapsedYears, setCollapsedYears] = useState<Set<number>>(new Set());
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await jsonFetch<any[]>(`${API_BASE}/api/milestones?limit=5000`);
        const data = normalizeRows(raw).filter((m) => Number.isFinite(m.year));
        data.sort((a, b) => a.year - b.year || (a.display_order ?? 0) - (b.display_order ?? 0) || a.id - b.id);
        setMilestones(data);
      } catch (e) {
        console.error('Failed to load milestones:', e);
        setMilestones([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const years = useMemo(
    () => [...new Set(milestones.map((m) => m.year))].sort((a, b) => a - b),
    [milestones],
  );

  const getMilestonesForYear = (year: number) =>
    milestones.filter((m) => m.year === year);

  const toggleYear = (year: number) =>
    setCollapsedYears((cur) => {
      const next = new Set(cur);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });

  const Icon = selectedMilestone ? (categoryIcons[selectedMilestone.category ?? ''] || Calendar) : Calendar;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-blue-200 text-lg">Loading Timeline...</p>
        </div>
      </div>
    );
  }

  if (!milestones.length) {
    return (
      <div className="min-h-screen bg-slate-900 text-blue-200 grid place-items-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">No milestones found</h2>
          <p>Try inserting data or adjusting your API filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* top spacing for your fixed nav */}
      <div className="pt-28 md:pt-32 px-6 sm:px-12 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            {/* center spine */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-500/70 via-indigo-500/50 to-pink-500/40 -translate-x-1/2" />

            <div className="space-y-28 md:space-y-32">
              {years.map((year, index) => {
                const items = getMilestonesForYear(year);
                const isCollapsed = collapsedYears.has(year);
                const isLeft = index % 2 === 0;
                const era = (items[0]?.era_name || '').trim();
                const prevEra = index > 0 ? (getMilestonesForYear(years[index - 1])[0]?.era_name || '').trim() : '';
                const showEra = !!era && era !== prevEra;

                return (
                  <div key={year} className="relative">
                    <div className="flex items-start justify-center">
                      {/* LEFT column */}
                      <div className={`w-[44%] ${isLeft ? 'pr-12' : 'invisible'}`}>
                        {isLeft && (
                          <>
                            {/* BIG year label */}
                            <button
                              className={`${
                                isCollapsed ? 'text-blue-300/40 hover:text-blue-300/80' : 'text-yellow-400 hover:text-yellow-300'
                              } text-[88px] sm:text-[112px] md:text-[144px] lg:text-[176px] leading-none font-black tracking-tight mb-8 drop-shadow-[0_2px_0_rgba(0,0,0,0.25)] transition-colors`}
                              onClick={() => toggleYear(year)}
                            >
                              {year}
                            </button>

                            {!isCollapsed && (
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
                            )}
                          </>
                        )}
                      </div>

                      {/* CENTER: era chip anchored to the dot + the dot itself */}
                      <div className="relative z-20 flex-shrink-0">
                        {/* perfectly centered ERA label (if present) */}
{showEra && (
  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 md:mb-7">
    <div className="px-6 md:px-7 py-2.5 md:py-3 rounded-full font-bold text-[15px] md:text-[17px] bg-gradient-to-r from-blue-600 to-purple-600 border-2 border-blue-400/50 text-white shadow-lg whitespace-nowrap">
      {era}
    </div>
  </div>
)}
                        <button
                          className={`w-8 h-8 rounded-full transition-all duration-200 ${
                            isCollapsed
                              ? 'bg-blue-400/70 hover:bg-blue-400 shadow-lg shadow-blue-400/40'
                              : 'bg-yellow-400 ring-4 ring-yellow-400/30 scale-125 shadow-xl shadow-yellow-400/50'
                          }`}
                          onClick={() => toggleYear(year)}
                          aria-label={`Toggle ${year}`}
                        />
                      </div>

                      {/* RIGHT column */}
                      <div className={`w-[44%] ${!isLeft ? 'pl-12' : 'invisible'}`}>
                        {!isLeft && (
                          <>
                            {/* BIG year label */}
                            <button
                              className={`${
                                isCollapsed ? 'text-blue-300/40 hover:text-blue-300/80' : 'text-yellow-400 hover:text-yellow-300'
                              } text-7xl md:text-8xl font-black tracking-tight mb-6 transition-colors`}
                              onClick={() => toggleYear(year)}
                            >
                              {year}
                            </button>

                            {!isCollapsed && (
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
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Detail modal */}
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
              const color = categoryColors[selectedMilestone.category ?? ''] || 'from-blue-500 to-indigo-600';
              const Ico = categoryIcons[selectedMilestone.category ?? ''] || Calendar;
              return (
                <>
                  <div className="flex items-start gap-6 mb-6">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${color} shadow-lg`}>
                      <Ico className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl font-bold text-blue-400">{selectedMilestone.year}</span>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r ${color} text-white`}>
                          {selectedMilestone.category}
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">{selectedMilestone.title}</h2>
                      <p className="text-sm text-blue-400/80 font-medium">{selectedMilestone.era_name}</p>
                    </div>
                  </div>
                  <p className="text-slate-300 leading-relaxed mb-6">{selectedMilestone.description}</p>
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
