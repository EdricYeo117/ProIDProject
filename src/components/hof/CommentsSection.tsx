// src/components/hof/CommentsSection.tsx
import React, { useEffect, useState } from "react";

const API_BASE = (import.meta.env?.VITE_API_BASE ?? "")
  .toString()
  .replace(/\/+$/, "");

// Match Oracle/Node response shape exactly
type Comment = {
  COMMENT_ID: number;
  PERSON_ID: number;
  DISPLAY_NAME: string;
  CONTENT: string;
  CREATED_AT: string;
};

type Props = {
  personId: number;
};

const CommentsSection: React.FC<Props> = ({ personId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load comments when personId changes
  useEffect(() => {
    if (!personId) return;

    async function fetchComments() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE}/api/hof/persons/${personId}/comments`
        ); // GET, no body
        if (!res.ok) {
          throw new Error("Failed to load comments");
        }
        const data = (await res.json()) as Comment[];
        setComments(data);
      } catch (err) {
        console.error(err);
        setError("Could not load comments at this time.");
      } finally {
        setLoading(false);
      }
    }

    fetchComments();
  }, [personId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/hof/persons/${personId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: content.trim(),
            displayName: isAnonymous ? null : displayName.trim() || null,
            isAnonymous, // must match controller
          }),
        }
      );

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Failed to submit comment");
      }

      const newComment = (await res.json()) as Comment;

      // Prepend so latest appears on top
      setComments((prev) => [newComment, ...prev]);

      // Reset form
      setContent("");
      setDisplayName("");
      setIsAnonymous(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to submit comment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-4 rounded-2xl border border-[#003D5C]/12 bg-[#f8fafc] px-4 py-4">
      <h4 className="mb-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#003D5C]">
        Community Comments
      </h4>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-4 space-y-2">
        <div className="flex flex-col gap-1 text-xs text-black/80">
          <label className="font-semibold">Name (optional)</label>
          <input
            type="text"
            value={displayName}
            disabled={isAnonymous}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={isAnonymous ? "Posting anonymously" : "e.g. NP Alumni"}
            className="rounded-xl border border-[#003D5C]/20 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#FFB81C] focus:ring-offset-1"
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-black/75">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-[#003D5C]/40"
          />
          <span>Post as anonymous</span>
        </label>

        <div className="flex flex-col gap-1 text-xs text-black/80">
          <label className="font-semibold">Your message</label>
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts, memories, or encouragement…"
            className="w-full rounded-xl border border-[#003D5C]/20 px-3 py-2 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#FFB81C] focus:ring-offset-1"
          />
        </div>

        {error && <p className="text-xs font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="inline-flex items-center rounded-full bg-[#003D5C] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white shadow-sm transition hover:bg-[#002f47] disabled:bg-black/15"
        >
          {submitting ? "Posting..." : "Post Comment"}
        </button>
      </form>

      {/* Comments list */}
      {loading ? (
        <p className="text-xs text-black/50">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-black/50">
          No comments yet. Be the first to leave a message.
        </p>
      ) : (
        <ul className="flex max-h-52 flex-col gap-2 overflow-y-auto pr-1">
          {comments.map((c) => {
            const date =
              c.CREATED_AT && !Number.isNaN(new Date(c.CREATED_AT).getTime())
                ? new Date(c.CREATED_AT).toLocaleString()
                : "";

            return (
              <li
                key={c.COMMENT_ID}
                className="rounded-xl border border-[#003D5C]/10 bg-white px-3 py-2 shadow-[0_6px_12px_rgba(0,24,39,0.08)]"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-[#003D5C]">
                    {c.DISPLAY_NAME || "Anonymous"}
                  </span>
                  {date && (
                    <span className="text-[10px] text-black/40">{date}</span>
                  )}
                </div>
                <p className="m-0 whitespace-pre-wrap text-[11px] leading-relaxed text-black/80">
                  {c.CONTENT}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default CommentsSection;
