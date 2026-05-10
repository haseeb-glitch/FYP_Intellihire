import { useState, useEffect } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { motion } from 'framer-motion';
import {
  Route, CheckCircle2, Sparkles, Trophy,
  TrendingUp, Users, Code2, Zap, Brain,
  Star, AlertCircle, ArrowUpRight, PlayCircle, BrainCircuit,
  Loader2, BarChart3,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { interviewAPI } from '../api/axios';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

/* ─── Simple tips based on score level ─── */
const TIPS = {
  hr: {
    low: [
      'Practice the STAR method: Situation → Task → Action → Result for every behavioral question',
      'Record yourself answering "Tell me about yourself" — watch for filler words like "um" and "like"',
      'Prepare 3–5 strong stories about challenges you overcame, one for each key competency',
      'Keep answers concise — aim for 90 seconds per behavioral answer',
    ],
    mid: [
      'Tailor your answers to the company culture — research their values before each session',
      'Use specific numbers and outcomes in your stories ("increased efficiency by 30%")',
      'Practice active listening and follow-up questions to show genuine engagement',
      'Prepare a compelling "Tell me about yourself" answer that connects your story to the role',
    ],
    high: [
      'Polish your personal brand narrative — what makes you uniquely valuable?',
      'Prepare thoughtful questions that demonstrate strategic thinking',
      'Develop a salary negotiation script and practice it out loud',
      'Work on closing strong — express genuine enthusiasm at the end of each interview',
    ],
  },
  technical: {
    low: [
      'Solve one LeetCode Easy problem daily — focus on arrays, strings, and hashmaps first',
      'Always explain your thinking out loud while solving — interviewers value the process',
      'Study time and space complexity: know Big-O for common operations',
      'Review core data structures: linked lists, stacks, queues, trees, and graphs',
    ],
    mid: [
      'Tackle 3 LeetCode Medium problems per week — focus on sliding window and dynamic programming',
      'Practice coding in timed conditions without IDE autocomplete or hints',
      'Learn system design basics: load balancing, caching, database scaling',
      'Study design patterns relevant to your target role (e.g., MVC, Observer, Factory)',
    ],
    high: [
      'Attempt LeetCode Hard problems under interview conditions to sharpen pressure performance',
      'Deep-dive into distributed systems: consistency models, CAP theorem, microservices',
      'Contribute to open-source projects to demonstrate real-world problem-solving skills',
      'Prepare a system design for 2–3 well-known products (e.g., YouTube, Twitter, URL Shortener)',
    ],
  },
  stress: {
    low: [
      'Practice box breathing (inhale 4s → hold 4s → exhale 4s → hold 4s) before sessions',
      'Replace filler words with a confident pause — it sounds more thoughtful, not weaker',
      'Do daily mock interviews to build confidence through repetition and exposure',
      'Remind yourself: it\'s OK to take 5–10 seconds to think before answering',
    ],
    mid: [
      'Simulate high-pressure scenarios with a friend — have them ask follow-up challenges',
      'Practice maintaining a steady, calm tone even when the question is unexpected',
      'Develop a "pressure response" script: "That\'s a great question — let me think through it"',
      'Focus on posture and breathing — physical calm translates to mental calm',
    ],
    high: [
      'Take on live coding challenges or panel mock interviews to test your composure',
      'Mentor others on interview prep — teaching builds deep, lasting confidence',
      'Prepare for executive-level high-stakes interviews with back-to-back rounds',
      'Practice reframing tough moments: a hard question is an opportunity to shine',
    ],
  },
};

const getTips = (type, score) => {
  const level = score >= 7.5 ? 'high' : score >= 5 ? 'mid' : 'low';
  return TIPS[type]?.[level] || [];
};

/* ─── TipCard ─── */
const TipCard = ({ title, icon: Icon, iconBg, borderClass, tips, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
    <GlassCard hover={false} className="!p-0 overflow-hidden h-full">
      <div className={`flex items-center gap-2.5 px-4 py-3.5 border-b ${borderClass}`}>
        <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <h3 className="text-[13.5px] font-semibold text-slate-900">{title}</h3>
      </div>
      <ul className="px-4 py-3.5 space-y-2.5">
        {tips.map((tip, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.05 * i }}
            className="flex items-start gap-2.5 text-[12.5px] text-slate-700 leading-relaxed"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0 mt-[6px]" />
            {tip}
          </motion.li>
        ))}
      </ul>
    </GlassCard>
  </motion.div>
);

/* ─── Roadmap ─── */
export const Roadmap = () => {
  const [sessions, setSessions] = useState([]);
  const [detail, setDetail]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    interviewAPI.getSessions()
      .then(async (res) => {
        const all = res.data || [];
        setSessions(all);
        const completed = all.filter(s => s.status === 'completed');
        if (completed.length === 0) return;
        const latest = completed.sort((a, b) =>
          new Date(b.started_at || b.created_at) - new Date(a.started_at || a.created_at)
        )[0];
        const det = await interviewAPI.getSessionDetail(latest.id);
        setDetail(det.data);
      })
      .catch(err => console.error('Roadmap load error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageTransition className="pt-8 pb-16 px-5 sm:px-7 lg:px-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        </div>
      </PageTransition>
    );
  }

  const completed    = sessions.filter(s => s.status === 'completed');
  const eval_        = detail?.evaluation || null;
  const hrScores     = eval_?.hr_scores || null;
  const techScores   = eval_?.technical_scores || null;
  const stressScores = eval_?.stress_scores || null;
  const agentsUsed   = eval_?.agents_used || [];
  const finalScore   = eval_?.final_score || 0;
  const grade        = eval_?.grade || '—';
  const recommendation = eval_?.recommendation || '';
  const lastDate     = detail
    ? new Date(detail.started_at || detail.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const hasData = !!eval_;

  /* Hero stats strip */
  const heroStats = [
    { label: 'HR Score',      value: hrScores     ? `${(hrScores.overall     || 0).toFixed(1)}/10` : '—', icon: Users,  iconColor: 'text-blue-500',   bg: 'bg-blue-50'   },
    { label: 'Technical',     value: techScores   ? `${(techScores.overall   || 0).toFixed(1)}/10` : '—', icon: Code2,  iconColor: 'text-violet-500', bg: 'bg-violet-50' },
    { label: 'Composure',     value: stressScores ? `${(stressScores.overall || 0).toFixed(1)}/10` : '—', icon: Zap,    iconColor: 'text-amber-500',  bg: 'bg-amber-50'  },
    { label: 'Sessions Done', value: completed.length,                                                      icon: Trophy, iconColor: 'text-emerald-500',bg: 'bg-emerald-50'},
  ];

  /* Radar data */
  const radarData = [];
  if (hrScores) {
    radarData.push({ skill: 'Clarity',        value: hrScores.clarity         || 0 });
    radarData.push({ skill: 'Professionalism',value: hrScores.professionalism || 0 });
  }
  if (techScores) {
    radarData.push({ skill: 'Correctness',    value: techScores.correctness   || 0 });
    radarData.push({ skill: 'Depth',          value: techScores.depth         || 0 });
  }
  if (stressScores) {
    radarData.push({ skill: 'Composure',        value: stressScores.composure         || 0 });
    radarData.push({ skill: 'Confidence',        value: stressScores.confidence        || 0 });
    radarData.push({ skill: 'Pressure Handling', value: stressScores.pressure_handling || 0 });
  }

  const gradeColorMap = { A: 'text-emerald-500', B: 'text-blue-500', C: 'text-amber-500', D: 'text-orange-500', F: 'text-red-500' };
  const gradeGlowMap  = { A: 'shadow-emerald-500/30', B: 'shadow-blue-500/30', C: 'shadow-amber-500/30', D: 'shadow-orange-500/30', F: 'shadow-red-500/30' };

  return (
    <PageTransition className="pt-8 pb-16 px-5 sm:px-7 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* ── Page Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 border border-[#D6E7F7] flex items-center justify-center shrink-0">
              <Route className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">Career Roadmap</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {hasData ? 'Personalised based on your latest interview results' : 'Complete an interview to generate your roadmap'}
              </p>
            </div>
          </div>
          {hasData && (
            <AnimatedButton onClick={() => navigate('/setup')} variant="primary" icon={PlayCircle}>
              New Interview
            </AnimatedButton>
          )}
        </div>

        {/* ── No data empty state ── */}
        {!hasData && (
          <GlassCard hover={false} className="!p-0 overflow-hidden">
            <div className="py-20 text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-primary-50 border border-[#D6E7F7] flex items-center justify-center mx-auto mb-5">
                <Route className="w-7 h-7 text-primary-400" />
              </div>
              <h3 className="text-[17px] font-bold text-slate-800 mb-2">Your roadmap is waiting</h3>
              <p className="text-sm text-slate-500 mb-7 max-w-sm mx-auto leading-relaxed">
                Complete your first mock interview and IntelliHire will generate a fully personalised learning roadmap based on your actual performance.
              </p>
              <AnimatedButton onClick={() => navigate('/setup')} variant="primary" icon={PlayCircle}>
                Start Your First Interview
              </AnimatedButton>
            </div>
          </GlassCard>
        )}

        {/* ── Hero overview ── */}
        {hasData && (
          <GlassCard hover={false} className="!p-0 overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              {/* Grade block */}
              <div className="sm:w-64 shrink-0 px-7 py-7 border-b sm:border-b-0 sm:border-r border-[#D6E7F7]/80 flex flex-col items-center justify-center text-center">
                <div className={`w-20 h-20 mx-auto rounded-full bg-white border-4 border-white shadow-xl ${gradeGlowMap[grade] || 'shadow-slate-200'} flex items-center justify-center mb-3`}>
                  <span className={`text-4xl font-black ${gradeColorMap[grade] || 'text-slate-400'}`}>{grade}</span>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Overall Score</p>
                <p className="text-3xl font-black text-slate-900 tabular-nums">{Math.round(finalScore)}<span className="text-base text-slate-400 font-normal">%</span></p>
                {recommendation && (
                  <span className={`mt-2.5 inline-block px-3 py-1 rounded-full text-[10px] font-bold border ${
                    recommendation.includes('Strong Hire') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    recommendation.includes('Hire') && !recommendation.includes('No') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    recommendation.includes('Lean') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {recommendation}
                  </span>
                )}
                {lastDate && (
                  <p className="text-[10px] text-slate-400 mt-2">Last interview {lastDate}</p>
                )}
              </div>

              {/* Radar chart */}
              {radarData.length >= 3 && (
                <div className="flex-1 px-5 py-4">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-primary-400" /> Skill Overview
                  </p>
                  <ResponsiveContainer width="100%" height={165}>
                    <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="skill" tick={{ fontSize: 9, fill: '#64748b' }} stroke="#e2e8f0" />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} stroke="#e2e8f0" />
                      <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.22} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-[#D6E7F7]/80 border-t border-[#D6E7F7]/80">
              {heroStats.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 * i }}
                  className="flex items-center gap-3 px-5 py-4">
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                    <s.icon className={`w-4 h-4 ${s.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 tabular-nums leading-tight">{s.value}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{s.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* ── AI-Generated Action Plan (from backend) ── */}
        {hasData && eval_?.roadmap && (eval_.roadmap.steps || (Array.isArray(eval_.roadmap) ? eval_.roadmap : [])).length > 0 && (() => {
          const steps = eval_.roadmap.steps || (Array.isArray(eval_.roadmap) ? eval_.roadmap : []);
          return (
            <GlassCard hover={false} className="!p-0 overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#D6E7F7]/80">
                <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold text-slate-900">AI-Generated Action Plan</h2>
                  <p className="text-[10px] text-slate-400">Derived from your interview evaluation</p>
                </div>
              </div>
              <ol className="px-5 py-4 space-y-3">
                {steps.map((step, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 * i }}
                    className="flex items-start gap-3 text-[13px] text-slate-700 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-primary-50 border border-[#D6E7F7] text-primary-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </motion.li>
                ))}
              </ol>
            </GlassCard>
          );
        })()}

        {/* ── Tips & Tricks ── */}
        {hasData && (
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <h2 className="text-[15px] font-bold text-slate-900">Tips & Tricks for You</h2>
              <span className="text-[11px] text-slate-400 ml-auto">Based on your performance</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(agentsUsed.includes('hr') || !agentsUsed.length) && hrScores && (
                <TipCard
                  title="Communication & Behavioral"
                  icon={Users}
                  iconBg="bg-blue-500"
                  borderClass="border-blue-200/60"
                  tips={getTips('hr', hrScores.overall || 0)}
                  delay={0}
                />
              )}
              {agentsUsed.includes('technical') && techScores && (
                <TipCard
                  title="Technical Skills"
                  icon={Code2}
                  iconBg="bg-violet-500"
                  borderClass="border-violet-200/60"
                  tips={getTips('technical', techScores.overall || 0)}
                  delay={0.07}
                />
              )}
              {agentsUsed.includes('stress') && stressScores && (
                <TipCard
                  title="Composure & Confidence"
                  icon={Zap}
                  iconBg="bg-amber-500"
                  borderClass="border-amber-200/60"
                  tips={getTips('stress', stressScores.overall || 0)}
                  delay={0.14}
                />
              )}
            </div>
          </div>
        )}

        {/* ── Strengths & Improvements ── */}
        {hasData && (eval_?.strengths?.length > 0 || eval_?.improvements?.length > 0) && (
          <GlassCard hover={false} className="!p-0 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#D6E7F7]/80">
              <div>
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#D6E7F7]/80">
                  <Star className="w-4 h-4 text-amber-500" />
                  <h2 className="text-[14px] font-semibold text-slate-900">Your Strengths</h2>
                </div>
                <ul className="px-5 py-4 space-y-2.5">
                  {(eval_?.strengths || []).map((s, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                      className="flex items-start gap-2.5 text-[12.5px] text-slate-700 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      {s}
                    </motion.li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#D6E7F7]/80">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <h2 className="text-[14px] font-semibold text-slate-900">Areas to Improve</h2>
                </div>
                <ul className="px-5 py-4 space-y-2.5">
                  {(eval_?.improvements || []).map((s, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                      className="flex items-start gap-2.5 text-[12.5px] text-slate-700 leading-relaxed">
                      <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      {s}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </GlassCard>
        )}

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'New Interview', sub: 'Practice and improve your score',  path: '/setup',    Icon: PlayCircle,   iconBg: 'bg-primary-500', hoverBorder: 'hover:border-primary-200', hoverBg: 'hover:bg-primary-50/40' },
            { label: 'AI Coach',      sub: 'Get personalised coaching tips',    path: '/ai-coach', Icon: BrainCircuit, iconBg: 'bg-blue-500',    hoverBorder: 'hover:border-blue-200',    hoverBg: 'hover:bg-blue-50/40'    },
            { label: 'View Results',  sub: 'Review your latest session report', path: '/results',  Icon: BarChart3,    iconBg: 'bg-violet-500',  hoverBorder: 'hover:border-violet-200',  hoverBg: 'hover:bg-violet-50/40'  },
          ].map(action => (
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

      </div>
    </PageTransition>
  );
};
