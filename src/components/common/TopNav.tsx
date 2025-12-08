import React from "react";
import { NavLink } from "react-router-dom";
import { Users, ShieldPlus, History, MessageCircle } from "lucide-react";

const NP_BLUE = "#003D5C";
const NP_GOLD = "#FFB81C";

const base: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 14px",
  borderRadius: 10,
  fontWeight: 700,
  textDecoration: "none",
  border: "2px solid transparent",
};

export default function TopNav() {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 24px",
        borderBottom: "1px solid #e5e7eb",
        background: "#ffffff",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        style={{
          fontWeight: 900,
          fontSize: 20,
          color: NP_BLUE,
          letterSpacing: 0.5,
        }}
      >
        NP Hall of Fame
      </div>

      <nav style={{ display: "flex", gap: 12 }}>
        <NavLink
          to="/hall-of-fame"
          style={({ isActive }) => ({
            ...base,
            color: isActive ? "#fff" : NP_BLUE,
            background: isActive ? NP_BLUE : "transparent",
            borderColor: isActive ? NP_BLUE : "transparent",
          })}
        >
          <Users size={18} />
          Hall of Fame
        </NavLink>

        <NavLink
          to="/timeline"
          style={({ isActive }) => ({
            ...base,
            color: isActive ? "#fff" : NP_BLUE,
            background: isActive ? NP_BLUE : "transparent",
            borderColor: isActive ? NP_BLUE : "transparent",
          })}
        >
          <History size={18} />
          Timeline
        </NavLink>

        <NavLink
          to="/community-canvas"
          style={({ isActive }) => ({
            ...base,
            color: NP_BLUE,
            background: isActive ? `${NP_GOLD}33` : "transparent",
            borderColor: NP_GOLD,
          })}
        >
          <MessageCircle size={18} />
          Community Canvas
        </NavLink>

        <NavLink
          to="/admin"
          style={({ isActive }) => ({
            ...base,
            color: NP_BLUE,
            background: isActive ? `${NP_GOLD}33` : "transparent",
            borderColor: NP_GOLD,
          })}
        >
          <ShieldPlus size={18} />
          Admin
        </NavLink>
      </nav>
    </header>
  );
}
