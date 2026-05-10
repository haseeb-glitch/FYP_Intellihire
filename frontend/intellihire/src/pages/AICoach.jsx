import { useState, useRef, useEffect } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, MessageSquare, Plus, Sparkles, Trash2, AlertCircle } from 'lucide-react';
import { coachAPI } from '../api/axios';

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    content: "Hi! I'm IntelliCoach — your personal interview prep assistant. I can help you improve your interview performance, explain IntelliHire features, give you practice tips, and guide your career preparation. What would you like to work on today?",
  },
];

const QUICK_PROMPTS = [
  { label: 'Improve confidence',    text: 'How can I improve my interview confidence?' },
  { label: 'What is IntelliHire?',  text: 'What does IntelliHire do and how does it work?' },
  { label: 'STAR method tips',      text: 'Give me tips on answering behavioral questions using the STAR method' },
  { label: 'Boost technical score', text: 'How can I improve my technical interview score?' },
];

const CHAT_HISTORY_KEY = 'intellihire_coach_history';

const loadHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveHistory = (chats) => {
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chats.slice(0, 15)));
  } catch {}
};

export const AICoach = () => {
  const [messages, setMessages]   = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping]   = useState(false);
  const [error, setError]         = useState(null);
  const [chatHistory, setChatHistory] = useState(loadHistory);
  const [activeChat, setActiveChat]   = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const saveCurrentChat = (msgs) => {
    if (msgs.length <= 1) return;
    const firstUserMsg = msgs.find(m => m.role === 'user');
    if (!firstUserMsg) return;
    const title = firstUserMsg.content.slice(0, 40) + (firstUserMsg.content.length > 40 ? '…' : '');
    const now = new Date();
    const dateLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const newChat = { id: Date.now(), title, date: dateLabel, messages: msgs };
    setChatHistory(prev => {
      const updated = [newChat, ...prev.filter(c => c.id !== activeChat)].slice(0, 15);
      saveHistory(updated);
      return updated;
    });
    setActiveChat(newChat.id);
  };

  const handleSend = async (text) => {
    const t = (text || inputValue).trim();
    if (!t || isTyping) return;
    setError(null);

    const userMsg = { role: 'user', content: t };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await coachAPI.chat(updatedMessages.map(m => ({ role: m.role, content: m.content })));
      const reply = { role: 'assistant', content: res.data.response };
      const finalMessages = [...updatedMessages, reply];
      setMessages(finalMessages);
      saveCurrentChat(finalMessages);
    } catch (err) {
      setError('Could not reach IntelliCoach. Please check your connection and try again.');
      setMessages(updatedMessages);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = () => {
    setMessages(INITIAL_MESSAGES);
    setActiveChat(null);
    setInputValue('');
    setError(null);
  };

  const handleLoadChat = (chat) => {
    setMessages(chat.messages);
    setActiveChat(chat.id);
    setError(null);
  };

  const handleDeleteChat = (e, chatId) => {
    e.stopPropagation();
    setChatHistory(prev => {
      const updated = prev.filter(c => c.id !== chatId);
      saveHistory(updated);
      return updated;
    });
    if (activeChat === chatId) handleNewChat();
  };

  return (
    <PageTransition className="pt-8 pb-6 px-5 sm:px-7 lg:px-8">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4" style={{ height: 'calc(100vh - 112px)', minHeight: 480 }}>

        {/* ── Chat History Sidebar ── */}
        <GlassCard hover={false} className="w-full md:w-60 !p-3 flex flex-col gap-2 shrink-0">
          <button
            onClick={handleNewChat}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold text-sm hover:from-primary-600 hover:to-primary-700 shadow-sm shadow-primary-500/20 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>

          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mt-1">Recent</p>

          <div className="flex-1 overflow-y-auto space-y-0.5 custom-scrollbar">
            {chatHistory.length === 0 && (
              <p className="text-[11px] text-slate-400 px-2 py-3 text-center leading-relaxed">
                Your conversations will appear here
              </p>
            )}
            {chatHistory.map(chat => (
              <button
                key={chat.id}
                onClick={() => handleLoadChat(chat)}
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
                <Trash2
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  className="w-3 h-3 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all shrink-0"
                />
              </button>
            ))}
          </div>
        </GlassCard>

        {/* ── Main Chat Panel ── */}
        <GlassCard hover={false} className="flex-1 flex flex-col !p-0 overflow-hidden relative">
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
                transition={{ duration: 0.25 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
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
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
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

            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={bottomRef} />
          </div>

          {/* Quick prompts — shown only on fresh chat */}
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
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask for feedback, tips, or questions about IntelliHire…"
                className="w-full glass-input pl-4 pr-12 py-3 rounded-xl text-sm text-slate-900 placeholder:text-slate-400"
                disabled={isTyping}
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
