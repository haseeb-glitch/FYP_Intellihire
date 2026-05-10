import React, { useState, useEffect, useRef } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import {
  Plus, Video, Mic, MessageSquare, ArrowRight, ArrowLeft, Building2,
  ChevronDown, Layers, BarChart2, Sparkles, Users, Code2, Brain, Zap,
  Clock, CheckCircle2, Upload, FileText, X, Loader2,
  Target, Trophy, Play, Search, Briefcase, Command, Activity, Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { interviewAPI, personalizedAPI } from '../api/axios';
import { cn } from '../lib/utils';

/* ─── Professional SVG Logos ─── */
const Logos = {
  Google: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  ),
  Meta: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="#0866FF">
      <path d="M16.14 5.37C14.73 5.37 13.56 5.86 12.63 6.81L12 7.46L11.37 6.81C10.44 5.86 9.27 5.37 7.86 5.37C5.01 5.37 2.7 7.68 2.7 10.53C2.7 13.38 5.01 15.69 7.86 15.69C9.27 15.69 10.44 15.2 11.37 14.25L12 13.6L12.63 14.25C13.56 15.2 14.73 15.69 16.14 15.69C18.99 15.69 21.3 13.38 21.3 10.53C21.3 7.68 18.99 5.37 16.14 5.37ZM16.14 14.19C14.13 14.19 12.5 12.56 12.5 10.55C12.5 8.54 14.13 6.91 16.14 6.91C18.15 6.91 19.78 8.54 19.78 10.55C19.78 12.56 18.15 14.19 16.14 14.19ZM7.86 14.19C5.85 14.19 4.22 12.56 4.22 10.55C4.22 8.54 5.85 6.91 7.86 6.91C9.87 6.91 11.5 8.54 11.5 10.55C11.5 12.56 9.87 14.19 7.86 14.19Z" />
    </svg>
  ),
  Apple: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05 1.72-3.32 1.72s-1.63-.68-3.23-.68c-1.61 0-2.11.66-3.27.7-1.31.05-2.45-.88-3.48-2.31C2.5 18.06 1.5 15.24 1.5 12.12c0-3.13 1.6-5.18 3.96-5.18 1.15 0 2.05.62 2.87.62s1.65-.65 2.97-.65c1.23 0 2.45.54 3.25 1.5-2.58 1.34-2.16 5.08.64 6.22-.56 1.43-1.32 2.76-2.14 3.65zM12.03 5.95c-.13-1.6 1.18-3.07 2.65-3.45.19 1.72-1.2 3.25-2.65 3.45z" />
    </svg>
  ),
  Amazon: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="#E47911">
      <path d="M18.73 17.58c-1.33 1.04-3.16 1.67-5.11 1.67-2.6 0-4.9-.78-6.66-2.04-.15-.1-.13-.3.04-.37.93-.38 2.09-.56 3.1-.56 1.6 0 3.23.44 4.54 1.15.15.08.28-.08.15-.19-1.23-1.05-3.06-1.68-4.9-1.68-2.6 0-4.92.83-6.68 2.14-.15.11-.14.3.02.37.93.38 2.1.56 3.1.56 1.62 0 3.24-.45 4.54-1.15.15-.08.28.08.15.19l.13-.1zm1.2-2.12c-.1-.1-.28-.11-.38-.01-1.2 1.04-2.96 1.63-4.8 1.63-2.35 0-4.47-.8-6.1-2.15-.1-.1-.28-.1-.38 0l-.3.3c-.1.1-.1.28 0 .38 1.73 1.45 4 2.3 6.63 2.3 2.13 0 4.14-.65 5.57-1.8.1-.08.11-.26.03-.36l-.3-.29zm1.07-1.85c-.08-.12-.26-.14-.38-.06-1.07.72-2.48 1.13-4 1.13-1.95 0-3.7-.66-5.1-1.78-.1-.08-.28-.07-.37.04l-.24.3c-.08.1-.07.28.04.36 1.5 1.25 3.4 1.98 5.52 1.98 1.7 0 3.26-.45 4.53-1.23.1-.07.13-.24.06-.35l-.06-.39z" />
    </svg>
  ),
  Microsoft: () => (
    <svg viewBox="0 0 23 23" className="w-full h-full">
      <rect x="0" y="0" width="11" height="11" fill="#f25022" />
      <rect x="12" y="0" width="11" height="11" fill="#7fba00" />
      <rect x="0" y="12" width="11" height="11" fill="#00a4ef" />
      <rect x="12" y="12" width="11" height="11" fill="#ffb900" />
    </svg>
  ),
  Netflix: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="#E50914">
      <path d="M7.1 22.8c-.3 0-.6-.1-.8-.3-.2-.2-.3-.5-.3-.8V4c0-.3.1-.6.3-.8s.5-.3.8-.3h3.5c.3 0 .6.1.8.3s.3.5.3.8v1.3l4.5-5c.2-.2.5-.3.8-.3.3 0 .6.1.8.3s.3.5.3.8v18.8c0 .3-.1.6-.3.8s-.5.3-.8.3h-3.5c-.3 0-.6-.1-.8-.3s-.3-.5-.3-.8v-1.3l-4.5 5c-.2.2-.5.3-.8.3h-3.5z" />
    </svg>
  ),
};

/* ─── Static Config ─── */
const answerModes = [
  { id: 'video', icon: Video, label: 'Video', sub: 'Camera + Mic', color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'audio', icon: Mic, label: 'Voice', sub: 'Microphone only', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'text', icon: MessageSquare, label: 'Text', sub: 'Chat interface', color: 'text-violet-500', bg: 'bg-violet-50' },
];

const agentOptions = [
  { id: 'hr', icon: Users, label: 'HR Specialist', desc: 'Soft skills focus.', tags: ['HR', 'Culture'], color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'technical', icon: Code2, label: 'Tech Lead', desc: 'Technical depth.', tags: ['Tech', 'Logic'], color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'stress', icon: Activity, label: 'Stress Agent', desc: 'Pressure testing.', tags: ['Stress', 'Speed'], color: 'text-amber-500', bg: 'bg-amber-50' },
  { id: 'mixed', icon: Command, label: 'Elite Panel', desc: 'Full AI experience.', tags: ['Mixed', 'Best'], color: 'text-primary-500', bg: 'bg-primary-50', recommended: true },
];

const durationPresets = [
  { questions: 5,  minutes: 10, label: 'Quick', icon: Zap,      color: 'text-amber-500',   bg: 'bg-amber-50' },
  { questions: 10, minutes: 20, label: 'Standard', icon: BarChart2, color: 'text-blue-500',    bg: 'bg-blue-50' },
  { questions: 15, minutes: 35, label: 'In-Depth', icon: Target,   color: 'text-violet-500',  bg: 'bg-violet-50' },
  { questions: 20, minutes: 45, label: 'Master', icon: Trophy,   color: 'text-emerald-500', bg: 'bg-emerald-50' },
];

const FEATURED_COMPANIES = [
  { name: 'Google',    logo: Logos.Google,    bg: 'bg-white' },
  { name: 'Meta',      logo: Logos.Meta,      bg: 'bg-white' },
  { name: 'Apple',     logo: Logos.Apple,     bg: 'bg-white' },
  { name: 'Amazon',    logo: Logos.Amazon,    bg: 'bg-white' },
  { name: 'Microsoft', logo: Logos.Microsoft, bg: 'bg-white' },
  { name: 'Netflix',   logo: Logos.Netflix,   bg: 'bg-white' },
];

const STEP_LABELS = ['Experience', 'Parameters', 'Identity', 'Launch'];

/* ─── Components ─── */

const Timeline = ({ current }) => (
  <div className="flex items-center justify-between gap-2 mb-10 px-4">
    {STEP_LABELS.map((label, i) => (
      <React.Fragment key={i}>
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300",
            i < current ? "bg-emerald-500 text-white" :
            i === current ? "bg-primary-500 text-white ring-4 ring-primary-50" :
            "bg-slate-100 text-slate-400"
          )}>
            {i < current ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
          </div>
          <span className={cn(
            "text-[9px] font-black uppercase tracking-wider text-center whitespace-nowrap",
            i <= current ? "text-slate-900" : "text-slate-400"
          )}>{label}</span>
        </div>
        {i < STEP_LABELS.length - 1 && (
          <div className="flex-[2] h-[1.5px] mb-5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div className="h-full bg-primary-400" initial={{ width: '0%' }} animate={{ width: i < current ? '100%' : '0%' }} transition={{ duration: 0.5 }} />
          </div>
        )}
      </React.Fragment>
    ))}
  </div>
);

const Dropdown = ({ value, onChange, options, icon: Icon, placeholder, className }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);
  const filtered = options.filter(o => o.toLowerCase().includes(q.toLowerCase()));

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button onClick={() => setOpen(o => !o)} className="w-full glass-input flex items-center gap-3 px-4 py-2.5 rounded-xl text-left hover:border-primary-300 transition-all shadow-sm">
        <Icon className="w-4 h-4 text-slate-400 shrink-0" />
        <span className={cn("flex-1 text-[13px] truncate", value ? "text-slate-900 font-semibold" : "text-slate-400 font-medium")}>{value || placeholder}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute z-[100] mt-2 w-full glass-card rounded-xl shadow-2xl border border-[#D6E7F7] overflow-hidden flex flex-col max-h-[200px]">
            <div className="p-2 border-b border-slate-50">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg">
                <Search className="w-3 h-3 text-slate-400" />
                <input type="text" placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} onClick={(e) => e.stopPropagation()} className="flex-1 bg-transparent text-[12px] outline-none text-slate-700" />
              </div>
            </div>
            <div className="overflow-y-auto py-1 custom-scrollbar">
              {filtered.map(opt => (
                <button key={opt} onClick={() => { onChange(opt); setOpen(false); setQ(''); }} className={cn("w-full text-left px-4 py-1.5 text-[12px] font-medium transition-colors", value === opt ? "text-primary-600 bg-primary-50" : "text-slate-600 hover:bg-slate-50")}>{opt}</button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Main Page ─── */

export const InterviewSetup = () => {
  const [step, setStep] = useState(0);
  const [interviewType, setInterviewType] = useState(null);
  const [answerMode, setAnswerMode] = useState('text');
  const [company, setCompany] = useState('');
  const [domain, setDomain] = useState('');
  const difficulty = 'medium';
  const [selectedAgent, setSelectedAgent] = useState('mixed');
  const [selectedPreset, setSelectedPreset] = useState(1);
  const [customQuestions, setCustomQuestions] = useState(null);
  const [customMinutes, setCustomMinutes] = useState(null);
  const [promptText, setPromptText] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [inputMethod, setInputMethod] = useState('text');
  const fileInputRef = useRef(null);
  const [domains, setDomains] = useState([]);
  const [companyList, setCompanyList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    interviewAPI.getDomains().then(res => setDomains(res.data.domains || [])).catch(() => setDomains(['Software Engineering', 'Frontend', 'Backend', 'Data Science', 'Mobile']));
    interviewAPI.getCompanies().then(res => setCompanyList([...Object.keys(res.data || {}), 'Other'])).catch(() => setCompanyList(['Google', 'Meta', 'Apple', 'Amazon', 'Microsoft', 'Other']));
  }, []);

  const handleStart = async () => {
    setLoading(true); setError('');
    try {
      let res; const role = domain || 'Software Engineer';
      const qCount = customQuestions ?? durationPresets[selectedPreset].questions;
      const mCount = customMinutes ?? durationPresets[selectedPreset].minutes;
      if (interviewType === 'personalized') {
        if (inputMethod === 'file' && uploadedFile) {
          const fd = new FormData(); fd.append('file', uploadedFile); fd.append('job_role', role); fd.append('difficulty', difficulty); fd.append('agent_mode', selectedAgent); fd.append('answer_mode', answerMode); fd.append('total_questions', qCount); fd.append('duration_minutes', mCount);
          res = await personalizedAPI.uploadAndGenerate(fd);
        } else {
          res = await personalizedAPI.textGenerate({ prompt_text: promptText, job_role: role, difficulty, agent_mode: selectedAgent, answer_mode: answerMode, total_questions: qCount, duration_minutes: mCount });
        }
      } else {
        res = await interviewAPI.startInterview({ domain, company_name: company, job_role: role, difficulty, interview_mode: selectedAgent, answer_mode: answerMode, total_questions: qCount, duration_minutes: mCount });
      }
      navigate(`/interview?session=${res.data.session_id}&mode=${answerMode}&company=${encodeURIComponent(interviewType === 'personalized' ? 'Personalized' : company)}&role=${encodeURIComponent(role)}`);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const message = typeof detail === 'string'
        ? detail
        : detail?.message || err.message || 'Failed to start interview.';
      setError(message);
    } finally { setLoading(false); }
  };

  const goBack = () => { if (step === 0) return navigate('/dashboard'); if (step === 1) { setStep(0); setInterviewType(null); return; } setStep(s => s - 1); };
  const goNext = () => setStep(s => s + 1);

  /* ─── Step Views ─── */

  const renderStep0 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8"><h1 className="text-xl font-bold text-slate-900 tracking-tight">Practice Path</h1><p className="text-xs text-slate-500 mt-1">Select your preferred interview style.</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { id: 'domain', title: 'Domain Practice', icon: Layers, color: 'text-blue-500', bg: 'bg-blue-50' },
          { id: 'company', title: 'Company Target', icon: Building2, color: 'text-violet-500', bg: 'bg-violet-50' },
          { id: 'personalized', title: 'AI Tailored', icon: Sparkles, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        ].map(type => (
          <motion.button key={type.id} whileHover={{ y: -2 }} onClick={() => { setInterviewType(type.id); if (type.id === 'domain') setCompany('General'); setStep(1); }} className="flex flex-col items-center gap-3 p-6 bg-white border border-[#D6E7F7] rounded-xl hover:bg-primary-50/20 hover:border-primary-400 transition-all text-center group shadow-sm">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105", type.bg, type.color)}><type.icon className="w-5 h-5" /></div>
            <span className="text-[13px] font-bold text-slate-800">{type.title}</span>
          </motion.button>
        ))}
      </div>
      <div className="pt-6 border-t border-[#D6E7F7]/40 flex justify-center"><button onClick={() => navigate('/dashboard')} className="text-[11px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors"><ArrowLeft className="w-3 h-3" /> Dashboard</button></div>
    </div>
  );

  const renderStep1 = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5 space-y-6">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">1. Focus & Method</label>
          <Dropdown value={domain} onChange={setDomain} options={domains} icon={Briefcase} placeholder="Target Role..." />
          {interviewType === 'personalized' && (
            <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg">
              {[{id:'text', label:'Prompt'}, {id:'file', label:'File'}].map(m => (
                <button key={m.id} onClick={() => setInputMethod(m.id)} className={cn("flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all", inputMethod === m.id ? "bg-white shadow-sm text-primary-700" : "text-slate-500")}>{m.label}</button>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">2. Answer Mode</label>
          <div className="grid grid-cols-3 gap-2">
            {answerModes.map(m => (
              <button key={m.id} onClick={() => setAnswerMode(m.id)} className={cn("p-2.5 rounded-xl border text-center transition-all", answerMode === m.id ? "bg-primary-50 border-primary-300 shadow-sm" : "bg-white border-[#D6E7F7]/40 hover:border-slate-300")}>
                <m.icon className={cn("w-4 h-4 mx-auto mb-1", answerMode === m.id ? "text-primary-600" : "text-slate-400")} />
                <p className={cn("text-[10px] font-bold truncate", answerMode === m.id ? "text-slate-900" : "text-slate-500")}>{m.label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="lg:col-span-7 space-y-5">
        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">{interviewType === 'company' ? '3. Specific Selection' : '3. Setup'}</label>
        {interviewType === 'personalized' ? (
          <div className="h-full flex flex-col">
            {inputMethod === 'text' ? (
              <textarea value={promptText} onChange={e => setPromptText(e.target.value)} placeholder="Describe your goals..." className="flex-1 w-full glass-input p-4 rounded-xl text-xs font-medium min-h-[140px] resize-none" />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 border border-dashed border-[#D6E7F7] rounded-xl bg-slate-50/20 hover:bg-primary-50/10 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <input ref={fileInputRef} type="file" className="hidden" onChange={e => setUploadedFile(e.target.files[0])} />
                <div className="w-10 h-10 rounded-lg bg-white shadow flex items-center justify-center mb-2"><Upload className="w-4 h-4 text-primary-500" /></div>
                <span className="text-[11px] font-bold text-slate-600">{uploadedFile ? uploadedFile.name : "Select File"}</span>
              </div>
            )}
          </div>
        ) : interviewType === 'company' ? (
          <div className="space-y-4">
             <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                {FEATURED_COMPANIES.map(c => (
                  <button key={c.name} onClick={() => setCompany(c.name)} className={cn("flex items-center gap-2 p-1.5 rounded-lg border transition-all", company === c.name ? "bg-primary-50 border-primary-300 shadow-sm" : "bg-white border-[#D6E7F7]/40 hover:bg-slate-50")}>
                    <div className="w-6 h-6 shrink-0"><c.logo /></div>
                    <span className="text-[10px] font-bold text-slate-700 truncate">{c.name}</span>
                  </button>
                ))}
             </div>
             <div className="pt-2"><Dropdown value={companyList.slice(0, 10).includes(company) || !company ? company : ''} onChange={setCompany} options={companyList} icon={Search} placeholder="Browse Database..." /></div>
             <div className="grid grid-cols-2 gap-1.5">{companyList.slice(0, 4).map(c => (
               <button key={c} onClick={() => setCompany(c)} className={cn("px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all truncate", company === c ? "bg-primary-50 border-primary-300 text-primary-700" : "bg-white border-slate-100 text-slate-500")}>{c}</button>
             ))}</div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-8 text-center">
            <p className="text-[12px] text-slate-500 font-medium">Ready to start your practice session with <span className="font-bold text-slate-700">{domain}</span></p>
          </div>
        )}
      </div>
      <div className="lg:col-span-12 flex gap-3 pt-4 border-t border-[#D6E7F7]/40">
        <AnimatedButton onClick={goBack} variant="outline" className="px-8 h-10">Back</AnimatedButton>
        <AnimatedButton onClick={goNext} variant="primary" className="flex-1 h-10" icon={ArrowRight} disabled={(interviewType==='personalized'?(inputMethod==='text'?promptText.length<10:!uploadedFile):(!domain||(interviewType==='company'&&!company)||(interviewType==='domain'&&!domain)))}>Continue</AnimatedButton>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="text-center mb-4"><h1 className="text-xl font-bold text-slate-900">Choose AI Expert</h1><p className="text-xs text-slate-500 mt-1">Select a specialist for your practice.</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {agentOptions.map(a => (
          <button key={a.id} onClick={() => setSelectedAgent(a.id)} className={cn("p-5 rounded-xl border flex flex-col items-center text-center transition-all relative group shadow-sm", selectedAgent === a.id ? "border-primary-400 bg-primary-50/20 shadow-primary-500/5" : "border-[#D6E7F7]/40 bg-white hover:border-slate-300")}>
            <div className={cn("w-10 h-10 rounded-lg mb-3 flex items-center justify-center", a.bg, a.color)}><a.icon className="w-5 h-5" /></div>
            <h4 className="text-[13px] font-bold text-slate-900 mb-1">{a.label}</h4>
            <p className="text-[10px] text-slate-400 leading-tight mb-3">{a.desc}</p>
            {a.recommended && <div className="absolute top-2 right-2"><Star className="w-3 h-3 text-primary-500" fill="currentColor" /></div>}
          </button>
        ))}
      </div>
      <div className="flex gap-3 pt-4 border-t border-[#D6E7F7]/40">
        <AnimatedButton onClick={goBack} variant="outline" className="px-8 h-10">Back</AnimatedButton>
        <AnimatedButton onClick={goNext} variant="primary" className="flex-1 h-10" icon={ArrowRight}>Final Setup</AnimatedButton>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-center">
      <div className="lg:col-span-7 space-y-5">
        <div><h1 className="text-xl font-bold text-slate-900">Session Metrics</h1><p className="text-xs text-slate-500 mt-1">Fine-tune your practice parameters.</p></div>
        <div className="grid grid-cols-4 gap-2">
          {durationPresets.map((p, i) => (
            <button key={i} onClick={() => { setSelectedPreset(i); setCustomQuestions(null); setCustomMinutes(null); }} className={cn("py-2 rounded-lg border text-[10px] font-black uppercase transition-all", selectedPreset === i ? "bg-primary-50 border-primary-300 text-primary-700 shadow-sm" : "bg-white border-slate-100 text-slate-400")}>{p.label}</button>
          ))}
        </div>
        <div className="space-y-5 p-5 bg-white/60 border border-[#D6E7F7]/60 rounded-xl shadow-sm">
           <div className="space-y-3">
              <div className="flex justify-between items-center"><span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Questions</span><span className="text-base font-black text-primary-600">{customQuestions ?? durationPresets[selectedPreset].questions}</span></div>
              <input type="range" min="3" max="25" value={customQuestions ?? durationPresets[selectedPreset].questions} onChange={e=>setCustomQuestions(Number(e.target.value))} className="w-full h-1 bg-slate-100 rounded-lg accent-primary-500 appearance-none cursor-pointer" />
           </div>
           <div className="space-y-3">
              <div className="flex justify-between items-center"><span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Time Limit</span><span className="text-base font-black text-amber-600">{customMinutes ?? durationPresets[selectedPreset].minutes} <small className="text-[9px]">MIN</small></span></div>
              <input type="range" min="5" max="60" value={customMinutes ?? durationPresets[selectedPreset].minutes} onChange={e=>setCustomMinutes(Number(e.target.value))} className="w-full h-1 bg-slate-100 rounded-lg accent-amber-500 appearance-none cursor-pointer" />
           </div>
        </div>
      </div>
      <div className="lg:col-span-5">
         <div className="bg-primary-50/30 rounded-2xl p-6 border border-primary-100 shadow-xl shadow-primary-500/5">
            <div className="flex items-center gap-2 mb-5"><div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-primary-500 shadow-sm"><CheckCircle2 className="w-3.5 h-3.5" /></div><span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Review</span></div>
            <div className="space-y-2">
               {[
                 { label: 'Role', value: domain || 'General', color: 'bg-white text-slate-700' },
                 { label: 'Agent', value: agentOptions.find(a=>a.id===selectedAgent).label, color: 'bg-white text-slate-700' },
                 { label: 'Mode', value: answerMode.toUpperCase(), color: 'bg-white text-slate-700' },
                 { label: 'Type', value: interviewType === 'personalized' ? 'AI Personal' : (company || 'Standard'), color: 'bg-white text-slate-700' },
               ].map(item => (
                 <div key={item.label} className="flex items-center justify-between p-2.5 rounded-lg border border-white bg-white/40">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{item.label}</span>
                    <span className={cn("text-[10px] font-black px-2 py-0.5 rounded shadow-sm", item.color)}>{item.value}</span>
                 </div>
               ))}
            </div>
            <div className="mt-6">
               <motion.button onClick={handleStart} disabled={loading} whileTap={{ scale: 0.98 }} className="w-full py-3.5 bg-primary-500 text-white rounded-xl font-black text-xs shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2">
                 {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Play className="w-4 h-4" fill="currentColor" /> LAUNCH SESSION</>}
               </motion.button>
            </div>
         </div>
      </div>
      <div className="lg:col-span-12 flex justify-center"><button onClick={goBack} className="text-[10px] font-bold text-slate-400 hover:text-slate-600">Configuration Details</button></div>
    </div>
  );

  const steps = [renderStep0, renderStep1, renderStep2, renderStep3];

  return (
    <PageTransition className="pt-10 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <Timeline current={step} />
        <motion.div key={step} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          <GlassCard className="p-8 md:p-10 border-[#D6E7F7] shadow-xl" hover={false}>{steps[step]()}</GlassCard>
        </motion.div>
        {error && <p className="mt-4 text-center text-[11px] font-bold text-red-500">{error}</p>}
      </div>
    </PageTransition>
  );
};
