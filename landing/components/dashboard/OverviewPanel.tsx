'use client';
import { GlassCard, Badge, AnimatedBlob } from './shared';
import { AreaChart, Area, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line, YAxis } from 'recharts';

const candleData = Array.from({ length: 20 }, (_, i) => ({ name: i, open: 140 + Math.random() * 20, close: 140 + Math.random() * 20, high: 165 + Math.random() * 10, low: 130 + Math.random() * 10 }));
const incomeData = [{ x: 'Jan', income: 30, prev: 20 }, { x: 'Feb', income: 45, prev: 30 }, { x: 'Mar', income: 38, prev: 35 }, { x: 'Apr', income: 55, prev: 40 }, { x: 'May', income: 60, prev: 45 }, { x: 'Jun', income: 50, prev: 48 }, { x: 'Jul', income: 70, prev: 55 }];
const expenseData = [{ x: 'Jan', expenses: 40, prev: 45 }, { x: 'Feb', expenses: 35, prev: 50 }, { x: 'Mar', expenses: 42, prev: 38 }, { x: 'Apr', expenses: 30, prev: 42 }, { x: 'May', expenses: 28, prev: 35 }, { x: 'Jun', expenses: 33, prev: 30 }, { x: 'Jul', expenses: 25, prev: 28 }];
const pieData = [{ name: 'Savings', value: 50, color: '#c8f53a' }, { name: 'Invest', value: 25, color: '#555' }, { name: 'Spend', value: 25, color: '#888' }];

function CandleChart() {
  const data = candleData.map(d => ({ ...d, upDown: d.close >= d.open ? 'up' : 'down' }));
  return (
    <ResponsiveContainer width="100%" height={90}>
      <ComposedChart data={data} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#aaa' }} />
        <Tooltip contentStyle={{ background: '#222', border: 'none', borderRadius: 8, fontSize: 11 }} labelStyle={{ color: '#aaa' }} />
        <Line type="monotone" dataKey="close" dot={false} stroke="#c8f53a" strokeWidth={1.5} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default function OverviewPanel() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gridTemplateRows: 'auto auto auto', gap: 16, animation: 'fadeSlideIn .4s ease both' }}>
      {/* Budget Card */}
      <GlassCard style={{ gridRow: '1 / 4', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#1a2a10' }}>Your Budget</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Savings from last month</div>
          </div>
          <button style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(200,245,58,0.18)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚙️</button>
        </div>
        <AnimatedBlob />
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {[0, 1, 2].map(i => (<div key={i} style={{ width: i === 0 ? 18 : 7, height: 7, borderRadius: 999, background: i === 0 ? '#c8f53a' : 'rgba(0,0,0,0.15)', transition: 'width .3s' }} />))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 8 }}>
          {[{ icon: '⬇️', label: 'Add' }, { icon: '⬆️', label: 'Withdraw' }, { icon: '📊', label: 'Details' }, { icon: '•••', label: 'More' }].map(a => (
            <button key={a.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'rgba(200,245,58,0.12)', border: '1.5px solid rgba(200,245,58,0.3)', borderRadius: 14, padding: '10px 14px', cursor: 'pointer', transition: 'background .2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,245,58,0.28)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(200,245,58,0.12)')}>
              <span style={{ fontSize: 18 }}>{a.icon}</span>
              <span style={{ fontSize: 11, color: '#4a6010', fontWeight: 600 }}>{a.label}</span>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Balance Card */}
      <GlassCard style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div><div style={{ fontWeight: 800, fontSize: 15, color: '#1a2a10' }}>Balance</div><div style={{ fontSize: 11, color: '#888' }}>Your in-total balance</div></div>
            <Badge text="+30%" positive={true} />
          </div>
          <CandleChart />
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <PieChart width={100} height={100}>
            <Pie data={pieData} cx={45} cy={45} innerRadius={28} outerRadius={46} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
              {pieData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
            </Pie>
          </PieChart>
          <div style={{ marginLeft: -8 }}>
            {pieData.map(d => (<div key={d.name} style={{ fontSize: 10, color: '#555', display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} /><span>{d.value}%</span></div>))}
          </div>
        </div>
      </GlassCard>

      {/* Middle row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <GlassCard>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1a2a10' }}>Payment Transactions</div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>Most recent</div>
          <div style={{ height: 18, borderRadius: 999, background: 'linear-gradient(90deg, #c8f53a 0%, #a0c820 100%)', boxShadow: '0 2px 8px rgba(170,220,30,0.25)' }} />
        </GlassCard>
        <GlassCard>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1a2a10' }}>Most Spending</div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>Active Cards</div>
          <div style={{ height: 18, borderRadius: 999, width: '55%', background: 'linear-gradient(90deg, #ff8c42 0%, #e86820 100%)', boxShadow: '0 2px 8px rgba(240,100,30,0.22)' }} />
        </GlassCard>
        <div style={{ borderRadius: 20, background: 'linear-gradient(135deg, #c8f53a 0%, #8fbe00 100%)', padding: 20, position: 'relative', overflow: 'hidden', boxShadow: '0 4px 24px rgba(160,220,20,0.35)' }}>
          <div style={{ position: 'absolute', right: -20, bottom: -20, width: 90, height: 90, background: 'rgba(255,255,255,0.18)', borderRadius: '50%' }} />
          <div style={{ fontWeight: 800, fontSize: 15, color: '#1a2a10' }}>Smart investment</div>
          <button style={{ marginTop: 18, background: '#1a2a10', color: '#c8f53a', border: 'none', borderRadius: 12, padding: '8px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'transform .15s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>More details</button>
        </div>
      </div>

      {/* Income + Expenses */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <div><div style={{ fontWeight: 700, fontSize: 13, color: '#1a2a10' }}>Income</div><div style={{ fontSize: 11, color: '#888' }}>Your earnings</div></div>
            <Badge text="+30%" positive={true} />
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={incomeData} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
              <defs><linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c8f53a" stopOpacity={0.35} /><stop offset="100%" stopColor="#c8f53a" stopOpacity={0} /></linearGradient></defs>
              <Area type="monotone" dataKey="income" stroke="#c8f53a" strokeWidth={2} fill="url(#incomeGrad)" dot={false} />
              <Area type="monotone" dataKey="prev" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} fill="transparent" dot={false} strokeDasharray="4 3" />
              <Tooltip contentStyle={{ background: '#222', border: 'none', borderRadius: 8, fontSize: 10 }} />
            </AreaChart>
          </ResponsiveContainer>
          <button style={{ marginTop: 8, width: '100%', background: 'rgba(200,245,58,0.15)', border: '1px solid rgba(200,245,58,0.35)', borderRadius: 10, padding: '6px 0', fontSize: 11, fontWeight: 600, color: '#4a6010', cursor: 'pointer' }}>Calculate predictions</button>
        </GlassCard>

        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <div><div style={{ fontWeight: 700, fontSize: 13, color: '#1a2a10' }}>Expenses</div><div style={{ fontSize: 11, color: '#888' }}>Most recent</div></div>
            <Badge text="-8%" positive={false} />
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={expenseData} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
              <defs><linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff6b6b" stopOpacity={0.3} /><stop offset="100%" stopColor="#ff6b6b" stopOpacity={0} /></linearGradient></defs>
              <Area type="monotone" dataKey="expenses" stroke="#ff6b6b" strokeWidth={2} fill="url(#expGrad)" dot={false} />
              <Area type="monotone" dataKey="prev" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} fill="transparent" dot={false} strokeDasharray="4 3" />
              <Tooltip contentStyle={{ background: '#222', border: 'none', borderRadius: 8, fontSize: 10 }} />
            </AreaChart>
          </ResponsiveContainer>
          <button style={{ marginTop: 8, width: '100%', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 10, padding: '6px 0', fontSize: 11, fontWeight: 600, color: '#a03030', cursor: 'pointer' }}>Calculate predictions</button>
        </GlassCard>
      </div>
    </div>
  );
}
