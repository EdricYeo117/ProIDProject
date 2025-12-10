// src/components/hof/PersonCard.tsx
import React, { type CSSProperties } from "react";
import {
  Award,
  Users,
  GraduationCap,
  Trophy,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Star,
  BookOpen,
} from "lucide-react";
import type { HofCard, PersonDetails } from "./types";
import CommentsSection from "./CommentsSection";

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
  onToggle: () => void;
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

const PersonCard: React.FC<Props> = ({
  person,
  schoolColor,
  expanded,
  details,
  onToggle,
}) => {
  const border = schoolColor ?? colors.npGold;
  const cardStyle: CSSProperties = { borderColor: border };

  const achievements = expanded ? details?.achievements : undefined;
  const totalAchievements = Number(person.achievement_count) || 0;
  const hasAchievements = !!achievements?.length;

  return (
    <article
      className="relative flex w-full flex-col gap-4 rounded-3xl border-2 bg-white p-7 shadow-[0_20px_44px_rgba(0,24,39,0.14)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_26px_56px_rgba(0,24,39,0.2)]"
      style={cardStyle}
      aria-label={`${person.full_name} profile card`}
    >
      {/* Header */}
      <header className="flex flex-col items-center gap-3 text-center">
        <div
          className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full text-2xl font-semibold tracking-[0.04em] text-white shadow-[0_18px_32px_rgba(0,24,39,0.28)]"
          aria-hidden="true"
          style={{
            backgroundImage: `linear-gradient(140deg, ${colors.npBlue}, ${border})`,
          }}
        >
          {person.profile_image_url ? (
            <img
              src={person.profile_image_url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{getInitials(person.full_name)}</span>
          )}
        </div>

        <h3 className="m-0 text-xl font-bold text-[#003D5C]">
          {person.full_name}
        </h3>

        <span className="inline-flex items-center justify-center rounded-full bg-[#FFB81C] px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#003D5C] shadow-[0_12px_20px_rgba(255,184,28,0.28)]">
          {person.school_name}
        </span>

        {person.bio && (
          <p className="m-0 text-sm leading-relaxed text-black/70">
            {person.bio}
          </p>
        )}
      </header>

      {/* Stats */}
      <div className="mx-auto inline-flex items-center gap-2 rounded-2xl border border-[#003D5C]/25 bg-[#003D5C]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#003D5C]">
        <Trophy size={16} />
        {totalAchievements} Achievement{totalAchievements === 1 ? "" : "s"}
      </div>

      {/* Achievements */}
      <div
        className="flex flex-col gap-2.5"
        aria-live={expanded ? "polite" : "off"}
      >
        {hasAchievements
          ? achievements!.map((a) => {
              const Icon = (a.type && typeIconMap[a.type]) || Star;
              const meta = a.year || a.semester || a.date || a.type;
              return (
                <div
                  key={a.achievement_id}
                  className="flex gap-3 rounded-2xl border border-amber-300 bg-gradient-to-br from-[#f9fbfd] to-[#eef3f9] p-3.5 shadow-[0_16px_26px_rgba(0,24,39,0.12)]"
                >
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#003D5C] text-white">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="m-0 text-sm font-semibold text-[#003D5C]">
                      {a.title}
                    </h4>
                    {a.description && (
                      <p className="mt-1 mb-0 text-xs leading-relaxed text-black/70">
                        {a.description}
                      </p>
                    )}
                    {meta && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#FFB81C]/30 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-[#003D5C]">
                        {meta}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          : person.top_achievement && (
              <div
                key={`${person.person_id}-top`}
                className="flex gap-3 rounded-2xl border border-amber-300 bg-gradient-to-br from-[#f9fbfd] to-[#eef3f9] p-3.5 shadow-[0_16px_26px_rgba(0,24,39,0.12)]"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#003D5C] text-white">
                  <Star size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="m-0 text-sm font-semibold text-[#003D5C]">
                    {person.top_achievement}
                  </h4>
                </div>
              </div>
            )}
      </div>

      {/* Comments – only when expanded */}
      {expanded && <CommentsSection personId={person.person_id} />}

      {/* Toggle button */}
      <button
        type="button"
        className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#003D5C] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-white transition-transform duration-150 hover:-translate-y-0.5 hover:bg-[#002f47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB81C]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        onClick={onToggle}
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
