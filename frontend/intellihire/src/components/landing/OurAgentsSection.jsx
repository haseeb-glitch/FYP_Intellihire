import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

const agents = [
  {
    id: 1,
    name: 'Recruiter Agent',
    role: 'Lead Interviewer',
    description: 'Conducts structured multi-round interviews, evaluates responses in real-time, and adapts question difficulty based on candidate performance.',
    image: '/agent1.jpg',
    accentColor: '#3d82c4',
    stats: [{ label: 'Accuracy', value: '97.2%' }, { label: 'Avg Session', value: '28 min' }],
    capabilities: ['Behavioral Analysis', 'Technical Assessment', 'Adaptive Questioning'],
    detail: 'The Recruiter Agent uses advanced NLP to parse candidate responses in real-time, generating follow-up questions that probe deeper into areas of expertise. It maintains a dynamic difficulty curve, ensuring every interview is both challenging and fair.',
  },
  {
    id: 2,
    name: 'Emotion Agent',
    role: 'Sentiment Analyst',
    description: 'Monitors facial micro-expressions, vocal patterns, and body language to provide a comprehensive emotional intelligence profile.',
    image: '/agent2.jpg',
    accentColor: '#a78bfa',
    stats: [{ label: 'Emotions', value: '12+' }, { label: 'Precision', value: '94.8%' }],
    capabilities: ['Micro-Expression Detection', 'Voice Tone Analysis', 'Stress Mapping'],
    detail: 'Our Emotion Agent leverages computer vision and audio processing to detect 12+ distinct emotional states. It tracks confidence levels, nervousness indicators, and engagement metrics throughout the interview.',
  },
  {
    id: 3,
    name: 'Resume Agent',
    role: 'Profile Evaluator',
    description: 'Parses and scores resumes against job descriptions using NLP, flags skill gaps, and generates ATS-optimized improvement suggestions.',
    image: '/agent3.jpeg',
    accentColor: '#22c55e',
    stats: [{ label: 'ATS Score', value: '99%' }, { label: 'Skills Parsed', value: '200+' }],
    capabilities: ['Skill Extraction', 'Gap Analysis', 'ATS Optimization'],
    detail: 'The Resume Agent processes documents in 40+ formats, extracting structured data from even the most creative layouts. It cross-references skills against current market demand and generates an ATS compatibility score.',
  },
  {
    id: 4,
    name: 'Career Agent',
    role: 'Growth Strategist',
    description: 'Builds personalized career roadmaps by analyzing market trends, skill trajectories, and matching candidates with high-fit opportunities.',
    image: '/agent4.jpeg',
    accentColor: '#f59e0b',
    stats: [{ label: 'Pathways', value: '50+' }, { label: 'Match Rate', value: '92%' }],
    capabilities: ['Roadmap Generation', 'Market Analysis', 'Opportunity Matching'],
    detail: 'The Career Agent synthesizes data from thousands of successful career trajectories to build personalized growth plans. It identifies skill gaps relative to target roles and surfaces opportunities that align with both current abilities and long-term aspirations.',
  },
];

const MAX_VISIBLE = 3;

function getStackState(relIdx) {
  const visible = relIdx < MAX_VISIBLE;
  const mult = relIdx === 0 ? 1 : 1.1;
  const x = visible ? (relIdx * 28) / mult : (MAX_VISIBLE - 1) * 28;
  const scale = visible ? 1 / (MAX_VISIBLE / (MAX_VISIBLE * mult - relIdx)) : 1 / MAX_VISIBLE;
  const opacity = visible ? 1 / (MAX_VISIBLE / (MAX_VISIBLE - relIdx)) : 0;
  const shadow = relIdx === 0 ? "0 10px 40px rgba(0,0,0,.15)" : "0 0px 0px rgba(0,0,0,.2)";
  return { x, scale, opacity, shadow };
}

function buildSprings(total, cur) {
  return Array.from({ length: total }, (_, i) => {
    const rel = i - cur;
    const base = getStackState(rel < 0 ? 999 : rel);
    return { ...base, zIndex: total - (rel < 0 ? rel + total : rel), pointerEvents: i === cur ? "auto" : "none" };
  });
}

function useCardStack(total, onNavigate, onTap) {
  const [springs, setSprings] = useState(() => buildSprings(total, 0));
  const curRef = useRef(0);
  const downX = useRef(0);
  const moved = useRef(false);
  const active = useRef(false);

  const rebuild = useCallback((cur) => setSprings(buildSprings(total, cur)), [total]);

  const liveUpdate = useCallback((cur, dx) => {
    setSprings(Array.from({ length: total }, (_, i) => {
      const rel = i - cur;
      if (rel < 0) return { ...getStackState(999), zIndex: total + rel, pointerEvents: "none" };
      if (rel === 0) {
        const base = getStackState(0);
        return { ...base, x: base.x + dx, zIndex: total, pointerEvents: "auto" };
      }
      const ratio = Math.min(Math.max(-dx / 100, 0), 1);
      const s0 = getStackState(rel);
      const s1 = getStackState(rel - 1);
      return { x: s0.x + (s1.x - s0.x) * ratio, scale: s0.scale + (s1.scale - s0.scale) * ratio, opacity: s0.opacity + (s1.opacity - s0.opacity) * ratio, shadow: s0.shadow, zIndex: total - rel, pointerEvents: "none" };
    }));
  }, [total]);

  const onPointerDown = useCallback((e) => {
    active.current = true;
    moved.current = false;
    downX.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!active.current) return;
    const dx = e.clientX - downX.current;
    if (Math.abs(dx) > 6) moved.current = true;
    liveUpdate(curRef.current, dx);
  }, [liveUpdate]);

  const onPointerUp = useCallback((e) => {
    if (!active.current) return;
    active.current = false;
    const dx = e.clientX - downX.current;
    const cur = curRef.current;
    if (!moved.current) { rebuild(cur); onTap(); return; }
    if (dx < -80 && cur < total - 1) { curRef.current = cur + 1; rebuild(cur + 1); onNavigate(cur + 1); }
    else if (dx > 24 && cur > 0) { curRef.current = cur - 1; rebuild(cur - 1); onNavigate(cur - 1); }
    else { rebuild(cur); }
  }, [total, rebuild, onNavigate, onTap]);

  return { springs, onPointerDown, onPointerMove, onPointerUp, curRef };
}

function AnimatedHeader({ agent, direction }) {
  const [displayed, setDisplayed] = useState(agent);
  const [phase, setPhase] = useState("idle");
  const nextEvt = useRef(agent);
  const nextDir = useRef(direction);

  useEffect(() => {
    if (agent.id === displayed.id) return;
    nextEvt.current = agent;
    nextDir.current = direction;
    setPhase("exit");
  }, [agent.id]); // eslint-disable-line

  const dir = nextDir.current;
  const exitAnim = phase === "exit" ? (dir > 0 ? "ecOutUp .22s ease forwards" : "ecOutDown .22s ease forwards") : undefined;
  const enterAnim = phase === "enter" ? (dir > 0 ? "ecInUp .28s ease forwards" : "ecInDown .28s ease forwards") : undefined;

  return (
    <div style={{ position: "relative", height: 64, overflow: "hidden" }}>
      <style>{`
        @keyframes ecInUp   { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
        @keyframes ecOutUp  { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(-100%)} }
        @keyframes ecInDown { from{opacity:0;transform:translateY(-100%)} to{opacity:1;transform:translateY(0)} }
        @keyframes ecOutDown{ from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(100%)} }
      `}</style>
      <div
        style={{ position: "absolute", inset: 0, animation: exitAnim ?? enterAnim }}
        onAnimationEnd={() => {
          if (phase === "exit") { setDisplayed(nextEvt.current); setPhase("enter"); }
          else setPhase("idle");
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 800, margin: 0, lineHeight: 1.4, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 16, color: '#0c1b2e' }}>{displayed.name}</h1>
          <span style={{ fontSize: 13, fontWeight: 700, color: displayed.accentColor, whiteSpace: "nowrap" }}>Active</span>
        </div>
        <address style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600, fontStyle: "normal", display: "flex", alignItems: "center", gap: 6, marginTop: 2, color: '#6b8fad' }}>{displayed.role}</address>
      </div>
    </div>
  );
}

function DetailSheet({ agent, isOpen, onClose }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 20, pointerEvents: isOpen ? "auto" : "none" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: isOpen ? "rgba(0,0,0,0.38)" : "rgba(0,0,0,0)", transition: "background .4s ease" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "22px 24px", opacity: isOpen ? 1 : 0, transform: isOpen ? "translateY(0)" : "translateY(40px)", transition: "opacity .35s, transform .35s", zIndex: 1 }}>
        <button onClick={onClose} style={{ background: "transparent", border: 0, color: "#fff", fontSize: 18, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M5 12l7 7M5 12l7-7" /></svg>
          Back
        </button>
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "65%", background: "#fff", borderRadius: "20px 20px 0 0", overflow: "hidden", transform: isOpen ? "translateY(0)" : "translateY(100%)", transition: "transform .4s cubic-bezier(.4,0,.2,1)", zIndex: 1 }}>
        <div style={{ height: "100%", overflowY: "auto", opacity: isOpen ? 1 : 0, transform: isOpen ? "translateY(0)" : "translateY(16px)", transition: "opacity .4s ease .1s, transform .4s ease .1s" }}>
          <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #ededed" }}>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, margin: "0 0 4px", lineHeight: 1.3, color: '#0c1b2e' }}>{agent.name}</h2>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600, color: agent.accentColor, marginBottom: 16 }}>{agent.role}</div>
            <div style={{ display: 'flex', gap: '24px' }}>
              {agent.stats.map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 800, color: '#0c1b2e' }}>{s.value}</div>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b8fad', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: "16px 24px 32px" }}>
            <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#6b8fad', margin: '0 0 10px' }}>Capabilities</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
              {agent.capabilities.map(cap => (
                <span key={cap} style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: '99px', background: '#f0f4f8', color: '#0c1b2e' }}>{cap}</span>
              ))}
            </div>
            <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#6b8fad', margin: '0 0 10px' }}>Overview</h3>
            <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, lineHeight: 1.6, color: '#334155', margin: '0 0 12px' }}>{agent.description}</p>
            <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, lineHeight: 1.6, color: '#334155', margin: 0 }}>{agent.detail}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentCardApp() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isOpen, setIsOpen] = useState(false);

  const { springs, onPointerDown, onPointerMove, onPointerUp, curRef } = useCardStack(
    agents.length,
    (next) => { setDirection(next > current ? 1 : -1); setCurrent(next); },
    () => setIsOpen(true)
  );

  useEffect(() => { curRef.current = current; }, [current, curRef]);

  const agent = agents[current];

  return (
    <div style={{ background: "#fff", boxShadow: "0 10px 40px rgba(12,27,46,.08)", width: "100%", maxWidth: 380, borderRadius: 24, overflow: "hidden", display: "flex", flexDirection: "column", height: 520 }}>
      <section style={{ height: "100%", position: "relative", flex: 1, display: "flex", flexDirection: "column", paddingTop: 20, overflow: "hidden" }}>
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 24px", marginBottom: 6, opacity: isOpen ? 0 : 1, pointerEvents: isOpen ? "none" : "auto", transition: "opacity .3s" }}>
          <button style={{ background: "transparent", border: 0, fontSize: 14, fontWeight: 700, fontFamily: "'Sora', sans-serif", display: "flex", alignItems: "center", gap: 8, padding: 0, color: '#0c1b2e' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: agent.accentColor, display: 'inline-block' }} />
            AI Network
          </button>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b8fad', fontFamily: "'Sora', sans-serif" }}>{current + 1} / {agents.length}</div>
        </nav>

        <div style={{ padding: "4px 24px 12px" }}>
          <AnimatedHeader agent={agent} direction={direction} />
        </div>

        <div style={{ position: "relative", flex: 1, width: "82%", marginBottom: 20 }}>
          <div style={{ height: "100%", paddingLeft: 24 }}>
            <div style={{ position: "relative", height: "100%" }} onContextMenu={(e) => e.preventDefault()}>
              {agents.map((ev, i) => {
                const sp = springs[i];
                if (!sp) return null;
                const isFront = i === current;
                return (
                  <div
                    key={ev.id}
                    style={{ position: "absolute", inset: 0, transformOrigin: "right center", willChange: "transform, opacity", touchAction: "none", transform: `translate3d(${sp.x}px,0,0) scale(${sp.scale})`, opacity: sp.opacity, zIndex: sp.zIndex, pointerEvents: sp.pointerEvents, transition: isFront ? undefined : "transform .35s cubic-bezier(.4,0,.2,1), opacity .35s", cursor: isFront ? "grab" : "default" }}
                    onPointerDown={isFront ? onPointerDown : undefined}
                    onPointerMove={isFront ? onPointerMove : undefined}
                    onPointerUp={isFront ? onPointerUp : undefined}
                  >
                    <div style={{ backgroundImage: `url(${ev.image})`, backgroundSize: "cover", backgroundPosition: "center", width: "100%", height: "100%", borderRadius: 16, overflow: "hidden", boxShadow: sp.shadow, transition: "box-shadow .35s", position: 'relative' }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 30%)' }} />
                      <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 11, fontWeight: 600, fontFamily: "'Sora', sans-serif", opacity: isFront ? 0.9 : 0 }}>Tap for details</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DetailSheet agent={agent} isOpen={isOpen} onClose={() => setIsOpen(false)} />

        <footer style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 24px 16px" }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {agents.map((_, idx) => (
              <div key={idx} style={{ width: idx === current ? 16 : 6, height: 6, borderRadius: 3, background: idx === current ? agent.accentColor : '#e2e8f0', transition: 'all 0.3s' }} />
            ))}
          </div>
        </footer>
      </section>
    </div>
  );
}

export default function OurAgentsSection() {
  return (
    <section id="agents" className="relative w-full overflow-hidden" style={{ background: '#d6e8f7', padding: 'clamp(60px, 8vw, 120px) 0 clamp(60px, 8vw, 100px)' }}>
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }} className="flex flex-col items-center lg:items-end w-full lg:pr-12">
            <AgentCardApp />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col items-start lg:pl-10">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#3d82c4', marginBottom: 24 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3d82c4' }} />
              Multi-Agent Architecture
            </div>

            <h2 className="text-[3.5rem] md:text-[4.5rem] lg:text-[5rem] font-bold tracking-tighter leading-[0.95] mb-6" style={{ fontFamily: "'Sora', sans-serif" }}>
              <span className="text-[#0c1b2e]">Our </span><br />
              <span className="text-[#3d82c4]">Agents</span>
            </h2>

            <p className="text-lg md:text-xl max-w-lg leading-relaxed text-[#6b8fad] mb-10">
              Four specialized AI agents working in harmony — each mastering a critical dimension of the hiring process to deliver{' '}
              <strong className="text-[#0c1b2e]">superhuman recruitment precision</strong>.
            </p>

            <div className="flex gap-12 mb-10">
              {[['4', 'AI Agents'], ['97%', 'Accuracy'], ['24/7', 'Available']].map(([val, lbl]) => (
                <div key={lbl}>
                  <div className="text-3xl font-bold text-[#0c1b2e]" style={{ fontFamily: "'Sora', sans-serif" }}>{val}</div>
                  <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b8fad] mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>{lbl}</div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
