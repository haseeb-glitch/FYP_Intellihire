'use client';
import React from 'react';

export function GlassCard({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', borderRadius: 20, border: '1.5px solid rgba(255,255,255,0.75)', boxShadow: '0 4px 32px rgba(100,160,220,0.13), 0 1.5px 6px rgba(120,180,240,0.08)', padding: 20, ...style }} className={className}>{children}</div>
  );
}

export function Badge({ text, positive }: { text: string; positive: boolean }) {
  return (
    <span style={{ background: positive ? 'rgba(190,240,80,0.22)' : 'rgba(255,80,80,0.15)', color: positive ? '#5a8a00' : '#c0392b', borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 700, letterSpacing: 0.3 }}>{text}</span>
  );
}

export function AnimatedBlob() {
  return (
    <div style={{ position: 'relative', width: 190, height: 190, margin: '0 auto' }}>
      <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at 40% 35%, #e8ff80 0%, #b8f000 45%, #7ab800 100%)', animation: 'morphBlob 6s ease-in-out infinite, blobGlow 3s ease-in-out infinite', boxShadow: '0 0 60px 18px rgba(190,240,40,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: '#2a4000', letterSpacing: -1 }}>$12 450</span>
        <span style={{ marginTop: 6, background: 'rgba(0,0,0,0.18)', borderRadius: 999, padding: '2px 14px', fontSize: 12, fontWeight: 600, color: '#fff' }}>Savings</span>
      </div>
    </div>
  );
}

export const dashboardKeyframes = `
  @keyframes morphBlob {
    0%,100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
    25%      { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
    50%      { border-radius: 50% 60% 30% 60% / 40% 50% 60% 50%; }
    75%      { border-radius: 40% 60% 60% 40% / 60% 40% 30% 70%; }
  }
  @keyframes blobGlow {
    0%,100% { opacity: 0.85; transform: scale(1); }
    50%      { opacity: 1;   transform: scale(1.05); }
  }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(100,160,220,0.3); border-radius: 4px; }
`;
