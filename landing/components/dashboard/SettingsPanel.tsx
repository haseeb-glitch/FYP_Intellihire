'use client';
import { useState } from 'react';
import { GlassCard } from './shared';

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} style={{ width: 46, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer', background: value ? '#c8f53a' : 'rgba(0,0,0,0.12)', position: 'relative', transition: 'background .3s' }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: value ? 23 : 3, transition: 'left .25s', boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }} />
    </button>
  );
}

export default function SettingsPanel() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [twoFA, setTwoFA] = useState(true);

  const rows = [
    { label: 'Push Notifications', sub: 'Receive alerts for transactions', val: notifications, set: () => setNotifications(v => !v) },
    { label: 'Dark Mode',          sub: 'Switch to dark theme',             val: darkMode,       set: () => setDarkMode(v => !v) },
    { label: 'Two-Factor Auth',    sub: 'Extra security layer',             val: twoFA,          set: () => setTwoFA(v => !v) },
  ];

  return (
    <div style={{ animation: 'fadeSlideIn .4s ease both' }}>
      <GlassCard>
        <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 18, color: '#1a2a10' }}>Settings</div>
        {rows.map((s, i) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < 2 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1a2a10' }}>{s.label}</div>
              <div style={{ fontSize: 11, color: '#888' }}>{s.sub}</div>
            </div>
            <Toggle value={s.val} onChange={s.set} />
          </div>
        ))}
      </GlassCard>
    </div>
  );
}
