import React from "react";
import {
  Award, Users, GraduationCap, Trophy,
  ChevronDown, ChevronUp, Briefcase, Star, BookOpen
} from "lucide-react";
import type { HofCard, PersonDetails } from "./types";

const colors = {
  npBlue: "#003D5C",
  npGold: "#FFB81C",
  npWhite: "#FFFFFF",
};

const typeIconMap: Record<string, React.ComponentType<any>> = {
  "Director's List": Award,
  Internship: Briefcase,
  "GPA Excellence": Star,
  "Competition Award": Trophy,
  "Research Project": BookOpen,
  "CCA Leadership": Users,
  Scholarship: Award,
  "Career Achievement": Briefcase,
  Entrepreneurship: Star,
  "Community Service": Users,
  "Professional Awards": Award,
  Publications: BookOpen,
  "Teaching Excellence": Award,
  "Research Achievement": BookOpen,
  "Years of Service": Award,
  Mentorship: Users,
  "Innovation in Education": Star,
};

type Props = {
  person: HofCard;
  schoolColor?: string;
  expanded: boolean;
  details?: PersonDetails;
  onToggle: (id: number) => void;
};

const PersonCard: React.FC<Props> = ({ person, schoolColor, expanded, details, onToggle }) => {
  const border = schoolColor ?? colors.npGold;

  return (
    <div style={{
      background: colors.npWhite,
      borderRadius: "16px",
      padding: "2rem",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      border: `2px solid ${border}`,
      height: "fit-content",
    }}>
      {/* avatar + header */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{
          fontSize: "4rem",
          background: `linear-gradient(135deg, ${colors.npBlue}, ${border})`,
          width: 100, height: 100, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1rem", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
        }}>
          {person.profile_image_url ? "🖼️" : "👤"}
        </div>

        <h3 style={{ fontSize: "1.5rem", color: colors.npBlue, marginBottom: 4, fontWeight: "bold" }}>
          {person.full_name}
        </h3>

        <div style={{
          display: "inline-block",
          background: border,
          color: colors.npBlue,
          padding: "0.35rem 1rem",
          borderRadius: 15,
          fontSize: "0.85rem",
          fontWeight: 600,
          marginBottom: 8
        }}>
          {person.school_name}
        </div>

        <p style={{ fontSize: "0.95rem", color: "#555", fontStyle: "italic", lineHeight: 1.4 }}>
          {person.bio}
        </p>
      </div>

      {/* count badge */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 8, background: "#f0f7ff", padding: "0.5rem 1rem",
        borderRadius: 20, marginBottom: 12, border: `1.5px solid ${colors.npBlue}`
      }}>
        <Trophy size={16} color={colors.npBlue} />
        <span style={{ fontWeight: 600, color: colors.npBlue, fontSize: "0.9rem" }}>
          {Number(person.achievement_count) || 0} Achievement{Number(person.achievement_count) === 1 ? "" : "s"}
        </span>
      </div>

      {/* preview / details */}
      <div style={{ marginBottom: 12 }}>
        {expanded && details?.achievements?.length
          ? details.achievements.map((a) => {
              const Icon = (a.type && typeIconMap[a.type]) || Star;
              return (
                <div key={a.achievement_id} style={{
                  background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                  padding: "0.75rem",
                  borderRadius: 8,
                  marginBottom: 8,
                  border: `1.5px solid ${colors.npGold}`,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{
                      background: colors.npBlue, borderRadius: "50%", padding: 8,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                    }}>
                      <Icon size={16} color={colors.npWhite} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ color: colors.npBlue, fontSize: "0.95rem", fontWeight: 600, marginBottom: 4 }}>
                        {a.title}
                      </h4>
                      {a.description && (
                        <p style={{ color: "#666", fontSize: "0.85rem", marginBottom: 4, lineHeight: 1.3 }}>
                          {a.description}
                        </p>
                      )}
                      <span style={{
                        display: "inline-block", background: colors.npGold, color: colors.npBlue,
                        padding: "0.15rem 0.5rem", borderRadius: 10, fontSize: "0.75rem", fontWeight: 600
                      }}>
                        {a.year || a.semester || a.date || a.type}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          : person.top_achievement && (
              <div style={{
                background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                padding: "0.75rem", borderRadius: 8, border: `1.5px solid ${colors.npGold}`,
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{
                    background: colors.npBlue, borderRadius: "50%", padding: 8,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    <Star size={16} color={colors.npWhite} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ color: colors.npBlue, fontSize: "0.95rem", fontWeight: 600, marginBottom: 4 }}>
                      {person.top_achievement}
                    </h4>
                  </div>
                </div>
              </div>
            )}
      </div>

      <button
        onClick={() => onToggle(person.person_id)}
        style={{
          width: "100%", padding: "0.6rem", background: colors.npBlue,
          color: colors.npWhite, border: "none", borderRadius: 8,
          fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }}
      >
        {expanded ? <>Show Less <ChevronUp size={18} /></> : <>Show Full Profile <ChevronDown size={18} /></>}
      </button>
    </div>
  );
};

export default PersonCard;
