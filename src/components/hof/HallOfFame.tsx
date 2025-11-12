import React, { useEffect, useMemo, useState } from "react";
import { Users, GraduationCap, Award, Trophy } from "lucide-react";
import type { School, HofCard, PersonDetails } from "./types";
import { fetchSchools, fetchHof, fetchPerson } from "./api";
import PersonCard from "./PersonCard";

const colors = {
  npBlue: "#003D5C",
  npGold: "#FFB81C",
  npWhite: "#FFFFFF",
  npBlack: "#1A1A1A",
};

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

  // school color lookup by school_name
  const schoolColorByName = useMemo(() => {
    const m = new Map<string, string | undefined>();
    schools.forEach((s) => m.set(s.name, s.color ?? undefined));
    return m;
  }, [schools]);

  // build list for chips: single "All Schools" + deduped schools
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
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${colors.npBlue} 0%, #005580 100%)` }}>
      {/* Header */}
      <div style={{ background: colors.npWhite, padding: "2rem", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <h1
            style={{
              fontSize: "2.5rem", fontWeight: "bold", color: colors.npBlue, marginBottom: 8,
              display: "flex", alignItems: "center", gap: 16,
            }}
          >
            <Users size={40} /> Hall of Fame
          </h1>
          <p style={{ color: colors.npBlack, opacity: 0.7 }}>Celebrating Excellence at Ngee Ann Polytechnic</p>
        </div>
      </div>

      {/* Segment Tabs */}
      <div style={{ background: colors.npWhite, borderBottom: `3px solid ${colors.npGold}` }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex" }}>
          {segments.map((segment) => {
            const Icon = segment.icon;
            const active = activeSegment === segment.id;
            return (
              <button
                key={`seg-${segment.id}`}
                onClick={() => setActiveSegment(segment.id)}
                style={{
                  flex: 1, padding: "1.5rem",
                  background: active ? colors.npBlue : "transparent",
                  color: active ? colors.npWhite : colors.npBlue,
                  border: "none", cursor: "pointer", fontSize: "1.1rem", fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  borderBottom: active ? `4px solid ${colors.npGold}` : "none",
                }}
              >
                <Icon size={24} />
                {segment.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* School Filter */}
      <div style={{ maxWidth: 1400, margin: "2rem auto", padding: "0 1rem" }}>
        <div style={{ background: colors.npWhite, borderRadius: 12, padding: "1.5rem", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <h3 style={{ color: colors.npBlue, marginBottom: 16, fontSize: "1.2rem" }}>Filter by School</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {displaySchools.map((s) => (
              <button
                key={`school-${s.id}`}
                onClick={() => setSelectedSchool(s.id)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 20,
                  border: selectedSchool === s.id ? `2px solid ${colors.npGold}` : "2px solid transparent",
                  background: selectedSchool === s.id ? (s.color ?? "#f5f5f5") : "#f5f5f5",
                  color: selectedSchool === s.id ? colors.npBlack : "#666",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: selectedSchool === s.id ? 600 : 400,
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1400, margin: "0 auto 3rem", padding: "0 1rem" }}>
        {loading ? (
          <div
            style={{
              background: colors.npWhite, borderRadius: 16, padding: "3rem",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)", textAlign: "center", color: colors.npBlue,
            }}
          >
            Loading…
          </div>
        ) : cards.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
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
          <div style={{ background: colors.npWhite, borderRadius: 16, padding: "3rem", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", textAlign: "center" }}>
            <p style={{ fontSize: "1.5rem", color: colors.npBlue }}>No entries found for this selection</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HallOfFame;
