import { useState, useEffect } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { motion } from 'framer-motion';
import {
  Route, CheckCircle2, Clock, Lock, Sparkles, Trophy, TrendingUp,
  Target, Award, Users, Code2, Zap, Brain, MessageSquare, Star,
  Gauge, Eye, Volume2, Activity, ArrowUpRight, PlayCircle, BrainCircuit,
  Loader2, VideoOff, BarChart3, ChevronRight, AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { interviewAPI } from '../api/axios';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

/* ─── Score helpers ─── */
const scoreStatus = (s) =>
  s >= 8   ? 'mastered'    :
  s >= 6.5 ? 'good'        :
  s >= 4   ? 'in-progress' : 'needs-work';

const statusConfig = {
  mastered:    { label: 'Mastered',    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500', icon: CheckCircle2, iconColor: 'text-emerald-500' },
  good:        { label: 'Good',        badge: 'bg-blue-50 text-blue-700 border-blue-200',           bar: 'bg-blue-500',    icon: TrendingUp,   iconColor: 'text-blue-500'    },
  'in-progress':{ label: 'In Progress', badge: 'bg-amber-50 text-amber-700 border-amber-200',       bar: 'bg-amber-500',   icon: Clock,        iconColor: 'text-amber-500'   },
  'needs-work':{ label: 'Needs Work',  badge: 'bg-red-50 text-red-700 border-red-200',              bar: 'bg-red-500',     icon: AlertCircle,  iconColor: 'text-red-500'     },
  none:        { label: 'Not Started', badge: 'bg-slate-50 text-slate-500 border-slate-200',        bar: 'bg-slate-200',   icon: Lock,         iconColor: 'text-slate-300'   },
};

/* ─── Phase definitions ─── */
const phaseBase = {
  hr: {
    key: 'hr', title: 'Communication & Behavioral',
    icon: Users, iconBg: 'bg-blue-500', accent: 'border-blue-200/60',
    metrics: [
      { key: 'clarity',         label: 'Answer Clarity',      icon: MessageSquare },
      { key: 'relevance',       label: 'Relevance to Question', icon: Target },
      { key: 'professionalism', label: 'Professionalism',     icon: Award },
      { key: 'star_method',     label: 'STAR Method',         icon: Star },
      { key: 'communication',   label: 'Communication Style', icon: Volume2 },
    ],
    actions: {
      'needs-work':   ['Practice STAR method daily with behavioral questions', 'Record yourself answering common HR questions', 'Study ATS-optimized resume writing', 'Join a Toastmasters or public speaking group'],
      'in-progress':  ['Refine your STAR stories for 5 common competency areas', 'Work on conciseness — aim for 90-second answers', 'Prepare 3 strong "Tell me about yourself" variants', 'Research company culture before each interview'],
      good:           ['Polish edge-case behavioral responses', 'Prepare salary negotiation scripts', 'Develop compelling stories around failures/growth', 'Practice active listening and follow-up questions'],
      mastered:       ['Mentor others on behavioral interviewing', 'Focus on executive-level communication', 'Refine your personal brand narrative'],
    },
    resources: ['STAR Method Framework', 'Behavioral Question Bank', 'Communication Mastery', 'Resume Builder'],
  },
  technical: {
    key: 'technical', title: 'Technical Depth',
    icon: Code2, iconBg: 'bg-violet-500', accent: 'border-violet-200/60',
    metrics: [
      { key: 'correctness',     label: 'Solution Correctness',  icon: CheckCircle2 },
      { key: 'depth',           label: 'Technical Depth',       icon: BarChart3 },
      { key: 'efficiency',      label: 'Code Efficiency',       icon: Gauge },
      { key: 'communication',   label: 'Technical Explanation', icon: MessageSquare },
      { key: 'problem_solving', label: 'Problem Solving',       icon: Brain },
    ],
    actions: {
      'needs-work':   ['Complete LeetCode Easy/Medium array & string problems daily', 'Study time/space complexity fundamentals', 'Practice explaining your thought process out loud', 'Review core data structures (trees, graphs, heaps)'],
      'in-progress':  ['Tackle 3 LeetCode medium problems per week', 'Begin system design fundamentals (load balancing, caching)', 'Practice coding interviews in timed conditions', 'Study common design patterns relevant to your domain'],
      good:           ['Attempt LeetCode hard problems in interview conditions', 'Deep-dive into distributed systems design', 'Contribute to open-source to demonstrate practical skills', 'Practice whiteboard coding without IDE assistance'],
      mastered:       ['Lead technical design reviews', 'Prepare for staff/principal engineer interviews', 'Build & showcase complex system architectures'],
    },
    resources: ['LeetCode 75 Curated List', 'System Design Primer', 'Algorithms & DS Course', 'CS Fundamentals'],
  },
  stress: {
    key: 'stress', title: 'Composure Under Pressure',
    icon: Zap, iconBg: 'bg-amber-500', accent: 'border-amber-200/60',
    metrics: [
      { key: 'composure',         label: 'Composure',         icon: Activity },
      { key: 'confidence',        label: 'Confidence',        icon: Award },
      { key: 'eye_contact',       label: 'Eye Contact',       icon: Eye },
      { key: 'vocal_steadiness',  label: 'Vocal Steadiness',  icon: Volume2 },
      { key: 'pressure_handling', label: 'Pressure Handling', icon: Zap },
    ],
    actions: {
      'needs-work':   ['Practice box breathing (4-4-4-4) before every interview', 'Record mock interviews to review body language', 'Do 5-minute mindfulness sessions daily', 'Gradually increase interview difficulty to build exposure'],
      'in-progress':  ['Simulate high-pressure scenarios with a friend or AI', 'Work on maintaining steady eye contact during answers', 'Practice pausing before answering instead of filler words', 'Join a stress interview preparation group'],
      good:           ['Take on challenging live coding rounds', 'Practice panel interviews with multiple interviewers', 'Develop your "pressure response" narrative', 'Focus on projecting calm confidence through body language'],
      mastered:       ['Mentor candidates on pressure management', 'Lead live technical presentations', 'Prepare for executive-level high-stakes interviews'],
    },
    resources: ['Mindfulness for Interviews', 'Confidence Building', 'Mock Stress Sessions', 'Body Language Guide'],
  },
};

const advancedPhase = {
  key: 'advanced', title: 'Interview Readiness & Offer Strategy',
  icon: Trophy, iconBg: 'bg-primary-500', accent: 'border-[#D6E7F7]/60',
  actions: {
    locked:     ['Complete all skill phases to unlock this module'],
    unlocked:   ['Research target companies deeply (Glassdoor, LinkedIn Insights)', 'Prepare thoughtful questions for each interview round', 'Build your salary negotiation framework', 'Create a "closing" strategy to express genuine interest', 'Schedule 3 real applications per week at target companies'],
  },
  resources: ['Salary Negotiation Playbook', 'Company Research Guide', 'Offer Comparison Template', 'Interview Closing Scripts'],
};

/* ─── Radar tooltip ─── */
const RadarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#D6E7F7] rounded-xl px-3 py-2 shadow-lg">
      <p className="text-xs font-bold text-slate-900">{payload[0].value?.toFixed(1)}/10</p>
    </div>
  );
};

/* ─── PhaseCard ─── */
const PhaseCard = ({ phase, scores, index, isAdvanced = false, advancedUnlocked = false }) => {
  const [open, setOpen] = useState(index === 0);

  const overall = isAdvanced ? null : (scores?.overall || 0);
  const status  = isAdvanced
    ? (advancedUnlocked ? 'good' : 'none')
    : (scores ? scoreStatus(overall) : 'none');
  const sc = statusConfig[status] || statusConfig.none;
  const StatusIcon = sc.icon;
  const pct = isAdvanced ? (advancedUnlocked ? 30 : 0) : Math.round((overall / 10) * 100);

  const actions = isAdvanced
    ? (advancedUnlocked ? advancedPhase.actions.unlocked : advancedPhase.actions.locked)
    : (phase.actions?.[status] || phase.actions?.['in-progress'] || []);

  const weakMetrics = !isAdvanced && phase.metrics
    ? phase.metrics
        .map(m => ({ ...m, value: scores?.[m.key] || 0 }))
        .sort((a, b) => a.value - b.value)
        .slice(0, 3)
    : [];

  const PhaseIcon = phase.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <GlassCard hover={false} className="!p-0 overflow-hidden">
        {/* Header strip — always visible, clickable */}
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center gap-3.5 px-5 py-4 border-b border-[#D6E7F7]/80 hover:bg-primary-50/30 transition-colors text-left"
        >
          {/* Phase number */}
          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 shrink-0">
            PHASE {String(index + 1).padStart(2, '0')}
          </span>

          {/* Icon */}
          <div className={`w-7 h-7 rounded-lg ${phase.iconBg} flex items-center justify-center shrink-0`}>
            <PhaseIcon className="w-3.5 h-3.5 text-white" />
          </div>

          {/* Title */}
          <p className="text-[14px] font-semibold text-slate-900 flex-1 min-w-0">{phase.title}</p>

          {/* Status badge */}
          <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${sc.badge} shrink-0`}>
            <StatusIcon className="w-3 h-3" />
            {sc.label}
          </span>

          {/* Score */}
          {!isAdvanced && scores && (
            <span className="text-sm font-black text-slate-900 tabular-nums shrink-0 ml-1">{overall.toFixed(1)}<span className="text-slate-400 font-normal text-xs">/10</span></span>
          )}

          <ChevronRight className={`w-4 h-4 text-slate-300 shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
        </button>

        {/* Expandable body */}
        {open && (
          <div className="divide-y divide-[#D6E7F7]/60">
            {/* Progress bar row */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Progress</p>
                <p className="text-[11px] font-bold text-slate-700 tabular-nums">{pct}%</p>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${sc.bar} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Weak metrics / focus areas */}
            {weakMetrics.length > 0 && (
              <div className="px-5 py-4">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Focus Areas</p>
                <div className="space-y-3">
                  {weakMetrics.map((m, i) => {
                    const pctM = Math.min((m.value / 10) * 100, 100);
                    const barColor = m.value >= 7 ? 'bg-emerald-500' : m.value >= 5 ? 'bg-amber-500' : 'bg-red-500';
                    const MetricIcon = m.icon;
                    return (
                      <div key={m.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-1.5 text-[12px] font-medium text-slate-600">
                            <MetricIcon className="w-3.5 h-3.5 text-slate-400" />
                            {m.label}
                          </span>
                          <span className="text-[11px] font-bold text-slate-900 tabular-nums">{m.value.toFixed(1)}<span className="text-slate-400 font-normal">/10</span></span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full ${barColor} rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pctM}%` }}
                            transition={{ duration: 0.7, delay: 0.05 * i, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action items */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-md bg-primary-50 border border-[#D6E7F7] flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-primary-500" />
                </div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Recommended Actions</p>
              </div>
              <ul className="space-y-2.5">
                {actions.map((action, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="flex items-start gap-2.5 text-[12.5px] text-slate-700 leading-relaxed"
                  >
                    <div className="w-4 h-4 rounded-full bg-primary-50 border border-[#D6E7F7] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[8px] font-black text-primary-600">{i + 1}</span>
                    </div>
                    {action}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div className="px-5 py-4 bg-slate-50/40">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Learning Resources</p>
              <div className="flex flex-wrap gap-2">
                {(isAdvanced ? advancedPhase.resources : phase.resources).map(r => (
                  <span key={r} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#D6E7F7] text-[11px] font-medium text-slate-600 hover:border-primary-300 hover:text-primary-600 cursor-pointer transition-colors">
                    {r}
                    <ArrowUpRight className="w-2.5 h-2.5" />
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
};

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

  const completed   = sessions.filter(s => s.status === 'completed');
  const eval_       = detail?.evaluation || null;
  const hrScores    = eval_?.hr_scores || null;
  const techScores  = eval_?.technical_scores || null;
  const stressScores= eval_?.stress_scores || null;
  const agentsUsed  = eval_?.agents_used || [];
  const finalScore  = eval_?.final_score || 0;
  const grade       = eval_?.grade || '—';
  const recommendation = eval_?.recommendation || '';
  const interviewMode  = eval_?.interview_mode || detail?.interview_mode || 'mixed';
  const lastDate    = detail
    ? new Date(detail.started_at || detail.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const hasData = !!eval_;

  /* Determine which phases to show */
  const phasesToShow = [];
  if (!agentsUsed.length || agentsUsed.includes('hr'))        phasesToShow.push({ ...phaseBase.hr,       scores: hrScores });
  if (agentsUsed.includes('technical'))                        phasesToShow.push({ ...phaseBase.technical, scores: techScores });
  if (agentsUsed.includes('stress'))                           phasesToShow.push({ ...phaseBase.stress,    scores: stressScores });

  /* Advanced phase unlocked when all used agents score >= 6.5 */
  const scoredPhases = phasesToShow.filter(p => p.scores?.overall != null);
  const advancedUnlocked = scoredPhases.length > 0 && scoredPhases.every(p => (p.scores?.overall || 0) >= 6.5);

  /* Hero stats strip */
  const heroStats = [
    { label: 'HR Score',       value: hrScores    ? `${(hrScores.overall    || 0).toFixed(1)}/10` : '—', icon: Users,  iconColor: 'text-blue-500',   bg: 'bg-blue-50'   },
    { label: 'Technical',      value: techScores  ? `${(techScores.overall  || 0).toFixed(1)}/10` : '—', icon: Code2,  iconColor: 'text-violet-500', bg: 'bg-violet-50' },
    { label: 'Composure',      value: stressScores? `${(stressScores.overall|| 0).toFixed(1)}/10` : '—', icon: Zap,    iconColor: 'text-amber-500',  bg: 'bg-amber-50'  },
    { label: 'Sessions Done',  value: completed.length,                                                    icon: Trophy, iconColor: 'text-emerald-500',bg: 'bg-emerald-50'},
  ];

  /* Radar data for skill overview */
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
    radarData.push({ skill: 'Composure',      value: stressScores.composure   || 0 });
    radarData.push({ skill: 'Confidence',     value: stressScores.confidence  || 0 });
  }

  /* Overall roadmap progress */
  const allPhaseScores = phasesToShow.map(p => p.scores?.overall || 0);
  const overallProgress = allPhaseScores.length > 0
    ? Math.round(allPhaseScores.reduce((a, b) => a + b, 0) / allPhaseScores.length * 10)
    : 0;

  const gradeColorMap = {
    A: 'text-emerald-500', B: 'text-blue-500', C: 'text-amber-500', D: 'text-orange-500', F: 'text-red-500',
  };
  const gradeGlowMap = {
    A: 'shadow-emerald-500/30', B: 'shadow-blue-500/30', C: 'shadow-amber-500/30', D: 'shadow-orange-500/30', F: 'shadow-red-500/30',
  };

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

        {/* ── Hero overview (only when data exists) ── */}
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

              {/* Radar + progress */}
              <div className="flex-1 flex flex-col sm:flex-row gap-0">
                {/* Skill radar */}
                {radarData.length >= 3 && (
                  <div className="flex-1 px-5 py-4 border-b sm:border-b-0 sm:border-r border-[#D6E7F7]/80">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-primary-400" /> Skill Overview
                    </p>
                    <ResponsiveContainer width="100%" height={160}>
                      <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="skill" tick={{ fontSize: 9, fill: '#64748b' }} stroke="#e2e8f0" />
                        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} stroke="#e2e8f0" />
                        <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.22} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {/* Roadmap progress */}
                <div className="w-full sm:w-56 shrink-0 px-5 py-5 flex flex-col justify-center">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-primary-400" /> Roadmap Progress
                  </p>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-black text-slate-900 tabular-nums leading-none">{overallProgress}</span>
                    <span className="text-base text-slate-400 mb-1">%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                    <motion.div
                      className="h-full bg-primary-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${overallProgress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="space-y-2">
                    {phasesToShow.map(p => {
                      const pScore = p.scores?.overall || 0;
                      const pStatus = p.scores ? scoreStatus(pScore) : 'none';
                      const pSc = statusConfig[pStatus];
                      const PIcon = p.icon;
                      return (
                        <div key={p.key} className="flex items-center gap-2">
                          <PIcon className={`w-3 h-3 ${
                            pStatus === 'mastered' ? 'text-emerald-500' :
                            pStatus === 'good'     ? 'text-blue-500' :
                            pStatus === 'in-progress' ? 'text-amber-500' : 'text-red-500'
                          } shrink-0`} />
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${pSc.bar} rounded-full`} style={{ width: `${(pScore / 10) * 100}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 tabular-nums w-8 text-right">{pScore.toFixed(1)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom stats strip */}
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

        {/* ── Improvement Summary (AI roadmap steps from backend) ── */}
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

        {/* ── Phase Cards ── */}
        {hasData && (
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <Target className="w-4 h-4 text-primary-500" />
              <h2 className="text-[15px] font-bold text-slate-900">Your Learning Phases</h2>
              <span className="text-[11px] text-slate-400 ml-auto">{phasesToShow.length + 1} phases · Click to expand</span>
            </div>
            <div className="space-y-3">
              {phasesToShow.map((phase, i) => (
                <PhaseCard key={phase.key} phase={phase} scores={phase.scores} index={i} />
              ))}
              {/* Advanced / Offer phase */}
              <PhaseCard
                phase={advancedPhase}
                scores={null}
                index={phasesToShow.length}
                isAdvanced
                advancedUnlocked={advancedUnlocked}
              />
            </div>
          </div>
        )}

        {/* ── Strengths & weaknesses snapshot ── */}
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
            { label: 'New Interview',  sub: 'Practice and improve your score',   path: '/setup',    Icon: PlayCircle,  iconBg: 'bg-primary-500', hoverBorder: 'hover:border-primary-200', hoverBg: 'hover:bg-primary-50/40' },
            { label: 'AI Coach',       sub: 'Get personalised coaching tips',     path: '/ai-coach', Icon: BrainCircuit,iconBg: 'bg-blue-500',   hoverBorder: 'hover:border-blue-200',   hoverBg: 'hover:bg-blue-50/40'   },
            { label: 'View Results',   sub: 'Review your latest session report',  path: '/results',  Icon: BarChart3,   iconBg: 'bg-violet-500', hoverBorder: 'hover:border-violet-200', hoverBg: 'hover:bg-violet-50/40' },
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
