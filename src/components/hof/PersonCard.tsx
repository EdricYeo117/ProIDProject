import React, { type CSSProperties } from "react";
import {
  Award, Users, GraduationCap, Trophy,
  ChevronDown, ChevronUp, Briefcase, Star, BookOpen
} from "lucide-react";
import type { HofCard, PersonDetails } from "./types";
import "./PersonCard.css";

const colors = {
  npBlue: "#003D5C",
  npGold: "#FFB81C",
  npWhite: "#FFFFFF",
};

const typeIconMap: Record<string, React.ComponentType<any>> = {
  "Director's List": Award,
  Internship: Briefcase,
  "GPA Excellence": GraduationCap,
  "Competition Award": Trophy,
  "Research Project": BookOpen,
  "CCA Leadership": Users,
  Scholarship: GraduationCap,
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

const getInitials = (name?: string | null) => {
  if (!name) return "NP";
  const parts = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk.charAt(0).toUpperCase());
  return parts.join("") || "NP";
};

const PersonCard: React.FC<Props> = ({ person, schoolColor, expanded, details, onToggle }) => {
  const border = schoolColor ?? colors.npGold;
  const accentStyles: CSSProperties = { borderColor: border };
  (accentStyles as Record<string, string | number>)["--card-accent"] = border;
  const achievements = expanded ? details?.achievements : undefined;
  const totalAchievements = Number(person.achievement_count) || 0;
  const hasAchievements = !!achievements?.length;

  return (
    <article
      className="person-card"
      style={accentStyles}
      aria-label={`${person.full_name} profile card`}
    >
      <header className="person-card__header">
        <div className="person-avatar" aria-hidden="true">
          {person.profile_image_url ? (
            <img src={person.profile_image_url} alt="" loading="lazy" />
          ) : (
            <span>{getInitials(person.full_name)}</span>
          )}
        </div>
        <h3 className="person-card__name">{person.full_name}</h3>
        <span className="person-card__school">{person.school_name}</span>
        {person.bio && <p className="person-card__bio">{person.bio}</p>}
      </header>

      <div className="person-card__stats">
        <Trophy size={16} />
        {totalAchievements} Achievement{totalAchievements === 1 ? "" : "s"}
      </div>

      <div className="achievement-list" aria-live={expanded ? "polite" : "off"}>
        {hasAchievements
          ? achievements!.map((a) => {
              const Icon = (a.type && typeIconMap[a.type]) || Star;
              const meta = a.year || a.semester || a.date || a.type;
              return (
                <div className="achievement-card" key={a.achievement_id}>
                  <span className="achievement-icon">
                    <Icon size={18} />
                  </span>
                  <div className="achievement-content">
                    <h4>{a.title}</h4>
                    {a.description && <p>{a.description}</p>}
                    {meta && <span className="achievement-meta">{meta}</span>}
                  </div>
                </div>
              );
            })
          : person.top_achievement && (
              <div className="achievement-card" key={`${person.person_id}-top`}>
                <span className="achievement-icon">
                  <Star size={18} />
                </span>
                <div className="achievement-content">
                  <h4>{person.top_achievement}</h4>
                </div>
              </div>
            )}
      </div>

      <button
        type="button"
        className="person-card__toggle"
        onClick={() => onToggle(person.person_id)}
        aria-expanded={expanded}
      >
        {expanded ? (
          <>
            Show Less <ChevronUp size={18} />
          </>
        ) : (
          <>
            Show Full Profile <ChevronDown size={18} />
          </>
        )}
      </button>
    </article>
  );
};

export default PersonCard;
