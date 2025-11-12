// src/components/timeline/NPTimeline.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Award, Building2, GraduationCap, Lightbulb, Globe, Leaf, Users } from 'lucide-react';

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

const API_BASE = (import.meta.env.VITE_API_BASE ?? '').toString().replace(/\/+$/,'');

async function jsonFetch<T=any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { Accept: 'application/json', ...(init?.headers ?? {}) }});
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// icons/colors as in your file:
const categoryIcons: Record<string, any> = {
  Foundation: Building2, Identity: Award, Campus: Building2, Academic: GraduationCap,
  Technology: Lightbulb, Innovation: Lightbulb, Milestone: Award, International: Globe,
  Sustainability: Leaf, Partnership: Users, Governance: Building2, Recognition: Award,
  'Student Support': Users,
};
const categoryColors: Record<string,string> = {
  Foundation:'from-amber-500 to-orange-600', Identity:'from-purple-500 to-pink-600',
  Campus:'from-blue-500 to-indigo-600', Academic:'from-emerald-500 to-teal-600',
  Technology:'from-cyan-500 to-blue-600', Innovation:'from-violet-500 to-purple-600',
  Milestone:'from-rose-500 to-pink-600', International:'from-sky-500 to-blue-600',
  Sustainability:'from-green-500 to-emerald-600', Partnership:'from-indigo-500 to-purple-600',
  Governance:'from-slate-500 to-gray-600', Recognition:'from-yellow-500 to-amber-600',
  'Student Support':'from-pink-500 to-rose-600',
};

export default function NPTimeline() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [hoveredYear, setHoveredYear] = useState<number|null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone|null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch from API
  useEffect(() => {
    (async () => {
      try {
        // pull everything; you can add query params (fromYear, toYear, category…) if needed
        const data = await jsonFetch<Milestone[]>(`${API_BASE}/api/milestones?limit=5000`);
        // sort defensively
        data.sort((a,b) => a.year - b.year || (a.display_order ?? 0) - (b.display_order ?? 0) || a.id - b.id);
        setMilestones(data);
      } catch (e) {
        console.error('Failed to load milestones:', e);
        setMilestones([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const years = useMemo(() => [...new Set(milestones.map(m => m.year))].sort((a,b) => a-b), [milestones]);
  const minYear = years.length ? years[0] : 1963;
  const maxYear = years.length ? years[years.length-1] : new Date().getFullYear();
  const allYears = useMemo(() => Array.from({ length: maxYear-minYear+1 }, (_,i)=>minYear+i), [minYear,maxYear]);

  const getMilestonesForYear = (year:number) => milestones.filter(m => m.year === year);
  const Icon = selectedMilestone ? (categoryIcons[selectedMilestone.category ?? ''] || Calendar) : Calendar;

  // … keep the rest of your JSX exactly as you have it …
  // (No changes to the beautiful UI needed; it will now render DB rows.)
  
  // For brevity, omit the unchanged big JSX here:
  // Paste your existing JSX body below this line (loading state, header, vertical timeline, modal).
  // Only the data source changed.

  // ----- BEGIN of your existing render (unchanged) -----
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-200 text-lg">Loading Timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Fixed Header */}
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
            <div className="text-sm text-blue-400/60">
              Hover or click years to explore
            </div>
          </div>
        </div>
      </div>

      {/* Main Timeline - Vertical Layout */}
      <div className="pt-32 px-12">
        <div className="max-w-5xl mx-auto">
          {/* Vertical Timeline */}
          <div className="relative">
            {/* Central Vertical Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 -translate-x-1/2"></div>

            {/* Year Markers */}
            <div className="space-y-32">
              {allYears.map((year, index) => {
                const yearMilestones = getMilestonesForYear(year);
                const hasEvents = yearMilestones.length > 0;
                const isHovered = hoveredYear === year;
                const isLeft = index % 2 === 0;

                return (
                  <div key={year} className="relative">
                    {/* Era Label for Decade Starts */}
                    {year % 10 === 0 && yearMilestones[0]?.era_name && (
                      <div className="absolute left-1/2 -translate-x-1/2 -top-12 z-10">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-bold text-lg shadow-lg border-2 border-blue-400/50 whitespace-nowrap">
                          {yearMilestones[0].era_name}
                        </div>
                      </div>
                    )}

                    {/* Timeline Node */}
                    <div className="flex items-center justify-center">
                      {/* Left Side Content */}
                      <div className={`w-5/12 ${isLeft ? 'text-right pr-12' : ''}`}>
                        {isLeft && hasEvents && !isHovered && (
                          <div className="inline-block">
                            <div className="text-4xl font-bold text-blue-400/30 hover:text-blue-400 transition-all duration-300 cursor-pointer"
                              onMouseEnter={() => setHoveredYear(year)}>
                              {year}
                            </div>
                          </div>
                        )}
                        {isLeft && isHovered && hasEvents && (
                          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-3">
                              {yearMilestones.map((milestone, idx) => {
                                const IconComponent = categoryIcons[milestone.category] || Calendar;
                                const colorClass = categoryColors[milestone.category] || 'from-blue-500 to-indigo-600';
                                
                                return (
                                  <div
                                    key={idx}
                                    className="bg-slate-800/95 backdrop-blur-lg rounded-xl p-5 shadow-2xl border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 cursor-pointer group hover:scale-105"
                                    onClick={() => setSelectedMilestone(milestone)}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2 justify-end">
                                          <span className={`text-xs font-medium px-2 py-1 rounded-full bg-gradient-to-r ${colorClass} text-white`}>
                                            {milestone.category}
                                          </span>
                                        </div>
                                        <h3 className="font-bold text-white mb-1 text-base leading-tight group-hover:text-blue-300 transition-colors">
                                          {milestone.title}
                                        </h3>
                                      </div>
                                      <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClass} flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                        <IconComponent className="w-5 h-5 text-white" />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Center Dot */}
                      <div className="relative z-20 flex-shrink-0">
                        <div
                          className={`rounded-full transition-all duration-300 cursor-pointer ${
                            hasEvents
                              ? isHovered
                                ? 'w-8 h-8 bg-yellow-400 shadow-xl shadow-yellow-400/50 ring-4 ring-yellow-400/30'
                                : 'w-5 h-5 bg-blue-400 shadow-lg shadow-blue-400/40 hover:w-7 hover:h-7'
                              : 'w-3 h-3 bg-slate-600'
                          }`}
                          onMouseEnter={() => hasEvents && setHoveredYear(year)}
                          onMouseLeave={() => setHoveredYear(null)}
                        />
                        {hasEvents && yearMilestones.length > 1 && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <div className="bg-blue-500/30 text-blue-200 text-xs px-2 py-1 rounded-full border border-blue-400/50">
                              {yearMilestones.length}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Side Content */}
                      <div className={`w-5/12 ${!isLeft ? 'text-left pl-12' : ''}`}>
                        {!isLeft && hasEvents && !isHovered && (
                          <div className="inline-block">
                            <div className="text-4xl font-bold text-blue-400/30 hover:text-blue-400 transition-all duration-300 cursor-pointer"
                              onMouseEnter={() => setHoveredYear(year)}>
                              {year}
                            </div>
                          </div>
                        )}
                        {!isLeft && isHovered && hasEvents && (
                          <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="space-y-3">
                              {yearMilestones.map((milestone, idx) => {
                                const IconComponent = categoryIcons[milestone.category] || Calendar;
                                const colorClass = categoryColors[milestone.category] || 'from-blue-500 to-indigo-600';
                                
                                return (
                                  <div
                                    key={idx}
                                    className="bg-slate-800/95 backdrop-blur-lg rounded-xl p-5 shadow-2xl border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 cursor-pointer group hover:scale-105"
                                    onClick={() => setSelectedMilestone(milestone)}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClass} flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                        <IconComponent className="w-5 h-5 text-white" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className={`text-xs font-medium px-2 py-1 rounded-full bg-gradient-to-r ${colorClass} text-white`}>
                                            {milestone.category}
                                          </span>
                                        </div>
                                        <h3 className="font-bold text-white mb-1 text-base leading-tight group-hover:text-blue-300 transition-colors">
                                          {milestone.title}
                                        </h3>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Spacer */}
          <div className="h-32"></div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedMilestone && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8 animate-in fade-in duration-300"
          onClick={() => setSelectedMilestone(null)}
        >
          <div 
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-slate-700/50 animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-6 mb-6">
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${categoryColors[selectedMilestone.category] || 'from-blue-500 to-indigo-600'} shadow-lg`}>
                <Icon className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl font-bold text-blue-400">{selectedMilestone.year}</span>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r ${categoryColors[selectedMilestone.category]} text-white`}>
                    {selectedMilestone.category}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {selectedMilestone.title}
                </h2>
                <p className="text-sm text-blue-400/80 font-medium">
                  {selectedMilestone.era_name}
                </p>
              </div>
            </div>
            
            <p className="text-slate-300 leading-relaxed mb-6">
              {selectedMilestone.description}
            </p>

            <button
              onClick={() => setSelectedMilestone(null)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-blue-500/50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
  // ----- END render -----
}

