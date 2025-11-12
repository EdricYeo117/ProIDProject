export type School = {
  id: string;
  name: string;
  color?: string | null;
};

export type HofCard = {
  person_id: number;
  full_name: string;
  category_name: string;
  school_name: string;
  bio?: string | null;
  profile_image_url?: string | null;
  achievement_count: number;
  top_achievement?: string | null;
};

export type Achievement = {
  achievement_id: number;
  title: string;
  description?: string | null;
  type?: string | null;
  year?: string | null;
  semester?: string | null;
  date?: string | null; // YYYY-MM-DD
  gpa?: number | null;
  organization?: string | null;
  award_level?: string | null;
  display_order?: number | null;
};

export type CcaItem = {
  cca_name: string;
  position?: string | null;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_current?: number | boolean | null;
};

export type PersonDetails = {
  person_id?: number;
  full_name?: string;
  achievements: Achievement[];
  cca?: CcaItem[];
};
