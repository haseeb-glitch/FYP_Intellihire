import { useState, useEffect, useMemo } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { motion } from 'framer-motion';
import {
  Trophy, TrendingUp, AlertTriangle, Download, ArrowLeft, Star, CheckCircle2,
  Target, Loader2, Users, Code2, Zap, Building2, Clock, MessageSquare,
  BarChart3, Activity, Award, Brain, Volume2, Eye, Gauge, ArrowUpRight,
  BrainCircuit, Route, PlayCircle, LineChart as LineIcon,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { interviewAPI, reportAPI } from '../api/axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, Cell,
} from 'recharts';

/* ─── Grade helpers ─── */
const gradeColors = { A: 'text-emerald-500', B: 'text-blue-500', C: 'text-amber-500', D: 'text-orange-500', F: 'text-red-500' };
const gradeGlows  = { A: 'shadow-emerald-500/30', B: 'shadow-blue-500/30', C: 'shadow-amber-500/30', D: 'shadow-orange-500/30', F: 'shadow-red-500/30' };
const difficultyColors = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' };

/* ─── Agent config ─── */
const agentConfig = {
  hr: {
    icon: Users, label: 'HR / Communication', color: 'blue',
    bgClass: 'bg-blue-50', borderClass: 'border-blue-200', textClass: 'text-blue-600', iconBg: 'bg-blue-500',
    metrics: [
      { key: 'clarity',         label: 'Clarity',         icon: MessageSquare },
      { key: 'relevance',       label: 'Relevance',       icon: Target },
      { key: 'professionalism', label: 'Professionalism', icon: Award },
      { key: 'star_method',     label: 'STAR Method',     icon: Star },
      { key: 'communication',   label: 'Communication',   icon: Volume2 },
    ],
  },
  technical: {
    icon: Code2, label: 'Technical', color: 'violet',
    bgClass: 'bg-violet-50', borderClass: 'border-violet-200', textClass: 'text-violet-600', iconBg: 'bg-violet-500',
    metrics: [
      { key: 'correctness',     label: 'Correctness',     icon: CheckCircle2 },
      { key: 'depth',           label: 'Depth',           icon: BarChart3 },
      { key: 'efficiency',      label: 'Efficiency',      icon: Gauge },
      { key: 'communication',   label: 'Explanation',     icon: MessageSquare },
      { key: 'problem_solving', label: 'Problem Solving', icon: Brain },
    ],
  },
  stress: {
    icon: Zap, label: 'Stress / Composure', color: 'amber',
    bgClass: 'bg-amber-50', borderClass: 'border-amber-200', textClass: 'text-amber-600', iconBg: 'bg-amber-500',
    metrics: [
      { key: 'composure',          label: 'Composure',         icon: Activity },
      { key: 'confidence',         label: 'Confidence',        icon: Award },
      { key: 'eye_contact',        label: 'Eye Contact',       icon: Eye },
      { key: 'vocal_steadiness',   label: 'Vocal Steadiness',  icon: Volume2 },
      { key: 'pressure_handling',  label: 'Pressure Handling', icon: Zap },
    ],
  },
};

/* ─── Chart tooltips ─── */
const ScoreTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#D6E7F7] rounded-xl px-3.5 py-2.5 shadow-lg">
      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-base font-bold text-slate-900">{payload[0].value?.toFixed(1)}</p>
    </div>
  );
};

const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#D6E7F7] rounded-xl px-3 py-2 shadow-lg">
      <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-bold text-slate-900">{payload[0].value} questions</p>
    </div>
  );
};

/* ─── MetricBar ─── */
const MetricBar = ({ label, value, max = 10, color = 'primary', icon: Icon, delay = 0 }) => {
  const percent = Math.min((value / max) * 100, 100);
  const colorMap = { blue: 'bg-blue-500', violet: 'bg-violet-500', amber: 'bg-amber-500', emerald: 'bg-emerald-500', primary: 'bg-primary-500' };
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-slate-600">
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
          {label}
        </span>
        <span className="text-xs font-bold text-slate-900 tabular-nums">
          {value?.toFixed?.(1) || '0'}<span className="text-slate-400 font-normal">/{max}</span>
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${colorMap[color]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
};

/* ─── AgentDetailCard ─── */
const AgentDetailCard = ({ agentType, scores, detailed, feedback, metricsOverride }) => {
  const config = agentConfig[agentType];
  if (!config) return null;
  const Icon = config.icon;
  const overallScore = scores?.overall || 0;
  const metrics = metricsOverride || config.metrics;

  return (
    <GlassCard className="!p-0 overflow-hidden" hover={false}>
      <div className={`flex items-center justify-between px-5 py-4 border-b ${config.borderClass}/60`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg ${config.iconBg} flex items-center justify-center shrink-0`}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-slate-900">{config.label}</h3>
            <p className="text-[10px] text-slate-400">Agent Evaluation</p>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-lg ${config.bgClass} border ${config.borderClass}`}>
          <span className={`text-xl font-black ${config.textClass} tabular-nums`}>{overallScore.toFixed(1)}</span>
          <span className="text-xs text-slate-400">/10</span>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3.5">
        {metrics.map((metric, i) => {
          const value = detailed?.[metric.key] || scores?.[metric.key] || 0;
          return (
            <MetricBar key={metric.key} label={metric.label} value={value} icon={metric.icon} color={config.color} delay={0.07 * i} />
          );
        })}
      </div>

      {feedback && (
        <div className="px-5 pb-4">
          <div className={`p-3.5 rounded-xl ${config.bgClass} border ${config.borderClass}/60`}>
            <p className="text-[10px] text-slate-400 mb-1 font-semibold uppercase tracking-wide">Agent Feedback</p>
            <p className="text-[12.5px] text-slate-700 leading-relaxed">{feedback}</p>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

/* ─── Results ─── */
export const Results = () => {
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [downloading, setDownloading] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const sessionId = new URLSearchParams(location.search).get('session');

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }
    interviewAPI.getSessionDetail(sessionId)
      .then(res => setData(res.data))
      .catch(err => console.error('Failed to load results:', err))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleDownloadPDF = async () => {
    if (!sessionId) return;
    setDownloading(true);
    try {
      const res = await reportAPI.downloadPDF(sessionId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `IntelliHire_Report_${sessionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('PDF download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  /* ── Derived data (safe with null data during loading) ── */
  const eval_            = data?.evaluation || {};
  const score            = eval_.final_score || 0;
  const grade            = eval_.grade || (score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D');
  const strengths        = eval_.strengths || [];
  const improvements     = eval_.improvements || [];
  const roadmap          = eval_.roadmap?.steps || (Array.isArray(eval_.roadmap) ? eval_.roadmap : []);
  const recommendation   = eval_.recommendation || '';
  const feedback         = eval_.feedbacks?.coordinator || eval_.coordinator_feedback || '';
  const agentsUsed       = eval_.agents_used || ['hr', 'technical', 'stress'];
  const interviewMode    = eval_.interview_mode || data?.interview_mode || 'mixed';
  const detailedAnalysis = eval_.detailed_analysis || {};

  const analytics             = eval_.performance_analytics || {};
  const perQuestionData       = analytics.performance_data?.per_question || [];
  const difficultyProgression = analytics.difficulty_progression || [];
  const avgResponseTime       = analytics.average_response_time || 0;
  const totalFillerWords      = analytics.total_filler_words || 0;
  const performanceTrend      = analytics.performance_trend || 'stable';
  const finalDifficulty       = analytics.final_difficulty_reached || 'easy';

  const hrScores     = eval_.hr_scores || {};
  const techScores   = eval_.technical_scores || {};
  const stressScores = eval_.stress_scores || {};

  const modeLabel = { hr: 'HR Interview', technical: 'Technical Interview', stress: 'Stress Interview', mixed: 'Full Agentic Interview' }[interviewMode] || interviewMode;
  const modeBadge = { hr: 'bg-blue-50 text-blue-700 border-blue-200', technical: 'bg-violet-50 text-violet-700 border-violet-200', stress: 'bg-amber-50 text-amber-700 border-amber-200', mixed: 'bg-primary-50 text-primary-700 border-primary-200' }[interviewMode] || 'bg-primary-50 text-primary-700 border-primary-200';

  /* Stress metrics filtered by answer mode */
  const answerMode = data?.answer_mode || 'text';
  const stressMetrics = useMemo(() => [
    { key: 'composure',         label: 'Composure',         icon: Activity },
    { key: 'confidence',        label: 'Confidence',        icon: Award },
    ...(answerMode !== 'text'  ? [{ key: 'vocal_steadiness', label: 'Vocal Steadiness', icon: Volume2 }] : []),
    ...(answerMode === 'video' ? [{ key: 'eye_contact',      label: 'Eye Contact',      icon: Eye      }] : []),
    { key: 'pressure_handling', label: 'Pressure Handling', icon: Zap },
  ], [answerMode]);

  /* Radar */
  const radarData = useMemo(() => {
    const points = [];
    if (agentsUsed.includes('hr') && hrScores) {
      points.push({ skill: 'Clarity',        value: hrScores.clarity         || 0 });
      points.push({ skill: 'Professionalism', value: hrScores.professionalism || 0 });
    }
    if (agentsUsed.includes('technical') && techScores) {
      points.push({ skill: 'Correctness', value: techScores.correctness || 0 });
      points.push({ skill: 'Depth',       value: techScores.depth       || 0 });
    }
    if (agentsUsed.includes('stress') && stressScores) {
      const sd = detailedAnalysis?.stress || {};
      points.push({ skill: 'Composure',        value: sd.composure         || stressScores.composure         || 0 });
      points.push({ skill: 'Confidence',        value: sd.confidence        || stressScores.confidence        || 0 });
      points.push({ skill: 'Pressure Handling', value: sd.pressure_handling || stressScores.pressure_handling || 0 });
    }
    return points;
  }, [agentsUsed, hrScores, techScores, stressScores, detailedAnalysis]);

  /* Hero stats strip */
  const heroStats = useMemo(() => [
    { label: 'Avg Response',   value: `${Math.round(avgResponseTime)}s`,                                       icon: Clock,        iconColor: 'text-blue-500',   bg: 'bg-blue-50'   },
    { label: 'Filler Words',   value: totalFillerWords,                                                         icon: MessageSquare,iconColor: 'text-amber-500',  bg: 'bg-amber-50'  },
    { label: 'Trend',          value: performanceTrend.charAt(0).toUpperCase() + performanceTrend.slice(1),     icon: TrendingUp,   iconColor: 'text-emerald-500',bg: 'bg-emerald-50'},
    { label: 'Max Difficulty', value: finalDifficulty.charAt(0).toUpperCase() + finalDifficulty.slice(1),      icon: Target,       iconColor: 'text-violet-500', bg: 'bg-violet-50' },
  ], [avgResponseTime, totalFillerWords, performanceTrend, finalDifficulty]);

  if (loading) {
    return (
      <PageTransition className="pt-8 pb-16 px-5 sm:px-7 lg:px-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="pt-8 pb-16 px-5 sm:px-7 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-600 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div className="flex items-center gap-2.5">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${modeBadge}`}>{modeLabel}</span>
            <AnimatedButton variant="secondary" icon={Download} onClick={handleDownloadPDF} disabled={downloading}>
              {downloading ? 'Downloading…' : 'Download PDF'}
            </AnimatedButton>
          </div>
        </div>

        {/* ── Score Hero ── */}
        <GlassCard hover={false} className="!p-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            {/* Grade block */}
            <div className="sm:w-64 shrink-0 px-7 py-7 border-b sm:border-b-0 sm:border-r border-[#D6E7F7]/80 flex flex-col items-center justify-center text-center">
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 120, delay: 0.1 }}>
                <div className={`w-24 h-24 mx-auto rounded-full bg-white border-4 border-white shadow-xl ${gradeGlows[grade] || 'shadow-slate-200'} flex items-center justify-center mb-4`}>
                  <span className={`text-5xl font-black ${gradeColors[grade] || 'text-slate-400'}`}>{grade}</span>
                </div>
              </motion.div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Overall Score</p>
              <div className="flex items-end gap-1.5 justify-center">
                <span className="text-4xl font-black text-slate-900 tabular-nums leading-none">{Math.round(score)}</span>
                <span className="text-lg text-slate-400 mb-0.5">%</span>
              </div>
              {recommendation && (
                <span className={`mt-3 inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                  recommendation.includes('Strong Hire') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  recommendation.includes('Hire') && !recommendation.includes('No') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  recommendation.includes('Lean') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-red-50 text-red-700 border-red-200'
                }`}>{recommendation}</span>
              )}
            </div>

            {/* Feedback + agent score pills */}
            <div className="flex-1 px-6 py-6 flex flex-col justify-center">
              {feedback && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Coordinator Feedback</p>
                  <p className="text-[13.5px] text-slate-600 leading-relaxed italic">"{feedback}"</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {agentsUsed.includes('hr') && (
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200/80">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[12px] font-medium text-blue-700">HR</span>
                    <span className="text-[13px] font-black text-blue-900 tabular-nums">{(hrScores?.overall || 0).toFixed(1)}</span>
                    <span className="text-[10px] text-blue-400">/10</span>
                  </div>
                )}
                {agentsUsed.includes('technical') && (
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-50 border border-violet-200/80">
                    <Code2 className="w-3.5 h-3.5 text-violet-500" />
                    <span className="text-[12px] font-medium text-violet-700">Technical</span>
                    <span className="text-[13px] font-black text-violet-900 tabular-nums">{(techScores?.overall || 0).toFixed(1)}</span>
                    <span className="text-[10px] text-violet-400">/10</span>
                  </div>
                )}
                {agentsUsed.includes('stress') && (
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200/80">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[12px] font-medium text-amber-700">Stress</span>
                    <span className="text-[13px] font-black text-amber-900 tabular-nums">{(stressScores?.overall || 0).toFixed(1)}</span>
                    <span className="text-[10px] text-amber-400">/10</span>
                  </div>
                )}
                {eval_.company_fit > 0 && (
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200/80">
                    <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[12px] font-medium text-emerald-700">Company Fit</span>
                    <span className="text-[13px] font-black text-emerald-900 tabular-nums">{(eval_.company_fit || 0).toFixed(1)}</span>
                    <span className="text-[10px] text-emerald-400">/10</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-[#D6E7F7]/80 border-t border-[#D6E7F7]/80">
            {heroStats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 * i }}
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

        {/* ── Charts ── */}
        {(perQuestionData.length > 0 || radarData.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {perQuestionData.length > 0 && (
              <GlassCard hover={false} className="!p-0 overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#D6E7F7]/80">
                  <LineIcon className="w-4 h-4 text-primary-500" />
                  <h2 className="text-[14px] font-semibold text-slate-900">Performance Over Questions</h2>
                </div>
                <div className="px-4 py-4">
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={perQuestionData} margin={{ top: 5, right: 10, left: -24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" vertical={false} />
                      <XAxis dataKey="question" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `Q${v}`} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ScoreTooltip />} />
                      <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5}
                        dot={{ fill: '#6366f1', strokeWidth: 2, r: 3.5, stroke: 'white' }}
                        activeDot={{ r: 5.5, fill: '#4f46e5', stroke: 'white', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            )}
            {radarData.length > 0 && (
              <GlassCard hover={false} className="!p-0 overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#D6E7F7]/80">
                  <Brain className="w-4 h-4 text-primary-500" />
                  <h2 className="text-[14px] font-semibold text-slate-900">Skill Overview</h2>
                </div>
                <div className="px-4 py-2">
                  <ResponsiveContainer width="100%" height={175}>
                    <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: '#64748b' }} stroke="#e2e8f0" />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} stroke="#e2e8f0" />
                      <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            )}
          </div>
        )}

        {/* ── Difficulty Distribution ── */}
        {difficultyProgression.length > 0 && (() => {
          const chartData = difficultyProgression.map(d => ({
            name: d.difficulty.charAt(0).toUpperCase() + d.difficulty.slice(1),
            count: d.count,
            fill: difficultyColors[d.difficulty],
          }));
          return (
            <GlassCard hover={false} className="!p-0 overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#D6E7F7]/80">
                <BarChart3 className="w-4 h-4 text-primary-500" />
                <h2 className="text-[14px] font-semibold text-slate-900">Difficulty Distribution</h2>
              </div>
              <div className="px-4 py-4">
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                      {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          );
        })()}

        {/* ── Agent Evaluations ── */}
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <Target className="w-4 h-4 text-primary-500" />
            <h2 className="text-[15px] font-bold text-slate-900">Detailed Agent Evaluation</h2>
          </div>
          <div className={`grid gap-4 ${agentsUsed.length === 1 ? 'grid-cols-1' : agentsUsed.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {agentsUsed.includes('hr') && (
              <AgentDetailCard agentType="hr" scores={hrScores} detailed={detailedAnalysis.hr} feedback={eval_.feedbacks?.hr} />
            )}
            {agentsUsed.includes('technical') && (
              <AgentDetailCard agentType="technical" scores={techScores} detailed={detailedAnalysis.technical} feedback={eval_.feedbacks?.technical} />
            )}
            {agentsUsed.includes('stress') && (
              <AgentDetailCard agentType="stress" scores={stressScores} detailed={detailedAnalysis.stress} feedback={eval_.feedbacks?.stress} metricsOverride={stressMetrics} />
            )}
          </div>
        </div>

        {/* ── Strengths & Improvements ── */}
        <GlassCard hover={false} className="!p-0 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#D6E7F7]/80">
            <div>
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#D6E7F7]/80">
                <Star className="w-4 h-4 text-amber-500" />
                <h2 className="text-[14px] font-semibold text-slate-900">Top Strengths</h2>
              </div>
              <ul className="px-5 py-4 space-y-3">
                {(strengths.length > 0 ? strengths : ['Complete the interview to see results']).map((s, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 * i }}
                    className="flex items-start gap-2.5 text-[13px] text-slate-700 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />{s}
                  </motion.li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#D6E7F7]/80">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <h2 className="text-[14px] font-semibold text-slate-900">Areas to Improve</h2>
              </div>
              <ul className="px-5 py-4 space-y-3">
                {(improvements.length > 0 ? improvements : ['Complete the interview to see results']).map((s, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 * i }}
                    className="flex items-start gap-2.5 text-[13px] text-slate-700 leading-relaxed">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />{s}
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </GlassCard>

        {/* ── Learning Roadmap ── */}
        {roadmap.length > 0 && (
          <GlassCard hover={false} className="!p-0 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#D6E7F7]/80">
              <Trophy className="w-4 h-4 text-primary-500" />
              <h2 className="text-[14px] font-semibold text-slate-900">Learning Roadmap</h2>
            </div>
            <ol className="px-5 py-4 space-y-3">
              {roadmap.map((step, i) => (
                <motion.li key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 * i }}
                  className="flex items-start gap-3 text-[13px] text-slate-700 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-primary-50 border border-[#D6E7F7] text-primary-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </motion.li>
              ))}
            </ol>
          </GlassCard>
        )}

        {/* ── Per-Question Table ── */}
        {perQuestionData.length > 0 && (
          <GlassCard hover={false} className="!p-0 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#D6E7F7]/80">
              <BarChart3 className="w-4 h-4 text-primary-500" />
              <h2 className="text-[14px] font-semibold text-slate-900">Question-by-Question Breakdown</h2>
              <span className="ml-auto text-[10px] text-slate-400 font-medium">{perQuestionData.length} questions</span>
            </div>
            <div className="overflow-x-auto px-3 py-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#D6E7F7]/80">
                    {['#', 'Type', 'Difficulty', 'Score', 'Time'].map(h => (
                      <th key={h} className="text-left py-2.5 px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {perQuestionData.map((q, i) => (
                    <tr key={i} className="border-b border-[#D6E7F7]/40 hover:bg-primary-50/30 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-600 text-xs tabular-nums">Q{q.question}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${q.type === 'hr' ? 'bg-blue-50 text-blue-600' : q.type === 'technical' ? 'bg-violet-50 text-violet-600' : 'bg-amber-50 text-amber-600'}`}>{q.type}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold capitalize"
                          style={{ backgroundColor: `${difficultyColors[q.difficulty]}18`, color: difficultyColors[q.difficulty] }}>
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`font-bold tabular-nums text-sm ${q.score >= 7 ? 'text-emerald-600' : q.score >= 5 ? 'text-amber-600' : 'text-red-600'}`}>
                          {q.score?.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-xs tabular-nums">{q.time}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Try Another Interview', sub: 'Start a new mock session',      path: '/setup',    Icon: PlayCircle,   iconBg: 'bg-primary-500', hoverBorder: 'hover:border-primary-200', hoverBg: 'hover:bg-primary-50/40'  },
            { label: 'Career Roadmap',         sub: 'Track your learning path',      path: '/roadmap',  Icon: Route,        iconBg: 'bg-blue-500',    hoverBorder: 'hover:border-blue-200',    hoverBg: 'hover:bg-blue-50/40'     },
            { label: 'AI Coach',               sub: 'Get personalised feedback',     path: '/ai-coach', Icon: BrainCircuit, iconBg: 'bg-violet-500',  hoverBorder: 'hover:border-violet-200',  hoverBg: 'hover:bg-violet-50/40'   },
          ].map(action => (
            <motion.button key={action.label} onClick={() => navigate(action.path)}
              whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
              className={`flex items-center gap-3.5 p-4 rounded-2xl bg-white/80 border border-[#D6E7F7] ${action.hoverBorder} ${action.hoverBg} transition-all duration-150 group text-left shadow-sm`}>
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
