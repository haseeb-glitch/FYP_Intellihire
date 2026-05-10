'use client';
import { GlassCard } from './shared';

const txns = [
  { id: 1, name: 'Netflix',   date: 'Mar 18', amount: -15.99, category: 'Entertainment', icon: '🎬' },
  { id: 2, name: 'Salary',    date: 'Mar 15', amount: +4200,  category: 'Income',        icon: '💼' },
  { id: 3, name: 'Grocery',   date: 'Mar 14', amount: -87.50, category: 'Food',          icon: '🛒' },
  { id: 4, name: 'Uber',      date: 'Mar 13', amount: -23.00, category: 'Transport',     icon: '🚗' },
  { id: 5, name: 'Amazon',    date: 'Mar 12', amount: -134.0, category: 'Shopping',      icon: '📦' },
  { id: 6, name: 'Freelance', date: 'Mar 10', amount: +800,   category: 'Income',        icon: '💻' },
];

export default function TransactionsPanel() {
  return (
    <div style={{ animation: 'fadeSlideIn .4s ease both' }}>
      <GlassCard>
        <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 18, color: '#1a2a10' }}>Recent Transactions</div>
        {txns.map((t, i) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < txns.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none', animation: `fadeSlideIn .35s ease ${i * 0.06}s both` }}>
            <div style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(200,245,58,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{t.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1a2a10' }}>{t.name}</div>
              <div style={{ fontSize: 11, color: '#888' }}>{t.category} · {t.date}</div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: t.amount > 0 ? '#5a8a00' : '#c0392b' }}>
              {t.amount > 0 ? '+' : ''}${Math.abs(t.amount).toFixed(2)}
            </div>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}
