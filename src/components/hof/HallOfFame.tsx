// src/components/hof/HallOfFame.tsx
import React, { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Users, GraduationCap, Award, Trophy, Handshake } from "lucide-react";
import type { School, HofCard, PersonDetails } from "./types";
import { fetchSchools, fetchHof, fetchPerson } from "./HallOfFameAPI";
import PersonCard from "./PersonCard";

const segments = [
  { id: "alumni", name: "Distinguished Alumni", icon: GraduationCap },
  { id: "staff", name: "Outstanding Staff", icon: Award },
  { id: "students", name: "Exemplary Students", icon: Trophy },
  { id: "community", name: "Community Honourees", icon: Handshake }, // new
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

  function pickTextColor(bg?: string) {
    if (!bg) return "#ffffff";
    const hex = bg.replace("#", "").trim();
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    if (full.length !== 6) return "#ffffff";

    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);

    // perceived luminance
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return lum > 0.6 ? "#111111" : "#ffffff";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003D5C] to-[#005580]">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-6 md:py-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
              Ngee Ann Polytechnic
            </span>
            <h1 className="mt-1 text-2xl md:text-3xl font-extrabold text-[#003D5C]">
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
          className="mx-auto max-w-6xl px-0"
          aria-label="Achievement categories"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-100">
            {segments.map((segment) => {
              const Icon = segment.icon;
              const active = activeSegment === segment.id;

              return (
                <button
                  type="button"
                  key={`seg-${segment.id}`}
                  className={[
                    "min-w-0 flex items-center justify-center gap-2 px-3 py-3 md:px-4 md:py-4",
                    "text-[11px] md:text-sm font-bold uppercase tracking-wide transition-colors",
                    "text-center leading-snug border-b-4",
                    active
                      ? "bg-[#003D5C] text-white border-b-[#FFB81C]"
                      : "bg-white text-[#003D5C] hover:bg-slate-50 border-b-transparent",
                  ].join(" ")}
                  onClick={() => setActiveSegment(segment.id)}
                  aria-pressed={active}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="min-w-0 break-words">{segment.name}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Filter chips */}
      <section
        className="mx-auto mt-6 md:mt-8 max-w-6xl px-4"
        aria-label="Filter by school"
      >
        <div className="rounded-2xl bg-white p-4 shadow-lg shadow-black/10">
          <h3 className="mb-3 text-base font-semibold text-[#003D5C]">
            Filter by School
          </h3>

          {/* mobile: horizontal scroll; md+: wrap */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 md:flex-wrap md:overflow-visible md:pb-0 md:mx-0 md:px-0">
            {displaySchools.map((s) => {
              const selected = selectedSchool === s.id;
              const bg = selected ? (s.color ?? "#003D5C") : undefined;

              const style: CSSProperties | undefined = selected
                ? {
                    backgroundColor: bg,
                    borderColor: bg,
                    color: pickTextColor(bg),
                  }
                : undefined;

              return (
                <button
                  type="button"
                  key={`school-${s.id}`}
                  className={[
                    "rounded-full border-2 px-4 py-1.5 text-xs font-semibold tracking-wide transition-colors",
                    selected
                      ? "text-white shadow-sm"
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
                  <span aria-hidden="true" className="flex items-center gap-1">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#003D5C]" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#003D5C] delay-150" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#003D5C] delay-300" />
                  </span>
                </div>
              </div>
            </div>
          ) : cards.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
