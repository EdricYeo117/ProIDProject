// src/components/hof/HallOfFame.tsx
import React, { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Users, GraduationCap, Award, Trophy } from "lucide-react";
import type { School, HofCard, PersonDetails } from "./types";
import { fetchSchools, fetchHof, fetchPerson } from "./HallOfFameAPI";
import PersonCard from "./PersonCard";

const segments = [
  { id: "alumni", name: "Distinguished Alumni", icon: GraduationCap },
  { id: "staff", name: "Outstanding Staff", icon: Award },
  { id: "students", name: "Exemplary Students", icon: Trophy },
];

const HallOfFame: React.FC = () => {
  const [activeSegment, setActiveSegment] = useState<string>("students");
  const [selectedSchool, setSelectedSchool] = useState<string>("all");
  const [schools, setSchools] = useState<School[]>([]);
  const [cards, setCards] = useState<HofCard[]>([]);
  const [loading, setLoading] = useState(false);

  // independent expansion per card index
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
  const [detailsMap, setDetailsMap] = useState<
    Record<number, PersonDetails | undefined>
  >({});

  // load schools once and normalize
  useEffect(() => {
    fetchSchools()
      .then((list) => {
        const normalized = (Array.isArray(list) ? list : [])
          .map((s: any) => ({
            id: String(s.id ?? s.school_id ?? ""),
            name: String(s.name ?? s.school_name ?? ""),
            color: s.color ?? s.color_code ?? undefined,
          }))
          .filter((s: School) => !!s.id && !!s.name);
        setSchools(normalized);
      })
      .catch(() => setSchools([]));
  }, []);

  // color lookup by school_name
  const schoolColorByName = useMemo(() => {
    const m = new Map<string, string | undefined>();
    schools.forEach((s) => m.set(s.name, s.color ?? undefined));
    return m;
  }, [schools]);

  // chips list
  const displaySchools = useMemo<School[]>(() => {
    const map = new Map<string, School>();
    map.set("all", { id: "all", name: "All Schools", color: "#003D5C" });
    for (const s of schools) map.set(s.id, s);
    return Array.from(map.values());
  }, [schools]);

  // fetch cards on filter change
  useEffect(() => {
    setLoading(true);
    setExpandedMap({});
    setDetailsMap({});

    const schoolParam = selectedSchool === "all" ? undefined : selectedSchool;

    fetchHof({
      category: activeSegment,
      school: schoolParam,
      featuredOnly: false,
    })
      .then((data) => setCards(Array.isArray(data) ? data : []))
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  }, [activeSegment, selectedSchool]);

  // if selectedSchool becomes invalid after a refresh, reset to "all"
  useEffect(() => {
    if (
      selectedSchool !== "all" &&
      !schools.some((s) => s.id === selectedSchool)
    ) {
      setSelectedSchool("all");
    }
  }, [schools, selectedSchool]);

  // toggle by card index; fetch details by personId
  const toggle = async (cardIndex: number, personIdRaw: number | string) => {
    const personId = Number(personIdRaw);
    setExpandedMap((prev) => ({
      ...prev,
      [cardIndex]: !prev[cardIndex],
    }));

    if (!detailsMap[cardIndex] && personId) {
      try {
        const d = await fetchPerson(personId);
        setDetailsMap((prev) => ({ ...prev, [cardIndex]: d }));
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003D5C] to-[#005580]">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
              Ngee Ann Polytechnic
            </span>
            <h1 className="mt-1 text-3xl font-extrabold text-[#003D5C]">
              Hall of Fame
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-xl">
              Celebrating inspiring stories of students, alumni, and staff who
              embody the NP spirit.
            </p>
          </div>
          <div
            className="hidden items-center gap-2 rounded-full border border-[#003D5C]/10 bg-slate-50 px-4 py-2 text-sm font-semibold text-[#003D5C] shadow-sm md:flex"
            aria-hidden="true"
          >
            <Users size={32} />
            <span>Celebrating Excellence</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b-4 border-[#FFB81C] bg-white">
        <nav
          className="mx-auto flex max-w-6xl divide-x divide-slate-100"
          aria-label="Achievement categories"
        >
          {segments.map((segment) => {
            const Icon = segment.icon;
            const active = activeSegment === segment.id;
            return (
              <button
                type="button"
                key={`seg-${segment.id}`}
                className={[
                  "flex flex-1 items-center justify-center gap-2 px-4 py-4 text-sm font-bold uppercase tracking-wide transition-colors",
                  active
                    ? "bg-[#003D5C] text-white border-b-4 border-b-[#FFB81C]"
                    : "bg-transparent text-[#003D5C] hover:bg-slate-50",
                ].join(" ")}
                onClick={() => setActiveSegment(segment.id)}
                aria-pressed={active}
              >
                <Icon size={20} />
                <span>{segment.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Filter chips */}
      <section
        className="mx-auto mt-8 max-w-6xl px-4"
        aria-label="Filter by school"
      >
        <div className="rounded-2xl bg-white p-4 shadow-lg shadow-black/10">
          <h3 className="mb-3 text-base font-semibold text-[#003D5C]">
            Filter by School
          </h3>
          <div className="flex flex-wrap gap-2">
            {displaySchools.map((s) => {
              const selected = selectedSchool === s.id;
              const style: CSSProperties | undefined =
                selected && s.color
                  ? { backgroundColor: s.color, borderColor: s.color }
                  : undefined;

              return (
                <button
                  type="button"
                  key={`school-${s.id}`}
                  className={[
                    "rounded-full border-2 px-4 py-1.5 text-xs font-semibold tracking-wide transition-colors",
                    selected
                      ? "text-[#1A1A1A] shadow-sm"
                      : "bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200",
                  ].join(" ")}
                  onClick={() => setSelectedSchool(s.id)}
                  style={style}
                  aria-pressed={selected}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Grid / Loading / Empty */}
      <main className="mx-auto mb-12 mt-6 max-w-6xl px-4">
        <div aria-live="polite">
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-full max-w-xl rounded-2xl bg-white p-10 text-center text-[#003D5C] shadow-xl shadow-black/30">
                <div className="inline-flex items-center gap-3 font-bold tracking-wide">
                  <span>Loading</span>
                  <span
                    aria-hidden="true"
                    className="flex items-center gap-1"
                  >
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#003D5C]" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#003D5C] delay-150" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#003D5C] delay-300" />
                  </span>
                </div>
              </div>
            </div>
          ) : cards.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cards.map((p, index) => {
                const personId = p.person_id;
                return (
                  <PersonCard
                    key={`person-card-${index}`}
                    person={p}
                    schoolColor={schoolColorByName.get(p.school_name)}
                    expanded={!!expandedMap[index]}
                    details={detailsMap[index]}
                    onToggle={() => toggle(index, personId)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <div className="w-full max-w-xl rounded-2xl bg-white p-10 text-center text-[#003D5C] shadow-xl shadow-black/30">
                No entries found for this selection
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HallOfFame;
