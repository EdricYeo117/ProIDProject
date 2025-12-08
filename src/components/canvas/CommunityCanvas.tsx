import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

type MessageColor = "sky" | "emerald" | "amber" | "violet";

type Message = {
  id: string;
  x: number;
  y: number;
  text: string;
  author?: string;
  createdAt: string;
  boardKey?: string;
  color?: MessageColor;
};

type Board = {
  boardId: number;
  boardKey: string;
  title: string;
  description?: string | null;
  worldWidth?: number;
  worldHeight?: number;
  isActive: string;
  createdAt: string;
};

const WORLD_SIZE = 5000;
const API_BASE = "http://localhost:8080";

const COLOR_STYLES: Record<MessageColor, string> = {
  sky: "border-sky-500 shadow-sky-900/40",
  emerald: "border-emerald-500 shadow-emerald-900/40",
  amber: "border-amber-400 shadow-amber-900/40",
  violet: "border-violet-500 shadow-violet-900/40",
};

const DOT_STYLES: Record<MessageColor, string> = {
  sky: "bg-sky-400 shadow-sky-500/50",
  emerald: "bg-emerald-400 shadow-emerald-500/50",
  amber: "bg-amber-400 shadow-amber-500/50",
  violet: "bg-violet-400 shadow-violet-500/50",
};

const COLOR_OPTIONS: { value: MessageColor; label: string }[] = [
  { value: "sky", label: "Memory" },
  { value: "emerald", label: "Gratitude" },
  { value: "amber", label: "Milestone" },
  { value: "violet", label: "Fun / Random" },
];

const CommunityCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [scale, setScale] = useState(0.2);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [offsetStart, setOffsetStart] = useState({ x: 0, y: 0 });

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // boards
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardKey, setSelectedBoardKey] = useState<string | null>(null);
  const [boardsLoading, setBoardsLoading] = useState(true);
  const [boardsError, setBoardsError] = useState<string | null>(null);

  // new-board form
  const [newBoardOpen, setNewBoardOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [newBoardKey, setNewBoardKey] = useState("");
  const [newBoardDesc, setNewBoardDesc] = useState("");
  const [newBoardError, setNewBoardError] = useState<string | null>(null);
  const [creatingBoard, setCreatingBoard] = useState(false);

  // message form
  const [formOpen, setFormOpen] = useState(false);
  const [formAuthor, setFormAuthor] = useState("");
  const [formText, setFormText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingCoords, setPendingCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formColor, setFormColor] = useState<MessageColor>("sky");

  /* ---------- Load boards ---------- */
  // center the world initially
useEffect(() => {
  if (!containerRef.current) return;

  const rect = containerRef.current.getBoundingClientRect();
  const initialScale = scale; // 0.2 by default
  const worldPxWidth = WORLD_SIZE * initialScale;
  const worldPxHeight = WORLD_SIZE * initialScale;

  setOffset({
    x: (rect.width - worldPxWidth) / 2,
    y: (rect.height - worldPxHeight) / 2,
  });
}, []); // run once

// load boards list
  useEffect(() => {
    const loadBoards = async () => {
      setBoardsLoading(true);
      setBoardsError(null);
      try {
        const res = await fetch(`${API_BASE}/api/boards`);
        if (!res.ok) throw new Error("Failed to load boards");
        const data = (await res.json()) as Board[];
        setBoards(data);
        if (!selectedBoardKey && data.length > 0) {
          setSelectedBoardKey(data[0].boardKey);
        }
      } catch (err) {
        console.error(err);
        setBoardsError("Failed to load boards");
      } finally {
        setBoardsLoading(false);
      }
    };

    loadBoards();
  }, []);

  /* ---------- WebSocket: retrieve + live updates per board ---------- */
  useEffect(() => {
    if (!selectedBoardKey) return;

    let isMounted = true;
    setMessages([]);
    setLoading(true);

    const socket = io(API_BASE, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("Connected to canvas socket:", socket.id);
      socket.emit("canvas:join", { boardKey: selectedBoardKey });
    });

    socket.on(
      "canvas:init",
      (payload: { boardKey: string; messages: Message[] }) => {
        if (!isMounted) return;
        if (payload.boardKey !== selectedBoardKey) return;
        setMessages(payload.messages);
        setLoading(false);
      }
    );

    socket.on("canvas:init-error", (payload: { message: string }) => {
      console.error("Canvas init error:", payload);
      if (isMounted) setLoading(false);
    });

    socket.on("canvas:new-message", (msg: Message) => {
      if (msg.boardKey && msg.boardKey !== selectedBoardKey) return;
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
  }, [selectedBoardKey]);

  /* ---------- Canvas helpers ---------- */

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

  /* ---------- Message form ---------- */

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (formOpen || !containerRef.current) return;
    if (!selectedBoardKey) {
      alert("Please select or create a board first.");
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const world = screenToWorld(mouseX, mouseY);

    setPendingCoords(world);
    setFormAuthor("");
    setFormText("");
    setFormColor("sky"); // default each time
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

    if (!selectedBoardKey) {
      setFormError("Please select a board before posting.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const body = {
      boardKey: selectedBoardKey,
      x: pendingCoords.x,
      y: pendingCoords.y,
      text: formText.trim(),
      author: formAuthor.trim() || "Anonymous",
      color: formColor,
    };

    try {
      const res = await fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save message");
      }

      // server will broadcast canvas:new-message; we just close the form
      setFormOpen(false);
      setPendingCoords(null);
      setFormText("");
      setFormAuthor("");
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "Something went wrong saving your message.");
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

  /* ---------- New board form ---------- */

  const handleCreateBoardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) {
      setNewBoardError("Title is required.");
      return;
    }

    setCreatingBoard(true);
    setNewBoardError(null);

    try {
      const res = await fetch(`${API_BASE}/api/boards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newBoardTitle.trim(),
          boardKey: newBoardKey.trim() || undefined,
          description: newBoardDesc.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create board");
      }

      const created = (await res.json()) as Board;
      setBoards((prev) => [...prev, created]);
      setSelectedBoardKey(created.boardKey);
      setNewBoardOpen(false);
    } catch (err: any) {
      console.error(err);
      setNewBoardError(err.message || "Failed to create board");
    } finally {
      setCreatingBoard(false);
    }
  };

  /* ---------- Render ---------- */

  return (
    <div className="w-full h-[calc(100vh-64px)] bg-slate-900 flex flex-col">
      <div className="p-3 text-sm text-slate-100 flex items-center gap-4 border-b border-slate-700">
        <div className="font-semibold text-base">Community Memory Wall</div>

        {/* Board selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300">Board:</span>
          <select
            className="text-xs bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-slate-100"
            value={selectedBoardKey ?? ""}
            onChange={(e) => setSelectedBoardKey(e.target.value || null)}
            disabled={boardsLoading || boards.length === 0}
          >
            {boards.map((b) => (
              <option key={b.boardKey} value={b.boardKey}>
                {b.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setNewBoardOpen(true);
              setNewBoardTitle("");
              setNewBoardKey("");
              setNewBoardDesc("");
              setNewBoardError(null);
            }}
            className="text-xs px-2 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white"
          >
            New board
          </button>
          {boardsError && (
            <span className="text-[0.7rem] text-red-400">{boardsError}</span>
          )}
        </div>

        <div>Zoom: {(scale * 100).toFixed(0)}%</div>
        {loading && <div className="text-slate-400">Loading messages…</div>}
        <div className="ml-auto text-xs text-slate-400">
          Scroll to zoom • drag to pan • double-click anywhere to leave a note
        </div>
      </div>

{/* canvas area */}
<div className="flex-1 flex items-center justify-center bg-slate-900">
  <div
    ref={containerRef}
    className="
      relative
      w-[min(1400px,96vw)]    /* wider */
      h-[min(800px,82vh)]     /* taller */
      rounded-[32px]
      border-2 border-slate-600/70   /* thicker border */
      bg-slate-950/80
      shadow-[0_0_140px_rgba(15,23,42,1)]
      overflow-hidden
      cursor-grab active:cursor-grabbing
    "
    onWheel={handleWheel}
    onMouseDown={handleMouseDown}
    onMouseMove={handleMouseMove}
    onMouseUp={handleMouseUp}
    onMouseLeave={handleMouseLeave}
    onDoubleClick={handleDoubleClick}
  >
    <div
      className="absolute bg-slate-900"
      style={{
        width: WORLD_SIZE,
        height: WORLD_SIZE,
        transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
        transformOrigin: "0 0",
        backgroundImage:
          "radial-gradient(circle, rgba(148,163,184,0.15) 1px, transparent 0)",
        backgroundSize: "40px 40px",
      }}
    >
          {messages.map((m) => {
            const color = m.color ?? "sky";
            return (
              <div
                key={m.id}
                className="absolute group"
                style={{ left: m.x, top: m.y }}
              >
                {/* anchor dot */}
                <div
                  className={`w-3 h-3 rounded-full shadow-md group-hover:scale-110 transition-transform ${DOT_STYLES[color]}`}
                />

                {showFullText && (
                  <div
                    className={`
                      mt-2 max-w-xs rounded-2xl bg-slate-900/95 px-3 py-2 text-xs text-slate-100
                      shadow-xl backdrop-blur-sm border relative
                      ${COLOR_STYLES[color]}
                    `}
                  >
                    {/* tail */}
                    <div className="absolute -top-1 left-3 w-2 h-2 bg-slate-900 border-l border-t border-sky-500/70 rotate-45" />

                    <div className="font-semibold text-[0.75rem] text-sky-300">
                      {m.author ?? "Anonymous"}
                    </div>
                    <div className="mt-1 leading-snug text-[0.78rem]">
                      {m.text}
                    </div>
                    <div className="mt-2 text-[0.65rem] text-slate-400 flex items-center justify-between">
                      <span>
                        {new Date(m.createdAt).toLocaleDateString("en-SG", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span>
                        {new Date(m.createdAt).toLocaleTimeString("en-SG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      </div>

      {/* Message overlay */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              Leave a note on the Memory Wall
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              This board is a shared space. Add a short, positive message about
              your memories, experiences, or appreciation. Please keep it
              respectful and suitable for the NP community.
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

              {/* style selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  Message style (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((opt) => {
                    const selected = formColor === opt.value;
                    const dotClass = DOT_STYLES[opt.value];
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormColor(opt.value)}
                        className={`flex items-center gap-2 px-2 py-1 rounded-full border text-[0.7rem] ${
                          selected
                            ? "border-sky-600 bg-sky-50 text-sky-800"
                            : "border-slate-200 bg-white text-slate-700 hover:border-sky-300"
                        }`}
                      >
                        <span
                          className={`w-3 h-3 rounded-full shadow ${dotClass}`}
                        />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
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
                How it works: double-click anywhere on the wall to choose a
                spot, pick a style, and your note will appear at that location.
                Others can zoom and pan to discover it.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* New board overlay */}
      {newBoardOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              Create a new board
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              For example: “NP Memory Wall 2026”, “Open House 2026”, or “Alumni
              Stories”.
            </p>

            <form className="space-y-3" onSubmit={handleCreateBoardSubmit}>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Title
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="e.g. NP Memory Wall 2026"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Board key (optional, A–Z, 0–9, -)
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="e.g. NP-MEMORY-WALL-2026"
                  value={newBoardKey}
                  onChange={(e) => setNewBoardKey(e.target.value.toUpperCase())}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 min-h-[60px]"
                  value={newBoardDesc}
                  onChange={(e) => setNewBoardDesc(e.target.value)}
                />
              </div>

              {newBoardError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {newBoardError}
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  className="text-xs text-slate-500 hover:text-slate-700"
                  onClick={() => setNewBoardOpen(false)}
                  disabled={creatingBoard}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60"
                  disabled={creatingBoard}
                >
                  {creatingBoard ? "Creating…" : "Create board"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityCanvas;
