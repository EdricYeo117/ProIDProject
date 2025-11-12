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
      className="bg-slate-800/95 backdrop-blur-lg rounded-2xl px-6 py-5 border border-slate-700/50 shadow-2xl hover:border-blue-500/50 transition-all duration-200"
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
  // collapsed years (default: show all)
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

  // Only the years that actually have data
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
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-b border-slate-700/50 shadow-xl">
        <div className="px-8 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Building2 className="w-10 h-10 text-yellow-400" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  NP Timeline
                </h1>
                <p className="text-blue-300 text-sm">1963 - 2024 • Six Decades of Excellence</p>
              </div>
            </div>
            <div className="text-sm text-blue-400/60">Click a year dot or label to collapse/expand that year</div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="pt-32 px-6 sm:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            {/* central spine */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-500/70 via-indigo-500/50 to-pink-500/40 -translate-x-1/2" />

            <div className="space-y-32">
              {years.map((year, index) => {
                const yearMilestones = getMilestonesForYear(year);
                const isCollapsed = collapsedYears.has(year);
                const isLeft = index % 2 === 0;

                return (
                  <div key={year} className="relative">
                    {/* era label on decade start if present */}
                    {year % 10 === 0 && yearMilestones[0]?.era_name && (
                      <div className="absolute left-1/2 -translate-x-1/2 -top-12 z-10">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-bold text-lg shadow-lg border-2 border-blue-400/50 whitespace-nowrap">
                          {yearMilestones[0].era_name}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-center">
                      {/* LEFT column */}
                      <div className={`w-[44%] ${isLeft ? 'pr-10' : 'invisible'}`}>
                        {isLeft && (
                          <>
                            {!isCollapsed ? (
                              <>
                                <button
                                  className="text-5xl md:text-6xl font-extrabold text-yellow-400 mb-4 hover:text-yellow-300"
                                  onClick={() => toggleYear(year)}
                                >
                                  {year}
                                </button>
                                <div className="space-y-3">
                                  {yearMilestones.map((m) => (
                                    <EventCard
                                      key={m.id}
                                      milestone={m}
                                      side="left"
                                      onClick={() => setSelectedMilestone(m)}
                                    />
                                  ))}
                                </div>
                              </>
                            ) : (
                              <button
                                className="inline-block text-5xl md:text-6xl font-extrabold text-blue-300/40 hover:text-blue-300/90"
                                onClick={() => toggleYear(year)}
                              >
                                {year}
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      {/* CENTER dot (no grey empties anymore) */}
                      <button
                        className={[
                          'relative z-20 flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full transition-transform duration-150 transform-gpu',
                          !isCollapsed
                            ? 'bg-yellow-400 ring-4 ring-yellow-400/30 scale-110 shadow-xl shadow-yellow-400/50'
                            : 'bg-blue-400 shadow-lg shadow-blue-400/40',
                        ].join(' ')}
                        onClick={() => toggleYear(year)}
                        aria-label={`Toggle ${year}`}
                      />
                      {/* count badge — bigger */}
                      {yearMilestones.length > 1 && (
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
                          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-blue-600/90 border border-blue-300/40 text-white grid place-items-center text-base md:text-lg font-bold shadow-xl">
                            {yearMilestones.length}
                          </div>
                        </div>
                      )}

                      {/* RIGHT column */}
                      <div className={`w-[44%] ${!isLeft ? 'pl-10' : 'invisible'}`}>
                        {!isLeft && (
                          <>
                            {!isCollapsed ? (
                              <>
                                <button
                                  className="text-5xl md:text-6xl font-extrabold text-yellow-400 mb-4 hover:text-yellow-300"
                                  onClick={() => toggleYear(year)}
                                >
                                  {year}
                                </button>
                                <div className="space-y-3">
                                  {yearMilestones.map((m) => (
                                    <EventCard
                                      key={m.id}
                                      milestone={m}
                                      side="right"
                                      onClick={() => setSelectedMilestone(m)}
                                    />
                                  ))}
                                </div>
                              </>
                            ) : (
                              <button
                                className="inline-block text-5xl md:text-6xl font-extrabold text-blue-300/40 hover:text-blue-300/90"
                                onClick={() => toggleYear(year)}
                              >
                                {year}
                              </button>
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

          <div className="h-32" />
        </div>
      </div>

      {/* Modal */}
      {selectedMilestone && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8 animate-in fade-in duration-200"
          onClick={() => setSelectedMilestone(null)}
        >
          <div
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-slate-700/50 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-6 mb-6">
              <div
                className={`p-4 rounded-2xl bg-gradient-to-br ${
                  categoryColors[selectedMilestone.category ?? ''] || 'from-blue-500 to-indigo-600'
                } shadow-lg`}
              >
                <Icon className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl font-bold text-blue-400">{selectedMilestone.year}</span>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r ${
                      categoryColors[selectedMilestone.category ?? ''] || 'from-blue-500 to-indigo-600'
                    } text-white`}
                  >
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
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
