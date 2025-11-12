import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, ShieldPlus, History } from 'lucide-react';

const NP_BLUE = '#003D5C';
const NP_GOLD = '#FFB81C';

const base: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '10px 14px', borderRadius: 10, fontWeight: 700,
  textDecoration: 'none', border: '2px solid transparent'
};

export default function TopNav() {
  return (
    <div style={{ position:'sticky', top:0, zIndex:50, background:'#fff',
                  borderBottom:`3px solid ${NP_GOLD}`, boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', height:64,
                    display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Users size={24} color={NP_BLUE} />
          <span style={{ color:NP_BLUE, fontWeight:800, letterSpacing:.2 }}>NP Hall of Fame</span>
        </div>
        <nav style={{ display:'flex', gap:10 }}>
          <NavLink to="/" end
            style={({isActive}) => ({ ...base, color: isActive?'#fff':NP_BLUE,
              background: isActive?NP_BLUE:'transparent', borderColor: isActive?NP_BLUE:'transparent' })}>
            <Users size={18} /> Hall of Fame
          </NavLink>
          <NavLink to="/timeline"
            style={({isActive}) => ({ ...base, color: isActive?'#fff':NP_BLUE,
              background: isActive?NP_BLUE:'transparent', borderColor: isActive?NP_BLUE:'transparent' })}>
            <History size={18} /> Timeline
          </NavLink>
          <NavLink to="/admin/new-person"
            style={({isActive}) => ({ ...base, color: NP_BLUE,
              background: isActive?`${NP_GOLD}33`:'transparent', borderColor: NP_GOLD })}>
            <ShieldPlus size={18} /> Admin
          </NavLink>
        </nav>
      </div>
    </div>
  );
}
