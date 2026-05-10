'use client';
import { GlassCard, Badge } from './shared';
import { ResponsiveContainer, ComposedChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
const barData = months.map(m => ({ month: m, income: 30 + Math.random() * 40, expenses: 20 + Math.random() * 30 }));

export default function AnalyticsPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeSlideIn .4s ease both' }}>
      <GlassCard>
        <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 14, color: '#1a2a10' }}>Income vs Expenses</div>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#888' }} />
            <YAxis tick={{ fontSize: 11, fill: '#888' }} />
            <Tooltip contentStyle={{ background: '#fff', border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 12 }} />
            <Bar dataKey="income" fill="#c8f53a" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expenses" fill="#ff8c42" radius={[6, 6, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </GlassCard>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        {[
          { label: 'Total Income', value: '$28,400', change: '+12%', pos: true  },
          { label: 'Total Spent',  value: '$14,230', change: '-4%',  pos: false },
          { label: 'Net Saved',    value: '$14,170', change: '+18%', pos: true  },
        ].map(s => (
          <GlassCard key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontWeight: 800, fontSize: 22, color: '#1a2a10' }}>{s.value}</div>
            <Badge text={s.change} positive={s.pos} />
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
