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
import "./NewPerson.css";

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

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [cca, setCca] = useState<CCA[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // image preview URL
  const previewUrl = useMemo(
    () => (form.file ? URL.createObjectURL(form.file) : ""),
    [form.file]
  );
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    fetch(`${API_BASE}/api/schools`)
      .then((r) => r.json())
      .then(setSchools)
      .catch(() => setSchools([]));
    fetch(`${API_BASE}/api/categories`)
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!form.category_id) {
      setTypes([]);
      return;
    }
    const url = `${API_BASE}/api/admin/achievement-types?categoryId=${encodeURIComponent(
      form.category_id
    )}`;
    fetch(url)
      .then((r) => r.json())
      .then(setTypes)
      .catch(() => setTypes([]));
  }, [form.category_id]);

  const canSubmit = useMemo(() => {
    const hasCore =
      !!adminKey && form.full_name && form.category_id && form.school_id;
    const achOk =
      achievements.length === 0 ||
      achievements.every((a) => a.title.trim().length > 0);
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

  async function requestPar(file: File): Promise<UploadPar> {
    const body = JSON.stringify({
      filename: file.name,
      contentType: file.type || "application/octet-stream",
    });
    return jsonFetch(`${API_BASE}/api/admin/upload-par`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
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
        const par = await requestPar(form.file);
        profileUrl = await uploadWithPar(par, form.file);
      }

      const achPayload = achievements
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
          created.person_id || created.id || "(ok)"
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
      setAchievements([{ title: "" }]);
      setCca([]);
    } catch (err: any) {
      setMsg(`error: ${err.message || String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="np-admin-page">
      {/* Hero */}
      <header className="np-hero">
        <div className="np-hero__inner">
          <div className="np-hero__title">
            <Users size={40} />
            <div>
              <h1>Hall of Fame Admin</h1>
              <p>Create new person records with achievements and CCAs</p>
            </div>
          </div>
          <div className="np-hero__emblem" aria-hidden="true">
            Celebrating Excellence
          </div>
        </div>
      </header>

      <main className="np-main">
        {/* Admin key */}
        <section className="np-card np-card--accent">
          <div className="np-card__head">
            <Lock size={22} />
            <h3>Admin Authentication</h3>
          </div>
          <label className="np-field">
            <span>Admin Key</span>
            <input
              className="np-input"
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Enter your admin key"
              required
            />
            <small>
              Sent as <code>x-admin-key</code> header.
            </small>
          </label>
        </section>

        {/* Basic info */}
        <section className="np-card">
          <h3 className="np-card__title">Basic Information</h3>

          <div className="np-grid">
            <label className="np-field">
              <span>Full Name *</span>
              <input
                className="np-input"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                required
                placeholder="Enter full name"
              />
            </label>

            <label className="np-field">
              <span>Category *</span>
              <select
                className="np-input"
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

            <label className="np-field">
              <span>School *</span>
              <select
                className="np-input"
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

          <label className="np-field">
            <span>Bio</span>
            <textarea
              className="np-input"
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={4}
              placeholder="Brief biography…"
            />
          </label>

          <div className="np-upload">
            <label className="np-field np-upload__picker">
              <span className="np-upload__label">
                <Upload size={18} />
                Profile Photo
              </span>
              <input
                className="np-input"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setForm((f) => ({ ...f, file: e.target.files?.[0] || null }))
                }
              />
            </label>

            <div className="np-upload__preview">
              {previewUrl ? (
                <img src={previewUrl} alt="Selected preview" />
              ) : (
                <div className="np-upload__placeholder">
                  <ImageIcon size={28} />
                  <span>No image selected</span>
                </div>
              )}
            </div>
          </div>

          <label className="np-checkbox">
            <input
              type="checkbox"
              name="is_featured"
              checked={form.is_featured}
              onChange={handleChange}
            />
            <span>Featured Person</span>
          </label>
        </section>

        {/* Achievements */}
        <section className="np-card">
          <div className="np-card__head">
            <Award size={22} />
            <h3>Achievements</h3>
            <button
              type="button"
              className="np-btn np-btn--outline"
              onClick={addAch}
            >
              <Plus size={16} />
              Add Achievement
            </button>
          </div>

          {achievements.length === 0 && (
            <p className="np-empty">
              No achievements yet. Click “Add Achievement” to create the first
              one.
            </p>
          )}

          {achievements.map((a, idx) => (
            <div key={idx} className="np-block">
              <div className="np-block__head">
                <span className="np-block__title">Achievement #{idx + 1}</span>
                {achievements.length > 1 && (
                  <button
                    type="button"
                    className="np-btn np-btn--danger"
                    onClick={() => delAch(idx)}
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                )}
              </div>

              <div className="np-grid">
                <label className="np-field">
                  <span>Achievement Type</span>
                  <select
                    className="np-input"
                    value={a.achievement_type_id || ""}
                    onChange={(e) =>
                      updateAch(idx, {
                        achievement_type_id: e.target.value || undefined,
                      })
                    }
                  >
                    <option value="">(None)</option>
                    {types.map((t) => (
                      <option
                        key={t.achievement_type_id}
                        value={t.achievement_type_id}
                      >
                        {t.achievement_type_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="np-field">
                  <span>Title *</span>
                  <input
                    className="np-input"
                    value={a.title}
                    onChange={(e) => updateAch(idx, { title: e.target.value })}
                    required
                  />
                </label>

                <label className="np-field">
                  <span>Academic Year</span>
                  <input
                    className="np-input"
                    value={a.academic_year || ""}
                    onChange={(e) =>
                      updateAch(idx, {
                        academic_year: e.target.value || undefined,
                      })
                    }
                  />
                </label>

                <label className="np-field">
                  <span>Semester</span>
                  <input
                    className="np-input"
                    value={a.semester || ""}
                    onChange={(e) =>
                      updateAch(idx, { semester: e.target.value || undefined })
                    }
                  />
                </label>
              </div>

              <div className="np-grid">
                <label className="np-field">
                  <span>Date</span>
                  <input
                    className="np-input"
                    type="date"
                    value={a.achievement_date || ""}
                    onChange={(e) =>
                      updateAch(idx, {
                        achievement_date: e.target.value || undefined,
                      })
                    }
                  />
                </label>

                <label className="np-field">
                  <span>GPA</span>
                  <input
                    className="np-input"
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

                <label className="np-field">
                  <span>Organization</span>
                  <input
                    className="np-input"
                    value={a.organization || ""}
                    onChange={(e) =>
                      updateAch(idx, {
                        organization: e.target.value || undefined,
                      })
                    }
                  />
                </label>

                <label className="np-field">
                  <span>Award Level</span>
                  <input
                    className="np-input"
                    value={a.award_level || ""}
                    onChange={(e) =>
                      updateAch(idx, {
                        award_level: e.target.value || undefined,
                      })
                    }
                  />
                </label>
              </div>

              <label className="np-field">
                <span>Position Held</span>
                <input
                  className="np-input"
                  value={a.position_held || ""}
                  onChange={(e) =>
                    updateAch(idx, {
                      position_held: e.target.value || undefined,
                    })
                  }
                />
              </label>

              <label className="np-field">
                <span>Description</span>
                <textarea
                  className="np-input"
                  value={a.description || ""}
                  onChange={(e) =>
                    updateAch(idx, { description: e.target.value || undefined })
                  }
                  rows={3}
                />
              </label>

              <div className="np-grid np-grid--tight">
                <label className="np-field">
                  <span>Display Order</span>
                  <input
                    className="np-input"
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

                <label className="np-checkbox">
                  <input
                    type="checkbox"
                    checked={!!a.is_public}
                    onChange={(e) =>
                      updateAch(idx, { is_public: e.target.checked })
                    }
                  />
                  <span>Public</span>
                </label>

                <label className="np-checkbox">
                  <input
                    type="checkbox"
                    checked={!!a.is_featured}
                    onChange={(e) =>
                      updateAch(idx, { is_featured: e.target.checked })
                    }
                  />
                  <span>Featured</span>
                </label>
              </div>
            </div>
          ))}
        </section>

        {/* CCA */}
        <section className="np-card">
          <div className="np-card__head">
            <h3>CCA Activities (Optional)</h3>
            <button
              type="button"
              className="np-btn np-btn--outline"
              onClick={addCca}
            >
              <Plus size={16} />
              Add CCA
            </button>
          </div>

          {cca.length === 0 && (
            <p className="np-empty">No CCA activities added yet</p>
          )}

          {cca.map((c, idx) => (
            <div key={idx} className="np-block">
              <div className="np-block__head">
                <span className="np-block__title">CCA #{idx + 1}</span>
                <button
                  type="button"
                  className="np-btn np-btn--danger"
                  onClick={() => delCca(idx)}
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              </div>

              <div className="np-grid">
                <label className="np-field">
                  <span>CCA Name</span>
                  <input
                    className="np-input"
                    value={c.cca_name}
                    onChange={(e) =>
                      updateCca(idx, { cca_name: e.target.value })
                    }
                  />
                </label>

                <label className="np-field">
                  <span>Position</span>
                  <input
                    className="np-input"
                    value={c.position_held || ""}
                    onChange={(e) =>
                      updateCca(idx, {
                        position_held: e.target.value || undefined,
                      })
                    }
                  />
                </label>

                <label className="np-field">
                  <span>Start Date</span>
                  <input
                    className="np-input"
                    type="date"
                    value={c.start_date || ""}
                    onChange={(e) =>
                      updateCca(idx, {
                        start_date: e.target.value || undefined,
                      })
                    }
                  />
                </label>

                <label className="np-field">
                  <span>End Date</span>
                  <input
                    className="np-input"
                    type="date"
                    value={c.end_date || ""}
                    onChange={(e) =>
                      updateCca(idx, { end_date: e.target.value || undefined })
                    }
                  />
                </label>
              </div>

              <label className="np-checkbox">
                <input
                  type="checkbox"
                  checked={!!c.is_current}
                  onChange={(e) =>
                    updateCca(idx, { is_current: e.target.checked })
                  }
                />
                <span>Currently Active</span>
              </label>

              <label className="np-field">
                <span>Description</span>
                <textarea
                  className="np-input"
                  value={c.description || ""}
                  onChange={(e) =>
                    updateCca(idx, { description: e.target.value || undefined })
                  }
                  rows={3}
                />
              </label>
            </div>
          ))}
        </section>

        {/* Submit */}
        <section className="np-actions">
          <button
            type="submit"
            disabled={!canSubmit || busy}
            className="np-btn np-btn--primary np-btn--lg"
          >
            <Save size={18} />
            {busy ? "Creating…" : "Create Person"}
          </button>

          {msg && (
            <div
              className={`np-alert ${
                msg.startsWith("success") ? "is-success" : "is-error"
              }`}
            >
              {msg.replace(/^success:\s?|^error:\s?/i, "")}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default NewPerson;
