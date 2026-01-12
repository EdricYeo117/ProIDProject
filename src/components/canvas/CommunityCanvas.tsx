// src/components/canvas/CommunityCanvas.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type MessageColor = "sky" | "emerald" | "amber" | "violet";

type ReactionsMap = Record<string, number>; // emoji -> count

type Message = {
  id: string;
  x: number;
  y: number;
  text: string;
  author?: string;
  createdAt: string;
  boardKey?: string;
  color?: MessageColor;

  // author-picked “emotion” for the note itself (single emoji)
  feel?: string | null;

  // aggregated counters (real-time)
  reactions?: ReactionsMap;
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

// Note border styles by category color
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
  violet: "bg-violet-400 shadow-amber-500/50",
};

const FEEL_GLOW: Record<string, string> = {
  "❤️": "ring-1 ring-rose-400/40 shadow-[0_0_40px_rgba(244,63,94,0.18)]",
  "😂": "ring-1 ring-amber-300/40 shadow-[0_0_40px_rgba(251,191,36,0.18)]",
  "🥹": "ring-1 ring-sky-300/40 shadow-[0_0_40px_rgba(56,189,248,0.18)]",
  "🔥": "ring-1 ring-orange-400/40 shadow-[0_0_40px_rgba(249,115,22,0.20)]",
  "🙏": "ring-1 ring-violet-300/40 shadow-[0_0_40px_rgba(167,139,250,0.18)]",
  "🤯": "ring-1 ring-emerald-300/40 shadow-[0_0_40px_rgba(52,211,153,0.18)]",
};

const FEEL_GRADIENT: Record<string, string> = {
  "❤️": "bg-gradient-to-r from-rose-500/70 via-pink-500/50 to-fuchsia-500/40",
  "😂": "bg-gradient-to-r from-amber-400/70 via-yellow-300/50 to-orange-400/40",
  "🥹": "bg-gradient-to-r from-sky-400/70 via-cyan-300/50 to-blue-400/40",
  "🔥": "bg-gradient-to-r from-orange-500/70 via-amber-400/50 to-red-500/40",
  "🙏": "bg-gradient-to-r from-violet-400/70 via-fuchsia-400/50 to-indigo-400/40",
  "🤯": "bg-gradient-to-r from-emerald-400/70 via-teal-300/50 to-lime-400/40",
};


const COLOR_OPTIONS: { value: MessageColor; label: string }[] = [
  { value: "sky", label: "Memory" },
  { dramatic: undefined as never, value: "emerald", label: "Gratitude" },
  { value: "amber", label: "Milestone" },
  { value: "violet", label: "Fun / Random" },
];

// Single “feel” emoji for the note author
const FEEL_OPTIONS: { value: string; label: string }[] = [
  { value: "❤️", label: "Loved it" },
  { value: "😂", label: "Funny" },
  { value: "🥹", label: "Emotional" },
  { value: "🔥", label: "Proud / hype" },
  { value: "🙏", label: "Grateful" },
  { value: "🤯", label: "Mind-blown" },
];

// Reaction bar emojis (counters)
const REACTION_OPTIONS: string[] = ["❤️", "👏", "😂", "😮", "🙏"];

// Stable per-browser identity used to prevent accidental multi-spam (and for backend uniqueness if you enforce it)
const reactorKey =
  localStorage.getItem("canvas_reactor_key") ??
  (() => {
    const v = crypto.randomUUID();
    localStorage.setItem("canvas_reactor_key", v);
    return v;
  })();

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const CommunityCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

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
  const [formFeel, setFormFeel] = useState<string>("❤️"); // author “emotion”

  // Only one note open at a time (prevents overlapping cards)
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  // small client-side debounce to avoid accidental double taps
  const [reactionBusy, setReactionBusy] = useState<Record<string, boolean>>({}); // key: `${msgId}:${emoji}`

  /* ---------- Center world initially ---------- */
  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const initialScale = scale;
    const worldPxWidth = WORLD_SIZE * initialScale;
    const worldPxHeight = WORLD_SIZE * initialScale;

    setOffset({
      x: (rect.width - worldPxWidth) / 2,
      y: (rect.height - worldPxHeight) / 2,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Load boards ---------- */
  useEffect(() => {
    const loadBoards = async () => {
      setBoardsLoading(true);
      setBoardsError(null);
      try {
        const res = await fetch(`${API_BASE}/api/boards`);
        if (!res.ok) throw new Error("Failed to load boards");
        const data = (await res.json()) as Board[];
        setBoards(data);
        if (!selectedBoardKey && data.length > 0)
          setSelectedBoardKey(data[0].boardKey);
      } catch (err) {
        console.error(err);
        setBoardsError("Failed to load boards");
      } finally {
        setBoardsLoading(false);
      }
    };
    loadBoards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- WebSocket: init + live updates per board ---------- */
  useEffect(() => {
    if (!selectedBoardKey) return;

    let isMounted = true;
    setMessages([]);
    setLoading(true);
    setActiveMessageId(null);

    // clean existing socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(API_BASE, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("canvas:join", { boardKey: selectedBoardKey });
    });

    socket.on(
      "canvas:init",
      (payload: { boardKey: string; messages: Message[] }) => {
        if (!isMounted) return;
        if (payload.boardKey !== selectedBoardKey) return;
        setMessages(payload.messages ?? []);
        setLoading(false);
      }
    );

    socket.on("canvas:init-error", (payload: { message: string }) => {
      console.error("Canvas init error:", payload);
      if (isMounted) setLoading(false);
    });

    socket.on("canvas:new-message", (msg: Message) => {
      if (!isMounted) return;
      if (msg.boardKey && msg.boardKey !== selectedBoardKey) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // Real-time counter updates
    socket.on(
      "canvas:reaction-update",
      (payload: {
        messageId: string | number;
        emoji: string;
        count: number;
      }) => {
        if (!isMounted) return;

        const mid = String(payload.messageId);

        setMessages((prev) =>
          prev.map((msg) => {
            if (String(msg.id) !== mid) return msg;
            return {
              ...msg,
              reactions: {
                ...(msg.reactions ?? {}),
                [payload.emoji]: payload.count,
              },
            };
          })
        );
      }
    );
    socket.on("disconnect", () => {
      // optional logging
    });

    return () => {
      isMounted = false;
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [selectedBoardKey]);

  /* ---------- Canvas helpers ---------- */
  const screenToWorld = (screenX: number, screenY: number) => ({
    x: (screenX - offset.x) / scale,
    y: (screenY - offset.y) / scale,
  });

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
    newScale = clamp(newScale, 0.05, 3);

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
    setOffset({ x: offsetStart.x + dx, y: offsetStart.y + dy });
  };

  const handleMouseUp = () => setIsPanning(false);
  const handleMouseLeave = () => setIsPanning(false);

  /* ---------- Open note (prevents overlap) ---------- */
  const toggleOpenMessage = (id: string) => {
    setActiveMessageId((curr) => (curr === id ? null : id));
  };

  /* ---------- Add reaction (real-time) ---------- */
  const sendReaction = (messageId: string, emoji: string) => {
    if (!selectedBoardKey) return;

    const socket = socketRef.current;
    if (!socket || !socket.connected) return;

    const busyKey = `${messageId}:${emoji}`;
    if (reactionBusy[busyKey]) return;

    setReactionBusy((p) => ({ ...p, [busyKey]: true }));

    socket.emit("canvas:react", {
      boardKey: selectedBoardKey,
      messageId,
      emoji,
    });

    window.setTimeout(() => {
      setReactionBusy((p) => {
        const next = { ...p };
        delete next[busyKey];
        return next;
      });
    }, 120); // keep small debounce for double-taps; reduce/remove if you want
  };

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
    setFormColor("sky");
    setFormFeel("❤️");
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
      feel: formFeel, // author “emotion”
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

  const showCards = scale > 0.5;

  const boardTitle = useMemo(() => {
    const b = boards.find((x) => x.boardKey === selectedBoardKey);
    return b?.title ?? "Community Memory Wall";
  }, [boards, selectedBoardKey]);

  /* ---------- Render ---------- */
  return (
    <div className="w-full h-[calc(100vh-64px)] bg-slate-900 flex flex-col">
      <div className="p-3 text-sm text-slate-100 flex items-center gap-4 border-b border-slate-700">
        <div className="font-semibold text-base">{boardTitle}</div>

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

        <div className="text-xs text-slate-300">
          Zoom: {(scale * 100).toFixed(0)}%
        </div>
        {loading && (
          <div className="text-slate-400 text-xs">Loading messages…</div>
        )}

        <div className="ml-auto text-xs text-slate-400">
          Scroll to zoom • drag to pan • double-click to leave a note • click a
          dot to open
        </div>
      </div>

      {/* canvas area */}
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div
          ref={containerRef}
          className="
            relative
            w-[min(1400px,96vw)]
            h-[min(800px,82vh)]
            rounded-[32px]
            border-2 border-slate-600/70
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
              const isOpen = activeMessageId === m.id;
              const feelFrame = m.feel ? (FEEL_GRADIENT[m.feel] ?? "") : "";
              const feelGlow = m.feel ? (FEEL_GLOW[m.feel] ?? "") : "";
              return (
                <div
                  key={m.id}
                  className="absolute"
                  style={{ left: m.x, top: m.y, zIndex: isOpen ? 50 : 1 }}
                  onMouseDown={(e) => e.stopPropagation()} // prevent panning when interacting with note
                  onDoubleClick={(e) => e.stopPropagation()} // prevent creating note over existing
                >
                  {/* anchor dot */}
                  <button
                    type="button"
                    className={`w-3 h-3 rounded-full shadow-md transition-transform hover:scale-110 ${DOT_STYLES[color]}`}
                    title="Open note"
                    onClick={() => toggleOpenMessage(m.id)}
                  />

{/* card (only one open at a time => no overlap mess) */}
{showCards && isOpen && (
  <div
    className={`mt-2 w-[360px] max-w-[360px] rounded-2xl p-[1px] ${feelFrame}`}
  >
    <div
      className={`
        rounded-2xl bg-slate-900/95 px-4 py-3
        text-xs text-slate-100 shadow-xl backdrop-blur-sm
        border relative
        ${COLOR_STYLES[color]}
        ${feelGlow}
      `}
    >
      {/* tail */}
      <div className="absolute -top-1 left-3 w-2 h-2 bg-slate-900 border-l border-t border-sky-500/70 rotate-45" />

      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-[0.8rem] text-sky-300">
            {m.author ?? "Anonymous"}
          </div>
          <div className="mt-1 leading-snug text-[0.82rem] break-words">
            {m.text}
          </div>
        </div>

        {/* author “feel” */}
        {m.feel ? (
          <div
            className={`
              shrink-0 w-8 h-8 rounded-full
              bg-slate-800/70 border border-slate-600
              flex items-center justify-center text-base
              ${FEEL_GLOW[m.feel] ?? ""}
            `}
            title="Note feel"
          >
            {m.feel}
          </div>
        ) : null}
      </div>

      <div className="mt-2 text-[0.7rem] text-slate-400 flex items-center justify-between">
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

      {/* reactions */}
      <div className="mt-3">
        <div className="text-[0.7rem] text-slate-400 mb-1">React to this note</div>
        <div className="flex flex-wrap gap-2">
          {REACTION_OPTIONS.map((emoji) => {
            const count = m.reactions?.[emoji] ?? 0;
            const busyKey = `${m.id}:${emoji}`;
            const busy = !!reactionBusy[busyKey];

            return (
              <button
                key={emoji}
                type="button"
                className={`
                  flex items-center gap-2
                  px-2.5 py-1.5 rounded-full
                  border border-slate-700 bg-slate-950/60
                  hover:border-sky-500/60 hover:bg-slate-950
                  text-[0.75rem]
                  disabled:opacity-60
                `}
                onClick={() => sendReaction(m.id, emoji)}
                disabled={busy}
                title="Add reaction"
              >
                <span className="text-sm">{emoji}</span>
                <span className="text-slate-200 tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          className="text-[0.7rem] text-slate-400 hover:text-slate-200"
          onClick={() => setActiveMessageId(null)}
        >
          Close
        </button>
      </div>
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
              This board is a shared space. Add a short, positive message.
              Please keep it respectful and suitable for the NP community.
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

              {/* note category */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  Message category
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

              {/* author “feel” */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  How does this note feel?
                </label>
                <div className="flex flex-wrap gap-2">
                  {FEEL_OPTIONS.map((opt) => {
                    const selected = formFeel === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormFeel(opt.value)}
                        className={`flex items-center gap-2 px-2 py-1 rounded-full border text-[0.7rem] ${
                          selected
                            ? "border-sky-600 bg-sky-50 text-sky-800"
                            : "border-slate-200 bg-white text-slate-700 hover:border-sky-300"
                        }`}
                      >
                        <span className="text-sm">{opt.value}</span>
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
                How it works: double-click to choose a spot. Your note is pinned
                to that location. Others can zoom and pan to discover it.
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
              For example: “NP Memory Wall 2026”, “Open House 2026”.
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
