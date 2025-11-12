import React, { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Users, GraduationCap, Award, Trophy } from "lucide-react";
import type { School, HofCard, PersonDetails } from "./types";
import { fetchSchools, fetchHof, fetchPerson } from "./api";
import PersonCard from "./PersonCard";
import "./HallOfFame.css";

const segments = [
  { id: "alumni", name: "Distinguished Alumni", icon: GraduationCap },
  { id: "staff", name: "Outstanding Staff", icon: Award },
  { id: "students", name: "Exemplary Students", icon: Trophy },
];

const HallOfFame: React.FC = () => {
  const [activeSegment, setActiveSegment] = useState<string>("students");
  const [selectedSchool, setSelectedSchool] = useState<string>("all");
  const [schools, setSchools] = useState<School[]>([]); // real schools only
  const [cards, setCards] = useState<HofCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [detailsMap, setDetailsMap] = useState<Record<number, PersonDetails | undefined>>({});

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
      .catch(() => {
        // keep empty → "All Schools" still available via displaySchools
      });
  }, []);

  // color lookup by school_name
  const schoolColorByName = useMemo(() => {
    const m = new Map<string, string | undefined>();
    schools.forEach((s) => m.set(s.name, s.color ?? undefined));
    return m;
  }, [schools]);

  // chips list: "All Schools" + unique schools
  const displaySchools = useMemo<School[]>(() => {
    const map = new Map<string, School>();
    map.set("all", { id: "all", name: "All Schools", color: "#003D5C" });
    for (const s of schools) map.set(s.id, s);
    return Array.from(map.values());
  }, [schools]);

  // fetch cards on filter change
  useEffect(() => {
    setLoading(true);
    setExpanded({});
    setDetailsMap({});
    const schoolParam = selectedSchool === "all" ? undefined : selectedSchool;

    fetchHof({ category: activeSegment, school: schoolParam, featuredOnly: false })
      .then((data) => setCards(Array.isArray(data) ? data : []))
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  }, [activeSegment, selectedSchool]);

  // if selectedSchool becomes invalid after a refresh, reset to "all"
  useEffect(() => {
    if (selectedSchool !== "all" && !schools.some((s) => s.id === selectedSchool)) {
      setSelectedSchool("all");
    }
  }, [schools, selectedSchool]);

  const toggle = async (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    if (!detailsMap[id]) {
      try {
        const d = await fetchPerson(id);
        setDetailsMap((prev) => ({ ...prev, [id]: d }));
      } catch {
        // ignore fetch error for details
      }
    }
  };

  return (
    <div className="hof-page">
      {/* Header */}
      <header className="hof-header">
        <div className="hof-header__content">
          <div className="hof-header__text">
            <span className="hof-kicker">Ngee Ann Polytechnic</span>
            <h1 className="hof-title">Hall of Fame</h1>
            <p className="hof-subtitle">
              Celebrating inspiring stories of students, alumni, and staff who embody the NP spirit.
            </p>
          </div>
          <div className="hof-header__emblem" aria-hidden="true">
            <Users size={40} />
            <span>Celebrating Excellence</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="hof-tabs-wrapper">
        <nav className="hof-tabs" aria-label="Achievement categories">
          {segments.map((segment) => {
            const Icon = segment.icon;
            const active = activeSegment === segment.id;
            return (
              <button
                type="button"
                key={`seg-${segment.id}`}
                className={`hof-tab${active ? " is-active" : ""}`}
                onClick={() => setActiveSegment(segment.id)}
                aria-pressed={active}
              >
                <Icon size={22} />
                <span>{segment.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Filter chips */}
      <section className="hof-filter" aria-label="Filter by school">
        <div className="hof-filter__panel">
          <h3>Filter by School</h3>
          <div className="hof-chip-list">
            {displaySchools.map((s) => {
              const selected = selectedSchool === s.id;
              const style =
                selected && s.color
                  ? ({ ["--chip-accent" as any]: s.color } as CSSProperties)
                  : undefined;
              return (
                <button
                  type="button"
                  key={`school-${s.id}`}
                  className={`hof-chip${selected ? " is-active" : ""}`}
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
      <main className="hof-main">
        <div className="hof-grid-wrapper" aria-live="polite">
          {loading ? (
            <div className="hof-feedback-card">
              <div className="hof-loading">
                <span>Loading</span>
                <span aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            </div>
          ) : cards.length ? (
            <div className="hof-grid">
              {cards.map((p) => (
                <PersonCard
                  key={`person-${p.person_id}`}
                  person={p}
                  schoolColor={schoolColorByName.get(p.school_name)}
                  expanded={!!expanded[p.person_id]}
                  details={detailsMap[p.person_id]}
                  onToggle={toggle}
                />
              ))}
            </div>
          ) : (
            <div className="hof-feedback-card">No entries found for this selection</div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HallOfFame;
