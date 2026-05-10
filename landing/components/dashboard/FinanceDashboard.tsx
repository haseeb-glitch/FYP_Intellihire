'use client';
import { useState, useEffect } from 'react';
import { dashboardKeyframes } from './shared';
import OverviewPanel from './OverviewPanel';
import TransactionsPanel from './TransactionsPanel';
import AnalyticsPanel from './AnalyticsPanel';
import SettingsPanel from './SettingsPanel';

const TABS = ['Overview', 'Transactions', 'Analytics', 'Settings'];
const navIcons = ['⊞', '⊟', '☁', '((·))', '⚙', '🔍'];

export default function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  const panels = [<OverviewPanel key="overview" />, <TransactionsPanel key="txns" />, <AnalyticsPanel key="analytics" />, <SettingsPanel key="settings" />];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #c8e6f5 0%, #b0d8f0 30%, #a0ccee 60%, #90bfe8 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'SF Pro Display', 'Helvetica Neue', sans-serif" }}>
      <style>{dashboardKeyframes}</style>

      {/* Top Bar */}
      <div style={{ width: '100%', maxWidth: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(16px)', borderRadius: 18, padding: '10px 22px', marginBottom: 16, border: '1.5px solid rgba(255,255,255,0.75)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #c8f53a, #7ab800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#1a2a10' }}>Welcome back, Adam!</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1a2a10' }}>{fmt(time)}</div>
          <div style={{ fontSize: 11, color: '#666' }}>{fmtDate(time)}</div>
        </div>
      </div>

      {/* Shell */}
      <div style={{ width: '100%', maxWidth: '100%', display: 'flex', gap: 14, background: 'rgba(200,230,248,0.45)', backdropFilter: 'blur(12px)', borderRadius: 28, border: '1.5px solid rgba(255,255,255,0.65)', padding: 14, boxShadow: '0 8px 48px rgba(80,140,200,0.18)' }}>
        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.5)', borderRadius: 20, padding: '18px 10px', border: '1.5px solid rgba(255,255,255,0.7)' }}>
          {navIcons.map((icon, i) => (
            <button key={i} style={{ width: 44, height: 44, borderRadius: 14, background: i === 0 ? 'rgba(200,245,58,0.25)' : 'transparent', border: i === 0 ? '1.5px solid rgba(200,245,58,0.5)' : '1.5px solid transparent', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s, transform .15s', color: '#000' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,245,58,0.15)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = i === 0 ? 'rgba(200,245,58,0.25)' : 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}>
              {icon}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.4)', borderRadius: 14, padding: 5 }}>
            {TABS.map((tab, i) => (
              <button key={tab} onClick={() => setActiveTab(i)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: i === activeTab ? 700 : 500, fontSize: 13, background: i === activeTab ? 'linear-gradient(135deg, #c8f53a 0%, #a0c820 100%)' : 'transparent', color: i === activeTab ? '#1a2a10' : '#666', boxShadow: i === activeTab ? '0 2px 12px rgba(160,200,30,0.3)' : 'none', transition: 'all .28s cubic-bezier(.4,0,.2,1)', transform: i === activeTab ? 'translateY(-1px)' : 'translateY(0)' }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Panel */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {panels[activeTab]}
          </div>
        </div>
      </div>

      {/* Bottom toolbar */}
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', borderRadius: 18, padding: '10px 24px', border: '1.5px solid rgba(255,255,255,0.75)' }}>
        {['↺', '↻'].map((s, i) => (
          <button key={i} style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer', color: '#555', transition: 'transform .2s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.2)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
            {s}
          </button>
        ))}
        <div style={{ background: 'rgba(200,245,58,0.2)', borderRadius: 10, padding: '4px 14px', fontSize: 13, fontWeight: 700, color: '#4a6010' }}>40%</div>
        <div style={{ width: 1, height: 24, background: 'rgba(0,0,0,0.1)' }} />
        {['⊞', '⏱', 'T', '⊡', '🖼', '⊟'].map((ic, i) => (
          <button key={i} style={{ background: 'transparent', border: 'none', fontSize: 16, cursor: 'pointer', color: '#666', transition: 'color .15s, transform .15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#1a2a10'; e.currentTarget.style.transform = 'scale(1.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.transform = 'scale(1)'; }}>
            {ic}
          </button>
        ))}
      </div>
    </div>
  );
}
