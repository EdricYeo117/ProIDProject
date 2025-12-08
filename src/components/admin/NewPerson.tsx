// src/components/admin/NewPerson.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  Award,
  Plus,
  Trash2,
  Upload,
  Lock,
  Save,
  Image as ImageIcon,
} from "lucide-react";

const API_BASE = (import.meta.env?.VITE_API_BASE ?? "")
  .toString()
  .replace(/\/+$/, "");

type UploadPar = {
  uploadUrl: string;
  viewUrl: string;
  objectName: string;
  contentType?: string;
};

type School = { id: string; name: string; color?: string };

type Achievement = {
  achievement_type_id?: string;
  title: string;
  description?: string;
  academic_year?: string;
  semester?: string;
  achievement_date?: string;
  gpa?: number;
  position_held?: string;
  organization?: string;
  award_level?: string;
  display_order?: number;
  is_public?: boolean;
  is_featured?: boolean;
};

type CCA = {
  cca_name: string;
  position_held?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  description?: string;
};

async function jsonFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

/** Helper: does this achievement row have *any* data filled in? */
function hasAnyAchievementData(a: Achievement): boolean {
  return !!(
    (a.title && a.title.trim()) ||
    (a.description && a.description.trim()) ||
    (a.academic_year && a.academic_year.trim()) ||
    (a.semester && a.semester.trim()) ||
    (a.achievement_date && a.achievement_date.trim()) ||
    a.gpa != null ||
    (a.position_held && a.position_held.trim()) ||
    (a.organization && a.organization.trim()) ||
    (a.award_level && a.award_level.trim()) ||
    a.display_order != null ||
    a.is_public != null ||
    a.is_featured != null ||
    a.achievement_type_id
  );
}

const NewPerson: React.FC = () => {
  const [adminKey, setAdminKey] = useState(
    () => sessionStorage.getItem("adminKey") || ""
  );
  const [schools, setSchools] = useState<School[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );
  const [types, setTypes] = useState<
    { achievement_type_id: string; achievement_type_name: string }[]
  >([]);

  const [form, setForm] = useState({
    full_name: "",
    category_id: "",
    school_id: "",
    bio: "",
    is_featured: false,
    file: null as File | null,
  });

  // start with a single blank achievement row (can now be removed)
  const [achievements, setAchievements] = useState<Achievement[]>([
    { title: "" },
  ]);
  const [cca, setCca] = useState<CCA[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // preview
  const previewUrl = useMemo(
    () => (form.file ? URL.createObjectURL(form.file) : ""),
    [form.file]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // load schools & categories
  useEffect(() => {
  // SCHOOLS
  fetch(`${API_BASE}/api/schools`)
    .then((r) => r.json())
    .then((data) => {
      setSchools(
        (Array.isArray(data) ? data : []).map((s: any) => ({
          id: String(s.id ?? s.school_id ?? s.SCHOOL_ID ?? ""),
          name: String(s.name ?? s.school_name ?? s.SCHOOL_NAME ?? ""),
          color: s.color ?? s.color_code ?? s.COLOR_CODE ?? undefined,
        }))
      );
    })
    .catch(() => setSchools([]));

  // CATEGORIES
  fetch(`${API_BASE}/api/categories`)
    .then((r) => r.json())
    .then((data) => {
      const normalized = (Array.isArray(data) ? data : [])
        .map((c: any) => ({
          id: String(c.id ?? c.category_id ?? c.CATEGORY_ID ?? ""),
          name: String(c.name ?? c.category_name ?? c.CATEGORY_NAME ?? ""),
        }))
        .filter((c) => c.id && c.name);

      setCategories(normalized);
    })
    .catch(() => setCategories([]));
}, []);

  // load achievement types when category changes (needs admin key)
 useEffect(() => {
  if (!form.category_id || !adminKey) {
    setTypes([]);
    return;
  }

  const controller = new AbortController();
  const url = `${API_BASE}/api/admin/achievement-types?categoryId=${encodeURIComponent(
    form.category_id
  )}`;

  fetch(url, {
    headers: { "x-admin-key": adminKey },
    signal: controller.signal,
  })
    .then(async (r) => {
      if (!r.ok) {
        const text = await r.text();
        throw new Error(text || `Failed to load achievement types (${r.status})`);
      }
      return r.json();
    })
    .then((data) => {
      const normalized = (Array.isArray(data) ? data : []).map((t: any) => ({
        achievement_type_id:
          t.achievement_type_id ??
          t.ACHIEVEMENT_TYPE_ID ??
          t.id ??
          t.ID ??
          "",
        achievement_type_name:
          t.achievement_type_name ??
          t.ACHIEVEMENT_TYPE_NAME ??
          t.name ??
          t.NAME ??
          "",
      }));

      setTypes(normalized.filter((t) => t.achievement_type_id && t.achievement_type_name));
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        console.error("Failed to load achievement types", err);
        setTypes([]);
      }
    });

  return () => controller.abort();
}, [form.category_id, adminKey]);

  const canSubmit = useMemo(() => {
    const hasCore =
      !!adminKey && form.full_name && form.category_id && form.school_id;

    // Only rows with *some* data require a non-empty title.
    const achOk =
      achievements.length === 0 ||
      achievements.every((a) => {
        const hasData = hasAnyAchievementData(a);
        if (!hasData) return true; // completely blank block is fine
        return !!a.title && a.title.trim().length > 0;
      });

    return hasCore && achOk;
  }, [adminKey, form, achievements]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value, type } = e.target as any;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? !!checked : value }));
  }

  function updateAch(i: number, patch: Partial<Achievement>) {
    setAchievements((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a))
    );
  }
  function addAch() {
    setAchievements((prev) => [...prev, { title: "" }]);
  }
  function delAch(i: number) {
    setAchievements((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateCca(i: number, patch: Partial<CCA>) {
    setCca((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c))
    );
  }
  function addCca() {
    setCca((prev) => [...prev, { cca_name: "" }]);
  }
  function delCca(i: number) {
    setCca((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function requestPar(file: File, folder: string): Promise<UploadPar> {
    const body = JSON.stringify({
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      folder,
    });
    return jsonFetch(`${API_BASE}/api/uploads/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body,
    });
  }

  async function uploadWithPar(par: UploadPar, file: File) {
    const put = await fetch(par.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!put.ok) throw new Error(await put.text());
    return par.viewUrl;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setMsg("");
    try {
      sessionStorage.setItem("adminKey", adminKey);

      let profileUrl: string | null = null;
      if (form.file) {
        const par = await requestPar(form.file, "profiles");
        profileUrl = await uploadWithPar(par, form.file);
      }

      const achPayload = achievements
        // Only send achievements with a non-empty title
        .filter((a) => a.title?.trim())
        .map((a) => ({
          achievement_type_id: a.achievement_type_id || null,
          title: a.title.trim(),
          description: a.description || null,
          academic_year: a.academic_year || null,
          semester: a.semester || null,
          achievement_date: a.achievement_date || null,
          gpa: a.gpa ?? null,
          position_held: a.position_held || null,
          organization: a.organization || null,
          award_level: a.award_level || null,
          display_order: a.display_order ?? null,
          is_public: a.is_public ?? true,
          is_featured: a.is_featured ?? false,
        }));

      const ccaPayload = cca
        .filter((c) => c.cca_name?.trim())
        .map((c) => ({
          cca_name: c.cca_name.trim(),
          position_held: c.position_held || null,
          start_date: c.start_date || null,
          end_date: c.end_date || null,
          is_current: !!c.is_current,
          description: c.description || null,
        }));

      const payload = {
        full_name: form.full_name.trim(),
        category_id: form.category_id,
        school_id: form.school_id,
        bio: form.bio || null,
        is_featured: !!form.is_featured,
        profile_image_url: profileUrl,
        achievements: achPayload,
        cca: ccaPayload,
      };

      const created = await jsonFetch(`${API_BASE}/api/admin/persons/full`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify(payload),
      });

      setMsg(
        `success: Created person_id ${
          (created as any).person_id || (created as any).id || "(ok)"
        }`
      );
      setForm({
        full_name: "",
        category_id: "",
        school_id: "",
        bio: "",
        is_featured: false,
        file: null,
      });
      // Reset to a single blank row again (still removable)
      setAchievements([{ title: "" }]);
      setCca([]);
    } catch (err: any) {
      setMsg(`error: ${err.message || String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003D5C] to-[#005580]">
      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-5xl px-4 pt-6 pb-12 text-[#1A1A1A]"
      >
        {/* Hero (aligned with HallOfFame colors/feel) */}
        <header className="mb-6 rounded-xl bg-white shadow-md">
          <div className="flex items-center justify-between gap-4 px-7 py-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                Ngee Ann Polytechnic
              </span>
              <div className="mt-2 flex items-center gap-3 text-[#003D5C]">
                <div className="rounded-2xl border border-[#FFB81C]/40 bg-[#003D5C]/5 p-3">
                  <Users size={40} className="text-[#003D5C]" />
                </div>
                <div>
                  <h1 className="text-[28px] font-extrabold leading-tight">
                    Hall of Fame Admin
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Create and curate inspiring Hall of Fame profiles.
                  </p>
                </div>
              </div>
            </div>
            <div
              className="hidden items-center gap-2 rounded-full border border-[#003D5C]/10 bg-slate-50 px-4 py-2 text-sm font-semibold text-[#003D5C] shadow-sm md:flex"
              aria-hidden="true"
            >
              <Users size={28} />
              <span>Celebrating Excellence</span>
            </div>
          </div>
          <div className="h-1 w-full bg-gradient-to-r from-[#FFB81C] via-[#FFD76B] to-[#FFB81C]" />
        </header>

        <main className="grid gap-4">
          {/* Admin key */}
          <section className="rounded-xl bg-white p-5 shadow-md">
            <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
              <Lock size={20} className="text-[#003D5C]" />
              <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#003D5C]">
                Admin Authentication
              </h3>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-[#1A1A1A]">
                Admin Key
              </span>
              <input
                className="mt-1 w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#FFB81C] focus:ring-4 focus:ring-[#FFB81C]/30"
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter your admin key"
                required
              />
              <small className="mt-1 text-xs text-slate-500">
                Sent as{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">
                  x-admin-key
                </code>{" "}
                header.
              </small>
            </label>
          </section>

          {/* Basic info */}
          <section className="rounded-xl bg-white p-5 shadow-md">
            <h3 className="mb-4 text-lg font-semibold text-[#003D5C]">
              Basic Information
            </h3>

            <div className="mb-3 grid gap-3 md:grid-cols-3">
              <label className="flex flex-col">
                <span className="text-sm font-semibold text-[#1A1A1A]">
                  Full Name *
                </span>
                <input
                  className="mt-1 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#FFB81C] focus:ring-4 focus:ring-[#FFB81C]/30"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                />
              </label>

              <label className="flex flex-col">
                <span className="text-sm font-semibold text-[#1A1A1A]">
                  Category *
                </span>
                <select
                  className="mt-1 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#FFB81C] focus:ring-4 focus:ring-[#FFB81C]/30"
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col">
                <span className="text-sm font-semibold text-[#1A1A1A]">
                  School *
                </span>
                <select
                  className="mt-1 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#FFB81C] focus:ring-4 focus:ring-[#FFB81C]/30"
                  name="school_id"
                  value={form.school_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select school…</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-2 flex flex-col">
              <span className="text-sm font-semibold text-[#1A1A1A]">Bio</span>
              <textarea
                className="mt-1 min-h-[80px] rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#FFB81C] focus:ring-4 focus:ring-[#FFB81C]/30"
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={4}
                placeholder="Brief biography…"
              />
            </label>

            {/* Upload */}
            <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <label className="flex cursor-pointer flex-col gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 hover:border-[#FFB81C]">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
                  <Upload size={18} />
                  Profile Photo
                </span>
                <input
                  className="hidden"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      file: e.target.files?.[0] || null,
                    }))
                  }
                />
                <span className="text-xs text-slate-500">
                  Recommended: square image, at least 600×600px.
                </span>
              </label>

              <div className="flex items-center justify-center">
                {previewUrl ? (
                  <div className="w-40 rounded-xl border-2 border-slate-200 bg-slate-50 p-2">
                    <img
                      src={previewUrl}
                      alt="Selected preview"
                      className="h-32 w-full rounded-lg object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-32 w-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500">
                    <ImageIcon size={24} />
                    <span>No image selected</span>
                  </div>
                )}
              </div>
            </div>

            <label className="mt-4 inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="is_featured"
                checked={form.is_featured}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-[#003D5C] focus:ring-[#003D5C]"
              />
              <span className="text-sm font-semibold text-[#1A1A1A]">
                Featured Person
              </span>
            </label>
          </section>

          {/* Achievements */}
          <section className="rounded-xl bg-white p-5 shadow-md">
            <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Award size={20} className="text-amber-400" />
                <h3 className="text-base font-semibold text-[#003D5C]">
                  Achievements
                </h3>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg border-2 border-[#003D5C] bg-white px-3 py-1.5 text-xs font-semibold text-[#003D5C] transition hover:bg-slate-50"
                onClick={addAch}
              >
                <Plus size={14} />
                Add Achievement
              </button>
            </div>

            {achievements.length === 0 && (
              <p className="text-sm text-slate-500">
                No achievements yet. Click “Add Achievement” to create the first
                one.
              </p>
            )}

            <div className="mt-3 space-y-4">
              {achievements.map((a, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border-2 border-[#FFB81C] bg-gradient-to-br from-slate-50 to-slate-100 p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#003D5C]">
                      Achievement #{idx + 1}
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border-2 border-red-500 bg-white px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50"
                      onClick={() => delAch(idx)}
                    >
                      <Trash2 size={12} />
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <label className="flex flex-col">
                      <span className="text-xs font-semibold text-[#1A1A1A]">
                        Achievement Type
                      </span>
                      <select
                        className="mt-1 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-[#FFB81C] focus:ring-4 focus:ring-[#FFB81C]/30"
                       value={a.achievement_type_id || ""}
  onChange={(e) =>
    updateAch(idx, { achievement_type_id: e.target.value || undefined })
  }
>
  <option value="">(None)</option>
  {types
    .filter(
      (t) =>
        (t.achievement_type_name || "").trim().toLowerCase() !== "(none)"
    )
    .map((t) => (
      <option key={t.achievement_type_id} value={t.achievement_type_id}>
        {t.achievement_type_name}
      </option>
    ))}
</select>
                    </label>

                    <label className="flex flex-col md:col-span-2">
                      <span className="text-xs font-semibold text-[#1A1A1A]">
                        Title *
                      </span>
                      <input
                        className="mt-1 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-[#FFB81C] focus:ring-4 focus:ring-[#FFB81C]/30"
                        value={a.title}
                        onChange={(e) =>
                          updateAch(idx, { title: e.target.value })
                        }
                      />
                    </label>

                    <label className="flex flex-col">
                      <span className="text-xs font-semibold text-[#1A1A1A]">
                        Academic Year
                      </span>
                      <input
                        className="mt-1 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-[#FFB81C] focus:ring-4 focus:ring-[#FFB81C]/30"
                        value={a.academic_year || ""}
                        onChange={(e) =>
                          updateAch(idx, {
                            academic_year: e.target.value || undefined,
                          })
                        }
                      />
                    </label>

                    <label className="flex flex-col">
                      <span className="text-xs font-semibold text-[#1A1A1A]">
                        Semester
                      </span>
                      <input
                        className="mt-1 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-[#FFB81C] focus:ring-4 focus:ring-[#FFB81C]/30"
                        value={a.semester || ""}
                        onChange={(e) =>
                          updateAch(idx, {
                            semester: e.target.value || undefined,
                          })
                        }
                      />
                    </label>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-4">
                    <label className="flex flex-col">
                      <span className="text-xs font-semibold text-[#1A1A1A]">
                        Date
                      </span>
                      <input
                        className="mt-1 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-[#FFB81C] focus:ring-4 focus:ring-[#FFB81C]/30"
                        type="date"
                        value={a.achievement_date || ""}
                        onChange={(e) =>
                          updateAch(idx, {
                            achievement_date: e.target.value || undefined,
                          })
                        }
                      />
                    </label>

                    <label className="flex flex-col">
                      <span className="text-xs font-semibold text-[#1A1A1A]">
                        GPA
                      </span>
                      <input
                        className="mt-1 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-[#FFB81C] focus:ring-4 focus:ring-[#FFB81C]/30"
                        type="number"
                        step="0.001"
                        value={a.gpa ?? ""}
                        onChange={(e) =>
                          updateAch(idx, {
                            gpa: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                      />
                    </label>

                    <label className="flex flex-col">
                      <span className="text-xs font-semibold text-[#1A1A1A]">
                        Organization
                      </span>
                      <input
                        className="mt-1 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-[#FFB81C] focus:ring-4 focus:ring-[#FFB81C]/30"
                        value={a.organization || ""}
                        onChange={(e) =>
                          updateAch(idx, {
                            organization: e.target.value || undefined,
                          })
                        }
                      />
                    </label>

                    <label className="flex flex-col">
                      <span className="text-xs font-semibold text-[#1A1A1A]">
                        Award Level
                      </span>
                      <input
                        className="mt-1 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-[#FFB81C] focus:ring-4 focus:ring-[#FFB81C]/30"
                        value={a.award_level || ""}
                        onChange={(e) =>
                          updateAch(idx, {
                            award_level: e.target.value || undefined,
                          })
                        }
                      />
                    </label>
                  </div>

                  <label className="mt-3 flex flex-col">
                    <span className="text-xs font-semibold text-[#1A1A1A]">
                      Position Held
                    </span>
                    <input
                      className="mt-1 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-[#FFB81C] focus:ring-4 focus:ring-[#FFB81C]/30"
                      value={a.position_held || ""}
                      onChange={(e) =>
                        updateAch(idx, {
                          position_held: e.target.value || undefined,
                        })
                      }
                    />
                  </label>

                  <label className="mt-3 flex flex-col">
                    <span className="text-xs font-semibold text-[#1A1A1A]">
                      Description
                    </span>
                    <textarea
                      className="mt-1 min-h-[64px] rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-[#FFB81C] focus:ring-4 focus:ring-[#FFB81C]/30"
                      value={a.description || ""}
                      onChange={(e) =>
                        updateAch(idx, {
                          description: e.target.value || undefined,
                        })
                      }
                      rows={3}
                    />
                  </label>

                  <div className="mt-3 grid items-center gap-3 md:grid-cols-3">
                    <label className="flex flex-col">
                      <span className="text-xs font-semibold text-[#1A1A1A]">
                        Display Order
                      </span>
                      <input
                        className="mt-1 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-[#FFB81C] focus:ring-4 focus:ring-[#FFB81C]/30"
                        type="number"
                        value={a.display_order ?? ""}
                        onChange={(e) =>
                          updateAch(idx, {
                            display_order: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                      />
                    </label>

                    <label className="inline-flex items-center gap-2 text-xs text-[#1A1A1A]">
                      <input
                        type="checkbox"
                        checked={!!a.is_public}
                        onChange={(e) =>
                          updateAch(idx, { is_public: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-[#003D5C] focus:ring-[#003D5C]"
                      />
                      <span>Public</span>
                    </label>

                    <label className="inline-flex items-center gap-2 text-xs text-[#1A1A1A]">
                      <input
                        type="checkbox"
                        checked={!!a.is_featured}
                        onChange={(e) =>
                          updateAch(idx, { is_featured: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-amber-400 focus:ring-amber-400"
                      />
                      <span>Featured</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CCA */}
          <section className="rounded-xl bg-white p-5 shadow-md">
            <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-base font-semibold text-[#003D5C]">
                CCA Activities (Optional)
              </h3>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg border-2 border-[#003D5C] bg-white px-3 py-1.5 text-xs font-semibold text-[#003D5C] transition hover:bg-slate-50"
                onClick={addCca}
              >
                <Plus size={14} />
                Add CCA
              </button>
            </div>

            {cca.length === 0 && (
              <p className="text-sm text-slate-500">
                No CCA activities added yet.
              </p>
            )}

            <div className="mt-3 space-y-4">
              {cca.map((c, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border-2 border-[#FFB81C] bg-gradient-to-br from-slate-50 to-slate-100 p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#003D5C]">
                      CCA #{idx + 1}
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border-2 border-red-500 bg-white px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50"
                      onClick={() => delCca(idx)}
                    >
                      <Trash2 size={12} />
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <label className="flex flex-col">
                      <span className="text-xs font-semibold text-[#1A1A1A]">
                        CCA Name
                      </span>
                      <input
                        className="mt-1 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-[#FFB81C] focus:ring-4 focus:ring-[#FFB81C]/30"
                        value={c.cca_name}
                        onChange={(e) =>
                          updateCca(idx, { cca_name: e.target.value })
                        }
                      />
                    </label>

                    <label className="flex flex-col">
                      <span className="text-xs font-semibold text-[#1A1A1A]">
                        Position
                      </span>
                      <input
                        className="mt-1 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-[#FFB81C] focus:ring-4 focus:ring-[#FFB81C]/30"
                        value={c.position_held || ""}
                        onChange={(e) =>
                          updateCca(idx, {
                            position_held: e.target.value || undefined,
                          })
                        }
                      />
                    </label>

                    <label className="flex flex-col">
                      <span className="text-xs font-semibold text-[#1A1A1A]">
                        Start Date
                      </span>
                      <input
                        className="mt-1 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-[#FFB81C] focus:ring-4 focus:ring-[#FFB81C]/30"
                        type="date"
                        value={c.start_date || ""}
                        onChange={(e) =>
                          updateCca(idx, {
                            start_date: e.target.value || undefined,
                          })
                        }
                      />
                    </label>

                    <label className="flex flex-col">
                      <span className="text-xs font-semibold text-[#1A1A1A]">
                        End Date
                      </span>
                      <input
                        className="mt-1 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-[#FFB81C] focus:ring-4 focus:ring-[#FFB81C]/30"
                        type="date"
                        value={c.end_date || ""}
                        onChange={(e) =>
                          updateCca(idx, {
                            end_date: e.target.value || undefined,
                          })
                        }
                      />
                    </label>
                  </div>

                  <label className="mt-3 inline-flex items-center gap-2 text-xs text-[#1A1A1A]">
                    <input
                      type="checkbox"
                      checked={!!c.is_current}
                      onChange={(e) =>
                        updateCca(idx, { is_current: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-slate-300 text-[#003D5C] focus:ring-[#003D5C]"
                    />
                    <span>Currently Active</span>
                  </label>

                  <label className="mt-3 flex flex-col">
                    <span className="text-xs font-semibold text-[#1A1A1A]">
                      Description
                    </span>
                    <textarea
                      className="mt-1 min-h-[64px] rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-[#FFB81C] focus:ring-4 focus:ring-[#FFB81C]/30"
                      value={c.description || ""}
                      onChange={(e) =>
                        updateCca(idx, {
                          description: e.target.value || undefined,
                        })
                      }
                      rows={3}
                    />
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* Submit */}
          <section className="mt-2 rounded-xl bg-white p-5 shadow-md">
            <div className="flex flex-col items-stretch gap-3">
              <button
                type="submit"
                disabled={!canSubmit || busy}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#003D5C] bg-gradient-to-r from-[#003D5C] to-[#005580] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-[#005580] hover:to-[#0073a8] focus:outline-none focus:ring-4 focus:ring-[#FFB81C]/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={18} />
                {busy ? "Creating…" : "Create Person"}
              </button>

              {msg && (
                <div
                  className={[
                    "rounded-lg border-2 px-3 py-2 text-sm font-semibold",
                    msg.startsWith("success")
                      ? "border-[#c7ebc6] bg-[#eaf7e9] text-[#176b2d]"
                      : "border-[#f6c7cd] bg-[#fde8ea] text-[#791b24]",
                  ].join(" ")}
                >
                  {msg.replace(/^success:\s?|^error:\s?/i, "")}
                </div>
              )}
            </div>
          </section>
        </main>
      </form>
    </div>
  );
};

export default NewPerson;
