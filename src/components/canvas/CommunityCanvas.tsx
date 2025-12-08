import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

type Message = {
  id: string;
  x: number;
  y: number;
  text: string;
  author?: string;
  createdAt: string;
};

const WORLD_SIZE = 5000;
const API_BASE = "http://localhost:8080";

const CommunityCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [scale, setScale] = useState(0.2);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [offsetStart, setOffsetStart] = useState({ x: 0, y: 0 });

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // --- form state ---
  const [formOpen, setFormOpen] = useState(false);
  const [formAuthor, setFormAuthor] = useState("");
  const [formText, setFormText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingCoords, setPendingCoords] =
    useState<{ x: number; y: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // --- WebSocket: retrieve + live updates ---
  useEffect(() => {
    let isMounted = true;

    const socket = io(API_BASE, {
      transports: ["websocket"],
    });

    setLoading(true);

    socket.on("connect", () => {
      console.log("Connected to canvas socket:", socket.id);
    });

    // initial payload from server
    socket.on("canvas:init", (msgs: Message[]) => {
      if (!isMounted) return;
      setMessages(msgs);
      setLoading(false);
    });

    socket.on("canvas:init-error", (payload: { message: string }) => {
      console.error("Canvas init error:", payload);
      if (isMounted) setLoading(false);
    });

    // live message from other users
    socket.on("canvas:new-message", (msg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on("disconnect", () => {
      console.log("Canvas socket disconnected");
    });

    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, []);

  // --- canvas helpers ---

  const screenToWorld = (screenX: number, screenY: number) => {
    return {
      x: (screenX - offset.x) / scale,
      y: (screenY - offset.y) / scale,
    };
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = 0.0015;
    const delta = -e.deltaY;
    const prevScale = scale;

    let newScale = prevScale * (1 + delta * zoomFactor);
    newScale = Math.max(0.05, Math.min(newScale, 3));

    const worldX = (mouseX - offset.x) / prevScale;
    const worldY = (mouseY - offset.y) / prevScale;

    const newOffsetX = mouseX - worldX * newScale;
    const newOffsetY = mouseY - worldY * newScale;

    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
    setOffsetStart(offset);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    setOffset({
      x: offsetStart.x + dx,
      y: offsetStart.y + dy,
    });
  };

  const handleMouseUp = () => setIsPanning(false);
  const handleMouseLeave = () => setIsPanning(false);

  // When user double-clicks on the board, open form
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (formOpen || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const world = screenToWorld(mouseX, mouseY);

    setPendingCoords(world);
    setFormAuthor("");
    setFormText("");
    setFormError(null);
    setFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingCoords) return;

    if (!formText.trim()) {
      setFormError("Please write a short message before submitting.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const body = {
      x: pendingCoords.x,
      y: pendingCoords.y,
      text: formText.trim(),
      author: formAuthor.trim() || "Anonymous",
    };

    try {
      const res = await fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error("Failed to save message");
      }

      // We *could* append saved here, but the server will broadcast
      // canvas:new-message so we just close the form.
      setFormOpen(false);
      setPendingCoords(null);
      setFormText("");
      setFormAuthor("");
    } catch (err) {
      console.error(err);
      setFormError("Something went wrong saving your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setFormOpen(false);
    setPendingCoords(null);
    setFormText("");
    setFormAuthor("");
    setFormError(null);
  };

  const showFullText = scale > 0.5;

  return (
    <div className="w-full h-[calc(100vh-64px)] bg-slate-900 flex flex-col">
      <div className="p-3 text-sm text-slate-100 flex items-center gap-4 border-b border-slate-700">
        <div className="font-semibold text-base">Community Memory Wall</div>
        <div>Zoom: {(scale * 100).toFixed(0)}%</div>
        {loading && <div className="text-slate-400">Loading messages…</div>}
        <div className="ml-auto text-xs text-slate-400">
          Scroll to zoom • drag to pan • double-click anywhere to leave a note
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-hidden bg-slate-800 cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
      >
        <div
          className="relative bg-slate-900"
          style={{
            width: WORLD_SIZE,
            height: WORLD_SIZE,
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "0 0",
            backgroundImage:
              "radial-gradient(circle, rgba(148,163,184,0.25) 1px, transparent 0)",
            backgroundSize: "40px 40px",
            border: "1px solid rgba(148,163,184,0.5)",
          }}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className="absolute"
              style={{
                left: m.x,
                top: m.y,
              }}
            >
              <div className="w-3 h-3 rounded-full bg-sky-400 shadow-md shadow-sky-500/50" />
              {showFullText && (
                <div className="mt-1 max-w-xs rounded-xl bg-slate-900/95 border border-sky-500/60 px-3 py-2 text-xs text-slate-100 shadow-lg">
                  <div className="font-semibold text-[0.7rem] text-sky-300">
                    {m.author ?? "Anonymous"}
                  </div>
                  <div>{m.text}</div>
                  <div className="mt-1 text-[0.65rem] text-slate-400">
                    {new Date(m.createdAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Overlay form */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              Leave a note on the Memory Wall
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              This board is a shared space. Add a short, positive message about your memories,
              experiences, or appreciation. Please keep it respectful and suitable for the NP
              community.
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Your name (optional)
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="e.g. Edric, NP Student"
                  value={formAuthor}
                  onChange={(e) => setFormAuthor(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Your message
                </label>
                <textarea
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 min-h-[80px]"
                  placeholder="What memory or message do you want to leave here?"
                  maxLength={500}
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                />
                <div className="mt-1 text-[0.7rem] text-slate-400 text-right">
                  {formText.length}/500
                </div>
              </div>

              {formError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {formError}
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  className="text-xs text-slate-500 hover:text-slate-700"
                  onClick={handleFormCancel}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60"
                  disabled={submitting}
                >
                  {submitting ? "Posting…" : "Post to wall"}
                </button>
              </div>
            </form>

            <div className="mt-4 border-t border-slate-200 pt-3">
              <p className="text-[0.7rem] text-slate-500">
                How it works: double-click anywhere on the wall to choose a spot, fill in this form,
                and your note will appear at that location. Others can zoom and pan to discover it.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityCanvas;
