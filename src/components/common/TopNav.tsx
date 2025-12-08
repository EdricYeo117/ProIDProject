// components/common/TopNav.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import { Users, ShieldPlus, History, MessageCircle } from "lucide-react";

const linkBase =
  "inline-flex items-center gap-2 px-3 py-2 rounded-xl font-semibold border-2 transition-colors text-sm";

export default function TopNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="text-[20px] font-black tracking-wide text-sky-900">
          NP Hall of Fame
        </div>

        <nav className="flex gap-2">
          <NavLink
            to="/hall-of-fame"
            className={({ isActive }) =>
              [
                linkBase,
                isActive
                  ? "bg-sky-900 text-white border-sky-900"
                  : "text-sky-900 border-transparent hover:border-sky-900/60 hover:bg-sky-50",
              ].join(" ")
            }
          >
            <Users size={18} />
            Hall of Fame
          </NavLink>

          <NavLink
            to="/timeline"
            className={({ isActive }) =>
              [
                linkBase,
                isActive
                  ? "bg-sky-900 text-white border-sky-900"
                  : "text-sky-900 border-transparent hover:border-sky-900/60 hover:bg-sky-50",
              ].join(" ")
            }
          >
            <History size={18} />
            Timeline
          </NavLink>

          <NavLink
            to="/community-canvas"
            className={({ isActive }) =>
              [
                linkBase,
                "border-amber-400",
                isActive
                  ? "bg-amber-100 text-sky-900"
                  : "text-sky-900 hover:bg-amber-50",
              ].join(" ")
            }
          >
            <MessageCircle size={18} />
            Community Canvas
          </NavLink>

          <NavLink
            to="/admin"
            className={({ isActive }) =>
              [
                linkBase,
                "border-amber-400",
                isActive
                  ? "bg-amber-100 text-sky-900"
                  : "text-sky-900 hover:bg-amber-50",
              ].join(" ")
            }
          >
            <ShieldPlus size={18} />
            Admin
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
