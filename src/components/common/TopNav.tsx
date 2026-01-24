// components/common/TopNav.tsx
import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Users,
  ShieldPlus,
  History,
  MessageCircle,
  Menu,
  X,
} from "lucide-react";

const pillBase =
  "relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold " +
  "border transition-all duration-200 select-none";

const hoverSheen =
  "absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/25 to-transparent " +
  "translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700 pointer-events-none";

function navClass({
  isActive,
  variant,
}: {
  isActive: boolean;
  variant: "primary" | "canvas" | "admin";
}) {
  // Readable, not-too-dark active treatment:
  const primaryActive =
    "bg-sky-50 text-sky-900 border-sky-200 shadow-sm shadow-sky-900/5";
  const primaryIdle =
    "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-sky-900 hover:border-sky-200 hover:shadow-sm";

  // Canvas/Admin: amber outline with slightly richer active fill (still readable).
  const amberActive =
    "bg-amber-50 text-sky-900 border-amber-300 shadow-sm shadow-amber-900/10";
  const amberIdle =
    "bg-white text-slate-700 border-amber-200 hover:bg-amber-50 hover:text-sky-900 hover:border-amber-300 hover:shadow-sm";

  if (variant === "primary")
    return [pillBase, isActive ? primaryActive : primaryIdle].join(" ");
  return [pillBase, isActive ? amberActive : amberIdle].join(" ");
}

export default function TopNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-900 flex items-center justify-center shadow-sm">
            <Users size={22} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="text-xl font-black tracking-tight text-sky-900">
              Echoes of NP
            </div>
            <div className="text-xs font-medium text-slate-500 -mt-0.5">
              Ngee Ann Polytechnic
            </div>
          </div>
        </div>

        {/* Desktop */}
        <nav className="hidden md:flex items-center gap-2">
          <NavLink
            to="/hall-of-fame"
            className={({ isActive }) =>
              `group ${navClass({ isActive, variant: "primary" })}`
            }
          >
            <Users size={18} strokeWidth={2} />
            <span>Hall of Fame</span>
            <span className={hoverSheen} />
          </NavLink>

          <NavLink
            to="/timeline"
            className={({ isActive }) =>
              `group ${navClass({ isActive, variant: "primary" })}`
            }
          >
            <History size={18} strokeWidth={2} />
            <span>Timeline</span>
            <span className={hoverSheen} />
          </NavLink>

          <div className="mx-2 h-7 w-px bg-slate-200" />

          <NavLink
            to="/community-canvas"
            className={({ isActive }) =>
              `group ${navClass({ isActive, variant: "canvas" })}`
            }
          >
            <MessageCircle size={18} strokeWidth={2} />
            <span>Community Canvas</span>
            <span className={hoverSheen} />
          </NavLink>

          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `group ${navClass({ isActive, variant: "admin" })}`
            }
          >
            <ShieldPlus size={18} strokeWidth={2} />
            <span>Admin</span>
            <span className={hoverSheen} />
          </NavLink>
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X size={22} className="text-sky-900" />
          ) : (
            <Menu size={22} className="text-sky-900" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/70 bg-white/95 backdrop-blur-xl">
          <nav className="mx-auto max-w-7xl px-4 sm:px-6 py-4 space-y-2">
            <NavLink
              to="/hall-of-fame"
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-semibold border transition-colors",
                  isActive
                    ? "bg-sky-50 text-sky-900 border-sky-200"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-sky-900 hover:border-sky-200",
                ].join(" ")
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <Users size={20} />
              <span>Hall of Fame</span>
            </NavLink>

            <NavLink
              to="/timeline"
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-semibold border transition-colors",
                  isActive
                    ? "bg-sky-50 text-sky-900 border-sky-200"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-sky-900 hover:border-sky-200",
                ].join(" ")
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <History size={20} />
              <span>Timeline</span>
            </NavLink>

            <div className="my-2 h-px bg-slate-200" />

            <NavLink
              to="/community-canvas"
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-semibold border transition-colors",
                  isActive
                    ? "bg-amber-50 text-sky-900 border-amber-300"
                    : "bg-white text-slate-700 border-amber-200 hover:bg-amber-50 hover:text-sky-900 hover:border-amber-300",
                ].join(" ")
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <MessageCircle size={20} />
              <span>Community Canvas</span>
            </NavLink>

            <NavLink
              to="/admin"
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-semibold border transition-colors",
                  isActive
                    ? "bg-amber-50 text-sky-900 border-amber-300"
                    : "bg-white text-slate-700 border-amber-200 hover:bg-amber-50 hover:text-sky-900 hover:border-amber-300",
                ].join(" ")
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <ShieldPlus size={20} />
              <span>Admin</span>
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
}
