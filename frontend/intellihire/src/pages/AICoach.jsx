import React, { useState, useRef, useEffect } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, MessageSquare, Plus, Sparkles, Trash2 } from 'lucide-react';

const CHAT_HISTORY = [
  { id: 1, title: 'Google SWE Prep',    date: 'Today' },
  { id: 2, title: 'Confidence Building', date: 'Yesterday' },
  { id: 3, title: 'Resume Review',       date: 'Apr 10' },
];

const INITIAL_MESSAGES = [
  { role: 'assistant', content: "Hi! 👋 I reviewed your latest mock interview. You did great on technical questions — let's sharpen your behavioural answers next. What would you like to focus on today?" },
];

const QUICK_PROMPTS = [
  { label: 'Improve confidence', text: 'How can I improve my interview confidence?' },
  { label: 'Google SWE prep',    text: 'Prepare me for a Google SWE interview' },
  { label: 'Review my report',   text: 'Review my latest interview report' },
  { label: 'STAR tips',          text: 'Give me tips on the STAR method' },
];

const AI_RESPONSES = [
  "Great area to work on! For confidence, try this: record yourself answering 3 questions daily — no re-takes. The playback will feel uncomfortable at first, but it trains self-awareness fast. Also, power poses before the interview genuinely work (Amy Cuddy's research). Want me to run a confidence drill with you right now?",
  "For Google SWE, focus on: 1) LeetCode medium/hard (graphs, DP, sliding window), 2) System design — design YouTube or a URL shortener, 3) Googleyness questions. Which area should we drill first?",
  "Your last session scored 85/100. Wins: communication (+12%), technical accuracy (85%). Growth area: system design — specifically distributed caching. I'd recommend 2 focused sessions on that this week. Want a mini system-design mock right now?",
  "STAR tip: Always quantify your Result. Instead of 'I improved performance', say 'I reduced load time by 67% from 4s to 1.3s, increasing conversions by 12%.' Numbers create instant credibility with interviewers.",
];

export const AICoach = () => {
  const [messages, setMessages]       = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue]   = useState('');
  const [isTyping, setIsTyping]       = useState(false);
  const [activeChat, setActiveChat]   = useState(1);
  const [responseIdx, setResponseIdx] = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (text) => {
    const t = (text || inputValue).trim();
    if (!t || isTyping) return;
    setMessages(p => [...p, { role: 'user', content: t }]);
    setInputValue('');
    setIsTyping(true);
    setTimeout(() => {
      setMessages(p => [...p, { role: 'assistant', content: AI_RESPONSES[responseIdx % AI_RESPONSES.length] }]);
      setResponseIdx(i => i + 1);
      setIsTyping(false);
    }, 1100 + Math.random() * 500);
  };

  return (
    <PageTransition className="pt-8 pb-6 px-5 sm:px-7 lg:px-8">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4" style={{ height: 'calc(100vh - 112px)', minHeight: 480 }}>

        {/* ── Chat History Sidebar ── */}
        <GlassCard hover={false} className="w-full md:w-60 !p-3 flex flex-col gap-2 shrink-0">
          {/* New chat button */}
          <button
            onClick={() => { setMessages(INITIAL_MESSAGES); setActiveChat(null); setResponseIdx(0); }}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold text-sm hover:from-primary-600 hover:to-primary-700 shadow-sm shadow-primary-500/20 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>

          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mt-1">
            Recent
          </p>

          <div className="flex-1 overflow-y-auto space-y-0.5 custom-scrollbar">
            {CHAT_HISTORY.map(chat => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left group transition-all ${
                  activeChat === chat.id
                    ? 'bg-primary-50 text-primary-700 border border-primary-200/60'
                    : 'hover:bg-slate-50/80 text-slate-600'
                }`}
              >
                <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${activeChat === chat.id ? 'text-primary-500' : 'text-slate-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate leading-snug">{chat.title}</p>
                  <p className="text-[10px] text-slate-400">{chat.date}</p>
                </div>
                <Trash2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all" />
              </button>
            ))}
          </div>
        </GlassCard>

        {/* ── Main Chat Panel ── */}
        <GlassCard hover={false} className="flex-1 flex flex-col !p-0 overflow-hidden relative">
          {/* Subtle tint */}
          <div className="absolute inset-0 bg-primary-50/8 pointer-events-none" />

          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#D6E7F7]/80 relative z-10 bg-white/40 backdrop-blur-sm">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-sm shadow-primary-500/25">
                <Bot className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-[14px]">IntelliCoach AI</h2>
              <p className="text-xs text-emerald-600 font-medium">● Online</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 relative z-10 custom-scrollbar">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  msg.role === 'user'
                    ? 'bg-slate-100 border border-slate-200'
                    : 'bg-gradient-to-br from-primary-400 to-primary-600 shadow-sm'
                }`}>
                  {msg.role === 'user'
                    ? <User className="w-3.5 h-3.5 text-slate-500" />
                    : <Bot  className="w-3.5 h-3.5 text-white" />
                  }
                </div>

                {/* Bubble */}
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-tr-sm shadow-md shadow-primary-500/15'
                    : 'bg-white/85 border border-[#D6E7F7]/90 text-slate-800 rounded-tl-sm shadow-sm'
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white/85 border border-[#D6E7F7]/90 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 shadow-sm">
                    {[0, 0.18, 0.36].map((d, j) => (
                      <motion.div
                        key={j}
                        className="w-1.5 h-1.5 bg-primary-400 rounded-full"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: d }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          {messages.length === 1 && (
            <div className="px-5 pb-3 flex flex-wrap gap-2 relative z-10">
              {QUICK_PROMPTS.map((p, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => handleSend(p.text)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-[#D6E7F7] text-xs font-medium text-slate-600 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  {p.label}
                </motion.button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="px-5 pb-5 pt-1 relative z-10">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask for feedback, tips, or start a mock interview…"
                className="w-full glass-input pl-4 pr-12 py-3 rounded-xl text-sm text-slate-900 placeholder:text-slate-400"
              />
              <button
                onClick={() => handleSend()}
                disabled={isTyping || !inputValue.trim()}
                className="absolute right-2 w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors disabled:opacity-40 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </PageTransition>
  );
};
