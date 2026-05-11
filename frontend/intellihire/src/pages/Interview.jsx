import VideoRecordingModal from '../components/VideoRecordingModal';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Video, VideoOff, Square, MessageSquare, Send, Loader2,
  CheckCircle2, TrendingUp, Zap, Code2, Clock, Target, ChevronRight,
  Eye, Activity, Brain, Heart, AlertTriangle, Smile, Users, ArrowLeft,
  Settings, Info, Maximize2, Terminal, User, ShieldCheck, Volume2
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { interviewAPI } from '../api/axios';
import { CodeEditor } from '../components/ui/CodeEditor';
import { cn } from '../lib/utils';

/* ─── Constants & Styles ─── */
const difficultyColors = {
  easy: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  hard: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' }
};

const agentStyles = {
  hr: { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600', icon: Users, label: 'HR Expert' },
  technical: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600', icon: Code2, label: 'Tech Lead' },
  stress: { bg: 'bg-amber-500', light: 'bg-amber-100', text: 'text-amber-600', icon: Activity, label: 'Pressure Pro' },
  mixed: { bg: 'bg-primary-500', light: 'bg-primary-50', text: 'text-primary-600', icon: Brain, label: 'Elite AI' },
};

/* ─── Components ─── */

const HardwareCheck = ({ mode, onComplete }) => {
  const [status, setStatus] = useState('checking');
  const [stream, setStream] = useState(null);

  const checkHardware = async () => {
    try {
      setStatus('requesting');
      const constraints = { audio: true, video: mode === 'video' };
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(s);
      setStatus('ready');
    } catch (err) {
      console.error('Hardware check failed:', err);
      setStatus('error');
    }
  };

  useEffect(() => {
    checkHardware();
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  const handleFinish = () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-6">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-[#D6E7F7] overflow-hidden">
        <div className="bg-primary-500 p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4">
            <Settings className="w-8 h-8 text-white animate-spin-slow" />
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Hardware Check</h2>
          <p className="text-primary-100 text-xs mt-1 font-medium italic">Ensuring a seamless session for you.</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase text-slate-400">Microphone</p>
                  <p className="text-[13px] font-bold text-slate-700">Audio Input</p>
                </div>
              </div>
              {status === 'ready' ? <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white"><CheckCircle2 className="w-4 h-4" /></div> : <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />}
            </div>

            {mode === 'video' && (
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase text-slate-400">Camera</p>
                    <p className="text-[13px] font-bold text-slate-700">Visual Feed</p>
                  </div>
                </div>
                {status === 'ready' ? <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white"><CheckCircle2 className="w-4 h-4" /></div> : <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />}
              </div>
            )}
          </div>

          {status === 'error' ? (
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-700">Access Denied</p>
                <p className="text-[10px] text-red-500 leading-tight mt-0.5">Please allow microphone permissions in your browser settings and try again.</p>
                <button onClick={checkHardware} className="mt-2 text-[10px] font-black uppercase text-red-700 underline">Retry Check</button>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-emerald-500 shadow-sm"><Info className="w-3.5 h-3.5" /></div>
              <p className="text-[10px] font-bold text-emerald-700 leading-tight">Hardware verified. You're ready to start your interview.</p>
            </div>
          )}

          <motion.button
            onClick={handleFinish}
            disabled={status !== 'ready'}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className={cn(
              "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg",
              status === 'ready' ? "bg-primary-500 text-white shadow-primary-500/20" : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            Start Session
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

const Waveform = ({ volume = 0, isRecording }) => {
  const bars = [...Array(12)];
  return (
    <div className="flex items-center gap-1 h-8">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-primary-400 rounded-full"
          animate={{
            height: isRecording
              ? [8, 8 + (volume * (Math.random() * 20 + 10)), 8]
              : 8
          }}
          transition={{
            repeat: isRecording ? Infinity : 0,
            duration: 0.2,
            delay: i * 0.02
          }}
        />
      ))}
    </div>
  );
};

const metricTone = (value) => {
  if (value >= 75) return 'bg-emerald-500';
  if (value >= 45) return 'bg-amber-500';
  return 'bg-red-500';
};

const MetricBar = ({ label, value, inverse = false }) => {
  const safeValue = Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Number(value))) : 0;
  const toneValue = inverse ? 100 - safeValue : safeValue;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        <span className="text-[10px] font-black tabular-nums text-slate-700">{safeValue.toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", metricTone(toneValue))}
          animate={{ width: `${safeValue}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
};

const EmotionMeter = ({ emotions = {} }) => {
  const rows = Object.entries(emotions)
    .map(([name, raw]) => ({ name, value: Number(raw) * 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  return (
    <div className="space-y-2">
      {rows.map(({ name, value }) => (
        <MetricBar key={name} label={name} value={value} />
      ))}
    </div>
  );
};

const VideoInterviewPanel = ({
  videoRef,
  stats,
  isRecording,
  submitting,
  statusMessage,
  backendTranscript,
  onToggleRecording,
}) => {
  const emotion = stats?.emotion || 'neutral';
  const stress = stats?.stress_score ?? 0;
  const faceDetected = stats?.face_detected;
  const cues = [...(stats?.geo_cues || []), ...(stats?.posture_issues || [])];
  if (stats?.hand_label) cues.unshift(stats.hand_label);

  return (
    <GlassCard className="!p-0 flex-1 flex flex-col border-[#D6E7F7] shadow-lg overflow-hidden" hover={false}>
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white/60 shrink-0">
        <div className="flex items-center gap-2">
          <Video className="w-3.5 h-3.5 text-slate-900" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Video Analysis</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("w-1.5 h-1.5 rounded-full", isRecording ? "bg-red-500 animate-pulse" : "bg-slate-300")} />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{isRecording ? 'Recording' : 'Standby'}</span>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-[minmax(0,1fr)_360px] min-h-0 overflow-hidden">
        <div className="bg-slate-950 relative min-h-[280px] flex items-center justify-center">
          <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" />
          {!isRecording && (
            <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                <Video className="w-7 h-7 text-white" />
              </div>
              <p className="text-sm font-black text-white uppercase tracking-widest">Camera Ready</p>
              <p className="text-xs text-slate-300 mt-2 max-w-sm">Start recording to capture your answer and run live stress, gaze, blink, posture, and emotion analysis.</p>
            </div>
          )}
          <div className="absolute left-4 top-4 flex gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-black/45 text-white text-[9px] font-black uppercase tracking-widest backdrop-blur-md">
              {faceDetected === false ? 'Face Searching' : 'Face Tracking'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-black/45 text-white text-[9px] font-black uppercase tracking-widest backdrop-blur-md">
              {emotion}
            </span>
          </div>
          <div className="absolute left-4 right-4 bottom-4">
            <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/70">Audio Capture</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Processed After Recording</span>
              </div>
              <p className="text-xs text-white min-h-8 leading-relaxed line-clamp-2">
                {isRecording
                  ? 'Speech is being recorded and will be transcribed by AssemblyAI after you stop.'
                  : backendTranscript
                    ? 'Transcript has been saved and is shown below the question.'
                    : 'Start recording to capture audio for backend transcription.'}
              </p>
              {statusMessage && (
                <p className="mt-2 text-[10px] font-bold text-amber-200 leading-tight">{statusMessage}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 overflow-y-auto custom-scrollbar border-l border-slate-100">
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Blinks</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats?.blink_total ?? 0}</p>
              <p className="text-[10px] font-bold text-slate-400">{stats?.blink_bpm ?? 0}/min</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Stress</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{Number(stress).toFixed(0)}%</p>
              <p className="text-[10px] font-bold text-slate-400">overall</p>
            </div>
          </div>

          <div className="space-y-4">
            <MetricBar label="Emotion Stress" value={stats?.emotion_stress ?? 0} inverse />
            <MetricBar label="Gaze Focus" value={stats?.gaze_score ?? 0} />
            <MetricBar label="Posture" value={stats?.posture_score ?? 0} />
            <MetricBar label="Overall Stress" value={stress} inverse />
          </div>

          <div className="mt-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-3">Emotion Meter</h4>
            <EmotionMeter emotions={stats?.emotion_probs} />
          </div>

          <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-2">Status</h4>
            <p className="text-[10px] font-bold text-slate-500">
              Head Pose: P{stats?.head_pose?.[0] ?? 0} Y{stats?.head_pose?.[1] ?? 0} R{stats?.head_pose?.[2] ?? 0}
            </p>
            <div className="mt-2 space-y-1">
              {(cues.length ? cues.slice(0, 4) : ['No active alerts']).map((cue) => (
                <p key={cue} className="text-[10px] font-bold text-slate-500">{cue}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border-t border-slate-100 flex justify-center shrink-0">
        <motion.button
          onClick={onToggleRecording}
          disabled={submitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "px-10 py-3.5 rounded-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest transition-all shadow-lg",
            isRecording ? "bg-red-500 text-white shadow-red-500/20" : "bg-primary-500 text-white shadow-primary-500/20"
          )}
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRecording ? <Square className="w-4 h-4 fill-white" /> : <Video className="w-4 h-4" />)}
          {isRecording ? "Stop Video Answer" : "Start Video Answer"}
        </motion.button>
      </div>
    </GlassCard>
  );
};

const InterviewerCard = ({ type, question, isThinking, isAudioMode, isRecording }) => {
  const style = agentStyles[type] || agentStyles.mixed;

  return (
    <GlassCard className="!p-5 border-[#D6E7F7] shadow-sm flex flex-col h-full overflow-hidden" hover={false}>
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-50 shrink-0">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md", style.bg)}>
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">{style.label}</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">AI Interviewer</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center py-1 overflow-y-auto custom-scrollbar min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={question}
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
            className="text-base md:text-[17px] font-bold text-slate-800 leading-relaxed pr-2"
          >
            {question || "Welcome! I'm ready to begin whenever you are."}
          </motion.div>
        </AnimatePresence>

        {(isThinking || (isAudioMode && isRecording)) && (
          <div className="mt-6 flex items-center gap-3">
            {isRecording ? <Waveform /> : (
              <motion.div className="flex gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary-400" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} />
                ))}
              </motion.div>
            )}
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-500">
              {isRecording ? "Capturing Voice..." : "AI Evaluating..."}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-50 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">IntelliHire Intelligence</span>
          <div className="flex gap-2">
            {isAudioMode && <Volume2 className="w-3 h-3 text-slate-300" />}
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

/* ─── Main Page ─── */

export const Interview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const mode = params.get('mode') || 'text';
  const company = params.get('company') || 'Company';
  const role = params.get('role') || 'Software Engineer';

  const [timer, setTimer] = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [textInput, setTextInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [transcript, setTranscript] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [totalQuestions, setTotal] = useState(5);
  const [currentDifficulty, setCurrentDifficulty] = useState('easy');
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [showHardwareCheck, setShowHardwareCheck] = useState(mode !== 'text');
  const chatEndRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
  const isRecordingRef = useRef(false);
  const [volume, setVolume] = useState(0);
  const [localTranscript, setLocalTranscript] = useState('');
  const [savedTranscript, setSavedTranscript] = useState('');
  const [savedTranscriptFile, setSavedTranscriptFile] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const videoStreamRef = useRef(null);
  const frameTimerRef = useRef(null);
  const [videoStats, setVideoStats] = useState({});
  const [videoStatus, setVideoStatus] = useState('');
  const [showNextButton, setShowNextButton] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [pendingNextQuestion, setPendingNextQuestion] = useState(null);

  const setRecordingState = (val) => {
    setIsRecording(val);
    isRecordingRef.current = val;
  };

  useEffect(() => {
    const sid = params.get('session');
    if (sid) {
      setSessionId(sid);
      interviewAPI.getSessionDetail(sid).then(res => {
        const data = res.data;
        const qs = data.questions || [];
        setQuestions(qs);
        setTotal(data.total_questions || qs.length);
        if (qs.length > 0) {
          const firstQ = qs[0];
          setCurrentQuestion(firstQ);
          setShowCodeEditor(firstQ.requires_code && mode === 'text');
          setTranscript([{
            role: 'ai', text: firstQ.question_text, question_type: firstQ.question_type, difficulty: firstQ.difficulty || 'easy'
          }]);
          setCurrentDifficulty(firstQ.difficulty || 'easy');
        }
      });
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  useEffect(() => {
    return () => {
      if (frameTimerRef.current) clearInterval(frameTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { }
      }
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (e) { }
      }
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleSubmitAnswer = async (answerText, codeText = null) => {
    if (submitting) return;
    if (!answerText?.trim() && !codeText?.trim()) return;

    const displayText = codeText ? `[Solution submitted]` : answerText;
    setUserAnswer(displayText);
    setSubmitting(true);
    setTextInput('');

    try {
      const payload = { answer: answerText || '' };
      if (codeText) { payload.code = codeText; payload.code_language = currentQuestion?.language || 'python'; }
      const res = await interviewAPI.submitAnswer(sessionId, payload);
      const data = res.data;

      if (data.feedback) {
        setFeedback(data.feedback);
      }

      if (data.finished) {
        setFinished(true);
        setShowNextButton(false);
        setPendingNextQuestion(null);
        try { await interviewAPI.completeInterview(sessionId); } catch (e) { }
        setTimeout(() => navigate(`/results?session=${sessionId}`), 2500);
      } else if (data.next_question) {
        setPendingNextQuestion(data.next_question);
        setShowNextButton(true);
      }
    } catch (err) {
      setFeedback('Error processing your answer. Please try again.');
      setShowNextButton(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    const nextQ = pendingNextQuestion || questions[questionIdx + 1];
    if (!nextQ) return;

    setQuestionIdx(prev => prev + 1);
    const newDiff = nextQ.difficulty || 'easy';
    setCurrentDifficulty(newDiff);
    setCurrentQuestion(nextQ);
    setShowCodeEditor(nextQ.requires_code && mode === 'text');

    // Reset for new question
    setUserAnswer('');
    setFeedback('');
    setShowNextButton(false);
    setPendingNextQuestion(null);
    setTextInput('');
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';
    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += `${event.results[i][0].transcript} `;
        else interimTranscript += event.results[i][0].transcript;
      }
      setLocalTranscript(`${finalTranscript}${interimTranscript}`.trim());
    };

    recognition.onend = () => {
      if (isRecordingRef.current) {
        try { recognition.start(); } catch (e) { }
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) { }
  };

  const sendVideoFrame = useCallback(async () => {
    if (!videoRef.current || !sessionId || !isRecordingRef.current) return;
    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = Math.round((video.videoHeight / video.videoWidth) * canvas.width) || 360;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob || !isRecordingRef.current) return;
      const formData = new FormData();
      formData.append('frame', blob, 'frame.jpg');
      try {
        const res = await interviewAPI.sendVideoFrame(sessionId, formData);
        if (res.data?.stats) {
          setVideoStats(res.data.stats);
          setVideoStatus('');
        }
      } catch (e) {
        console.error('Video frame upload failed:', e);
        setVideoStatus(e.response?.data?.detail || 'Live analysis is not receiving frames yet.');
      }
    }, 'image/jpeg', 0.72);
  }, [sessionId]);

  const waitForVideoReady = (video) => new Promise((resolve) => {
    if (!video || (video.readyState >= 2 && video.videoWidth > 0)) {
      resolve();
      return;
    }
    const done = () => {
      video.removeEventListener('loadedmetadata', done);
      video.removeEventListener('canplay', done);
      resolve();
    };
    video.addEventListener('loadedmetadata', done, { once: true });
    video.addEventListener('canplay', done, { once: true });
    setTimeout(done, 1200);
  });

  const startVideoRecording = async () => {
    // Open recording modal which will handle capture and upload
    if (!sessionId) {
      setVideoStatus('No interview session found. Please start the interview again from setup.');
      return;
    }
    setShowVideoModal(true);
  };

  const handleVideoStopResponse = (data) => {
    const newMessages = [];
    const userTranscript = data.transcript || localTranscript || '(Video Answer)';
    setSavedTranscript(data.transcript || '');
    setSavedTranscriptFile(data.transcript_file || '');
    newMessages.push({ role: 'user', text: userTranscript });
    if (data.feedback) newMessages.push({ role: 'feedback', text: data.feedback });

    if (data.finished) {
      setFinished(true);
      newMessages.push({ role: 'ai', text: 'Excellent! Interview complete.' });
      setTranscript(prev => [...prev, ...newMessages]);
      setTimeout(() => navigate(`/results?session=${sessionId}`), 2500);
    } else if (data.next_question) {
      const nextQ = data.next_question;
      setQuestionIdx(prev => prev + 1);
      setCurrentDifficulty(nextQ.difficulty || 'easy');
      setCurrentQuestion(nextQ);
      setShowCodeEditor(false);
      newMessages.push({ role: 'ai', text: nextQ.text || nextQ.question_text, question_type: nextQ.type, difficulty: nextQ.difficulty });
      setTranscript(prev => [...prev, ...newMessages]);
    } else {
      setTranscript(prev => [...prev, ...newMessages]);
    }
  };

  const stopVideoRecording = async () => {
    if (!isRecordingRef.current) return;
    setRecordingState(false);
    setSubmitting(true);

    if (frameTimerRef.current) {
      clearInterval(frameTimerRef.current);
      frameTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
    }

    try {
      const res = await interviewAPI.stopVideoSession(sessionId, { answer: localTranscript });
      handleVideoStopResponse(res.data);
    } catch (err) {
      console.error('Video stop error:', err);
      setTranscript(prev => [...prev, { role: 'ai', text: 'Video answer could not be processed. Please retry.' }]);
    } finally {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(t => t.stop());
        videoStreamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
      setSubmitting(false);
      setLocalTranscript('');
      setVideoStatus('');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup Volume Analysis
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const average = sum / bufferLength;
        setVolume(average / 128);
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      // Setup Local Transcription Backup (Web Speech API)
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        let finalTranscript = '';
        recognition.onresult = (event) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
            else interimTranscript += event.results[i][0].transcript;
          }
          setLocalTranscript(finalTranscript + interimTranscript);
        };

        // Ensure recognition stays active until manual stop
        recognition.onend = () => {
          if (isRecordingRef.current) {
            try { recognition.start(); } catch (e) { }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      // Setup Recording
      const mimeType = ['audio/webm', 'audio/ogg', 'audio/mp4'].find(type => MediaRecorder.isTypeSupported(type)) || '';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length === 0) {
          setUserAnswer('');
          setFeedback('No audio was captured. Please record your answer again.');
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'answer.webm');
        // Send local transcript as fallback
        if (localTranscript) {
          formData.append('answer', localTranscript);
        }

        setSubmitting(true);
        stream.getTracks().forEach(t => t.stop());

        try {
          const res = await interviewAPI.submitAudioAnswer(sessionId, formData);
          const data = res.data;
          const userTranscript = data.transcript || localTranscript || '(Audio Answer)';
          setUserAnswer(userTranscript);
          setFeedback(data.feedback || 'Your audio answer was processed.');

          if (data.finished) {
            setFinished(true);
            setShowNextButton(false);
            setPendingNextQuestion(null);
            try { await interviewAPI.completeInterview(sessionId); } catch (e) { }
            setTimeout(() => navigate(`/results?session=${sessionId}`), 2500);
          } else if (data.next_question) {
            setPendingNextQuestion(data.next_question);
            setShowNextButton(true);
          }
        } catch (err) {
          setFeedback('Encountered an error while processing your audio. Please try again.');
          setShowNextButton(true);
        } finally {
          setSubmitting(false);
          setLocalTranscript('');
        }
      };

      mediaRecorder.start(200);
      setRecordingState(true);
    } catch (err) {
      alert('Microphone error.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecordingRef.current) {
      mediaRecorderRef.current.stop();
      setRecordingState(false);
      setVolume(0);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { }
      }
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    }
  };

  const handleEnd = () => navigate(`/results?session=${sessionId}`);

  const progress = Math.round(((questionIdx + 1) / totalQuestions) * 100);
  const currentQ = currentQuestion || questions[questionIdx];
  const activeQuestionText = currentQ?.question_text || currentQ?.text;
  const qType = currentQ?.question_type || currentQ?.type || 'technical';
  const diffStyle = difficultyColors[currentDifficulty] || difficultyColors.easy;

  return (
    <PageTransition className="h-screen bg-[#F0F7FF] flex flex-col overflow-hidden">
      {showHardwareCheck && (
        <HardwareCheck
          mode={mode}
          onComplete={() => setShowHardwareCheck(false)}
        />
      )}

      {/* ── Fixed Minimal Header ── */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 h-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center hover:bg-slate-50">
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
          </button>
          <div>
            <h1 className="text-[12px] font-black text-slate-900 leading-tight truncate max-w-[200px]">{role}</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{company}</p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black tabular-nums">{formatTime(timer)}</span>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-0.5">
            <span className="text-[8px] font-black text-slate-400 uppercase">Step {questionIdx + 1} / {totalQuestions}</span>
            <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
              <motion.div className="h-full bg-primary-500" animate={{ width: `${progress}%` }} />
            </div>
          </div>
          <button onClick={handleEnd} className="text-[9px] font-black text-red-500 uppercase hover:text-red-600 tracking-wider">End Session</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 py-2.5 bg-white border-b border-slate-100 shrink-0">
          <div className="max-w-4xl mx-auto">
            {/* Tags Row */}
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <div className={cn("inline-block px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest", diffStyle.bg, diffStyle.text)}>
                Question {questionIdx + 1} of {totalQuestions}
              </div>
              {qType && (
                <span className={cn("inline-block px-2.5 py-1 rounded text-[9px] font-black uppercase", agentStyles[qType]?.light || "bg-slate-100", agentStyles[qType]?.text || "text-slate-500")}>
                  {agentStyles[qType]?.label || qType}
                </span>
              )}
              <div className={cn("inline-block px-2.5 py-1 rounded text-[9px] font-black uppercase", diffStyle.bg, diffStyle.text)}>
                {currentDifficulty}
              </div>
            </div>
            {/* Question Text */}
            <h2 className="text-2xl font-bold text-slate-900 leading-relaxed">{activeQuestionText}</h2>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Content Area - Increased Height */}
          <div className="flex-1 overflow-y-auto px-8 py-4 pb-2">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* User Answer */}
                {userAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[75%] px-5 py-4 bg-primary-500 text-white rounded-lg rounded-br-none text-base leading-relaxed">
                      {userAnswer}
                    </div>
                  </motion.div>
                )}

                {/* AI Feedback */}
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-1">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 max-w-[75%] px-5 py-4 bg-emerald-50 border border-emerald-200 text-slate-800 rounded-lg rounded-bl-none text-base leading-relaxed">
                      {feedback}
                    </div>
                  </motion.div>
                )}

                {/* Processing State */}
                {submitting && !feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 mt-1">
                      <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                    </div>
                    <div className="px-5 py-4 bg-slate-50 border border-slate-200 rounded-lg text-base text-slate-500">
                      AI is evaluating your response...
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Next Question Button - With Minimal Spacing */}
            {showNextButton && !finished && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-8 py-2 bg-gradient-to-t from-white via-white to-white/80 border-t border-slate-100 shrink-0 flex justify-center"
              >
                <button
                  onClick={handleNextQuestion}
                  className="px-10 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-bold flex items-center gap-2 shadow-lg text-base"
                >
                  <ChevronRight className="w-5 h-5" />
                  Next Question
                </button>
              </motion.div>
            )}

            {/* Input Area */}
            {!finished && !showNextButton && !showCodeEditor && (
              <div className="px-8 py-2 bg-white border-t border-slate-100 shrink-0">
                <div className="max-w-4xl mx-auto">
                  {mode === 'text' ? (
                    <div className="relative">
                      <input
                        value={textInput}
                        onChange={e => setTextInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSubmitAnswer(textInput)}
                        placeholder="Type your answer here..."
                        disabled={submitting}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      />
                      <button
                        onClick={() => handleSubmitAnswer(textInput)}
                        disabled={submitting || !textInput.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-slate-300 transition-colors flex items-center gap-1.5 font-semibold"
                      >
                        <Send className="w-4 h-4" />
                        <span className="text-sm">Send</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <motion.button
                        onClick={
                          mode === 'video'
                            ? () => startVideoRecording()
                            : (isRecording ? stopRecording : startRecording)
                        }
                        disabled={submitting}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "px-10 py-4 rounded-xl flex items-center gap-2 font-bold text-base uppercase tracking-wider transition-all shadow-lg",
                          isRecording ? "bg-red-500 text-white shadow-red-500/20 hover:bg-red-600" : "bg-primary-500 text-white shadow-primary-500/20 hover:bg-primary-600"
                        )}
                      >
                        {submitting ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            {mode === 'video' ? (
                              <Video className="w-5 h-5" />
                            ) : (
                              <Mic className="w-5 h-5" />
                            )}
                          </>
                        )}
                        {mode === 'video' ? 'Record Video Answer' : 'Record Answer'}
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Video Recording Modal */}
      {showVideoModal && (
        <VideoRecordingModal
          sessionId={sessionId}
          questionText={activeQuestionText}
          onClose={(data) => {
            setShowVideoModal(false);
            if (data.error) {
              setFeedback('Error uploading video. Please try again.');
              setSubmitting(false);
            } else if (!data.cancelled) {
              const userTranscript = data.transcript || '(Video Answer)';
              setUserAnswer(userTranscript);
              setFeedback(data.feedback || 'Your video answer was processed.');
              setSubmitting(false);

              if (data.finished) {
                setFinished(true);
                setShowNextButton(false);
                setPendingNextQuestion(null);
                try { 
                  interviewAPI.completeInterview(sessionId); 
                } catch (e) { }
                setTimeout(() => navigate(`/results?session=${sessionId}`), 2500);
              } else if (data.next_question) {
                setPendingNextQuestion(data.next_question);
                setShowNextButton(true);
              }
            }
          }}
        />
      )}
    </PageTransition>
  );
};
