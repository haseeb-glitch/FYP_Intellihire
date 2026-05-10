import React, { useState, useEffect } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { motion } from 'framer-motion';
import {
  Plus, LayoutGrid, TrendingUp, TrendingDown, Trophy,
  ChevronRight, Loader2, ArrowUpRight, PieChart as PieIcon, LineChart,
  BadgeCheck, CalendarDays, Percent, History, BarChart2, Minus,
  BrainCircuit, Route, FileBarChart2, VideoOff,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { interviewAPI } from '../api/axios';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

/* ─── Helpers ─── */
const gradeFromScore = (s) =>
  s >= 80 ? 'A' : s >= 60 ? 'B' : s >= 40 ? 'C' : 'D';

const gradeStyle = {
  A: { bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' },
  B: { bg: 'bg-blue-50 text-blue-700 border border-blue-200/80' },
  C: { bg: 'bg-amber-50 text-amber-700 border border-amber-200/80' },
  D: { bg: 'bg-red-50 text-red-700 border border-red-200/80' },
};

const GRADE_COLORS = { A: '#10B981', B: '#3B82F6', C: '#F59E0B', D: '#EF4444' };
const DOMAIN_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

/* ─── Custom Tooltip ─── */
const ScoreTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#D6E7F7] rounded-xl px-3.5 py-2.5 shadow-lg">
      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-base font-bold text-slate-900">{payload[0].value}%</p>
    </div>
  );
};

const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#D6E7F7] rounded-xl px-3 py-2 shadow-lg">
      <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-bold text-slate-900">{payload[0].value} sessions</p>
    </div>
  );
};

/* ─── Trend Badge ─── */
const TrendBadge = ({ value }) => {
  if (value === null) return null;
  const up = value > 0;
  const flat = value === 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
      flat ? 'bg-slate-100 text-slate-500' :
      up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
    }`}>
      {flat ? <Minus className="w-3 h-3" /> : up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {flat ? 'Stable' : `${up ? '+' : ''}${value}%`}
    </span>
  );
};

/* ─── Dashboard ─── */
export const Dashboard = () => {
  const [sessions, setSessions]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showAll, setShowAll]     = useState(false);
  const { user } = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    interviewAPI.getSessions()
      .then(res => setSessions(res.data || []))
      .catch(err => console.error('Failed to load sessions:', err))
      .finally(() => setLoading(false));
  }, []);

  /* ── Derived data ── */
  const completed = sessions.filter(s => s.status === 'completed');
  const inProgress = sessions.filter(s => s.status !== 'completed');

  const avgScore = completed.length > 0
    ? Math.round(completed.reduce((sum, s) => sum + (s.final_score || 0), 0) / completed.length)
    : 0;

  const bestScore = completed.length > 0
    ? Math.round(Math.max(...completed.map(s => s.final_score || 0)))
    : 0;

  /* Trend: compare last-3 avg vs prev-3 avg */
  const trend = (() => {
    if (completed.length < 4) return null;
    const sorted = [...completed].sort((a, b) => new Date(b.started_at || b.created_at) - new Date(a.started_at || a.created_at));
    const recent = sorted.slice(0, 3).reduce((s, x) => s + (x.final_score || 0), 0) / 3;
    const prev   = sorted.slice(3, 6).reduce((s, x) => s + (x.final_score || 0), 0) / Math.min(sorted.slice(3, 6).length, 3);
    return Math.round(recent - prev);
  })();

  /* Score trend chart data */
  const trendData = [...completed]
    .sort((a, b) => new Date(a.started_at || a.created_at) - new Date(b.started_at || b.created_at))
    .slice(-10)
    .map((s, i) => ({
      name: `#${i + 1}`,
      score: Math.round(s.final_score || 0),
    }));

  /* Grade distribution donut */
  const gradeData = Object.entries(
    completed.reduce((acc, s) => {
      const g = gradeFromScore(s.final_score || 0);
      acc[g] = (acc[g] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([name, value]) => ({ name: `Grade ${name}`, value, color: GRADE_COLORS[name] }))
    .sort((a, b) => a.name.localeCompare(b.name));

  /* Domain bar chart */
  const domainData = Object.entries(
    sessions.reduce((acc, s) => {
      const d = (s.domain || 'General').replace('Development', 'Dev').replace('Engineering', 'Eng');
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([name, count], i) => ({ name, count, fill: DOMAIN_COLORS[i % DOMAIN_COLORS.length] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const completionRate = sessions.length > 0
    ? Math.round((completed.length / sessions.length) * 100)
    : 0;

  const hasChartData = completed.length >= 2;

  /* ── Render ── */
  return (
    <PageTransition className="pt-8 pb-16 px-5 sm:px-7 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">
              {user?.username ? `Hi, ${user.username} 👋` : 'Dashboard'}
            </h1>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <AnimatedButton onClick={() => navigate('/setup')} variant="primary" icon={Plus}>
            New Interview
          </AnimatedButton>
        </div>

        {/* ── Hero Performance Card ── */}
        <GlassCard hover={false} className="!p-0 overflow-hidden">
          {/* Top section: score + chart */}
          <div className="flex flex-col sm:flex-row gap-0">
            {/* Score block */}
            <div className="sm:w-64 shrink-0 px-7 py-6 border-b sm:border-b-0 sm:border-r border-[#D6E7F7]/80 flex flex-col justify-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Average Score</p>
              <div className="flex items-end gap-3 mb-2">
                <span className="text-5xl font-black text-slate-900 tabular-nums leading-none">
                  {avgScore > 0 ? avgScore : '—'}
                </span>
                {avgScore > 0 && <span className="text-lg text-slate-400 mb-1">%</span>}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {avgScore > 0 && (
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${gradeStyle[gradeFromScore(avgScore)].bg}`}>
                    Grade {gradeFromScore(avgScore)}
                  </span>
                )}
                <TrendBadge value={trend} />
              </div>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                {completed.length > 0
                  ? `Based on ${completed.length} completed session${completed.length !== 1 ? 's' : ''}`
                  : 'Complete an interview to see your score'}
              </p>
            </div>

            {/* Chart */}
            <div className="flex-1 px-5 py-5">
              {hasChartData ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      <LineChart className="w-3.5 h-3.5 text-primary-400" />
                      Score Progression
                    </p>
                    <span className="text-[10px] text-slate-400">Last {trendData.length} sessions</span>
                  </div>
                  <ResponsiveContainer width="100%" height={130}>
                    <AreaChart data={trendData} margin={{ top: 5, right: 8, left: -28, bottom: 0 }}>
                      <defs>
                        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.18} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ScoreTooltip />} />
                      <Area
                        type="monotone" dataKey="score"
                        stroke="#3B82F6" strokeWidth={2.5}
                        fill="url(#scoreGrad)"
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3.5, stroke: 'white' }}
                        activeDot={{ r: 5.5, fill: '#2563EB', stroke: 'white', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="h-full flex items-center justify-center min-h-[130px]">
                  <div className="text-center">
                    <LineChart className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Complete 2+ interviews to see your score trend</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-[#D6E7F7]/80 border-t border-[#D6E7F7]/80">
            {[
              { icon: LayoutGrid,  label: 'Total Sessions',  value: sessions.length,                                   iconColor: 'text-primary-500', bg: 'bg-primary-50'  },
              { icon: BadgeCheck,  label: 'Completed',       value: completed.length,                                   iconColor: 'text-emerald-500', bg: 'bg-emerald-50'  },
              { icon: Trophy,      label: 'Best Score',      value: bestScore > 0 ? `${bestScore}%` : '—',             iconColor: 'text-amber-500',   bg: 'bg-amber-50'    },
              { icon: Percent,     label: 'Completion Rate', value: sessions.length > 0 ? `${completionRate}%` : '—',  iconColor: 'text-violet-500',  bg: 'bg-violet-50'   },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i }}
                className="flex items-center gap-3 px-5 py-4"
              >
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                  <s.icon className={`w-4 h-4 ${s.iconColor}`} />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900 tabular-nums leading-tight">{s.value}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        {/* ── Charts Row ── */}
        {!loading && sessions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* Grade Distribution Donut */}
            <GlassCard hover={false} className="lg:col-span-2 !p-0 overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#D6E7F7]/80">
                <PieIcon className="w-4 h-4 text-primary-500" />
                <h2 className="text-[14px] font-semibold text-slate-900">Grade Distribution</h2>
              </div>
              {gradeData.length > 0 ? (
                <div className="px-5 py-4 flex items-center gap-5">
                  <div className="shrink-0">
                    <PieChart width={110} height={110}>
                      <Pie
                        data={gradeData}
                        cx={50} cy={50}
                        innerRadius={32} outerRadius={50}
                        paddingAngle={3} dataKey="value"
                        startAngle={90} endAngle={-270}
                      >
                        {gradeData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </div>
                  <div className="flex-1 space-y-2.5">
                    {gradeData.map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                          <span className="text-xs text-slate-600 font-medium">{entry.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${(entry.value / completed.length) * 100}%`, backgroundColor: entry.color }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-900 tabular-nums w-4 text-right">{entry.value}</span>
                        </div>
                      </div>
                    ))}
                    <p className="text-[10px] text-slate-400 pt-1">{completed.length} completed sessions total</p>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <p className="text-xs text-slate-400">Complete interviews to see grade distribution</p>
                </div>
              )}
            </GlassCard>

            {/* Domain Breakdown Bar Chart */}
            <GlassCard hover={false} className="lg:col-span-3 !p-0 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#D6E7F7]/80">
                <div className="flex items-center gap-2.5">
                  <BarChart2 className="w-4 h-4 text-primary-500" />
                  <h2 className="text-[14px] font-semibold text-slate-900">Sessions by Domain</h2>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Top {domainData.length}</span>
              </div>
              {domainData.length > 0 ? (
                <div className="px-3 py-4">
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={domainData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<BarTooltip />} />
                      <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                        {domainData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <p className="text-xs text-slate-400">No domain data yet</p>
                </div>
              )}
            </GlassCard>
          </div>
        )}

        {/* ── Recent Sessions ── */}
        <GlassCard className="!p-0 overflow-hidden" hover={false}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#D6E7F7]/80">
            <div className="flex items-center gap-2.5">
              <History className="w-4 h-4 text-primary-500" />
              <h2 className="text-[15px] font-semibold text-slate-900">Recent Sessions</h2>
            </div>
            {sessions.length > 8 && (
              <button
                onClick={() => setShowAll(v => !v)}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
              >
                {showAll ? 'Show less' : `View all ${sessions.length}`}
                <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${showAll ? 'rotate-90' : ''}`} />
              </button>
            )}
          </div>

          <div className="px-3 py-3">
            {loading ? (
              <div className="flex justify-center py-14">
                <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-[#D6E7F7] flex items-center justify-center mx-auto mb-4">
                  <VideoOff className="w-6 h-6 text-slate-300" />
                </div>
                <h3 className="text-[15px] font-semibold text-slate-700 mb-1.5">No interviews yet</h3>
                <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">
                  Start your first mock interview to begin tracking your progress.
                </p>
                <AnimatedButton onClick={() => navigate('/setup')} variant="primary" icon={Plus}>
                  Start First Interview
                </AnimatedButton>
              </div>
            ) : (
              <div className="space-y-0.5">
                {(showAll ? sessions : sessions.slice(0, 8)).map((session, i) => {
                  const score = session.final_score || 0;
                  const grade = gradeFromScore(score);
                  const style = gradeStyle[grade];
                  const date  = new Date(session.started_at || session.created_at)
                    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const modeLabel = session.interview_mode
                    ? { hr: 'HR', technical: 'Tech', stress: 'Stress', mixed: 'Full' }[session.interview_mode] || session.interview_mode
                    : null;

                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.035 * i }}
                      onClick={() =>
                        session.status === 'completed'
                          ? navigate(`/results?session=${session.id}`)
                          : navigate(`/interview?session=${session.id}&mode=${session.answer_mode || 'text'}&company=${encodeURIComponent(session.company_name || 'Company')}&role=${encodeURIComponent(session.job_role || 'Role')}`)
                      }
                      className="flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-primary-50/50 border border-transparent hover:border-primary-100/80 cursor-pointer transition-all duration-150 group"
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                        {(session.company_name || 'C')[0].toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13.5px] font-semibold text-slate-900 truncate leading-snug">
                          {session.job_role || 'Interview'}
                        </p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {session.company_name || 'Company'}
                          {session.domain ? ` · ${session.domain}` : ''}
                          {` · ${date}`}
                        </p>
                      </div>

                      {/* Tags */}
                      <div className="flex items-center gap-2 shrink-0">
                        {modeLabel && (
                          <span className="hidden sm:inline text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wide">
                            {modeLabel}
                          </span>
                        )}
                        {session.status === 'completed' ? (
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style.bg}`}>
                            {Math.round(score)}%
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200/80">
                            Resume
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-400 transition-colors" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </GlassCard>

        {/* ── Quick actions ── */}
        {sessions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                label: 'AI Coach',
                sub: 'Get personalised feedback',
                path: '/ai-coach',
                Icon: BrainCircuit,
                iconBg: 'bg-blue-500',
                hoverBorder: 'hover:border-blue-200',
                hoverBg: 'hover:bg-blue-50/40',
              },
              {
                label: 'Career Roadmap',
                sub: 'Track your milestones',
                path: '/roadmap',
                Icon: Route,
                iconBg: 'bg-violet-500',
                hoverBorder: 'hover:border-violet-200',
                hoverBg: 'hover:bg-violet-50/40',
              },
              {
                label: 'View Reports',
                sub: 'Deep-dive your results',
                path: '/results',
                Icon: FileBarChart2,
                iconBg: 'bg-emerald-500',
                hoverBorder: 'hover:border-emerald-200',
                hoverBg: 'hover:bg-emerald-50/40',
              },
            ].map((action) => (
              <motion.button
                key={action.label}
                onClick={() => navigate(action.path)}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className={`flex items-center gap-3.5 p-4 rounded-2xl bg-white/80 border border-[#D6E7F7] ${action.hoverBorder} ${action.hoverBg} transition-all duration-150 group text-left shadow-sm`}
              >
                <div className={`w-9 h-9 rounded-xl ${action.iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
                  <action.Icon className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 leading-snug">{action.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{action.sub}</p>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
              </motion.button>
            ))}
          </div>
        )}

      </div>
    </PageTransition>
  );
};
