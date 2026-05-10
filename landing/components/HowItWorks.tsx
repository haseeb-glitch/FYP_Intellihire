"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "01",
    title: "Choose Company & Role",
    description:
      "Pick any company and role. We tailor questions, difficulty, and recruiter persona accordingly.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="16" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Start AI Interview",
    description:
      "Go live with a realistic AI recruiter. Video, voice, or text — your choice.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Multi-Agent Feedback",
    description:
      "Three AI judges independently score your technical, communication, and confidence signals.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="3" />
        <circle cx="5" cy="18" r="2" />
        <circle cx="19" cy="18" r="2" />
        <path d="M12 11v3m0 0-5 4m5-4 5 4" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "View Your Roadmap",
    description:
      "Get a personalised improvement plan with resources, milestones, and next-interview targets.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = stepsRef.current.findIndex((el) => el === entry.target);
            if (idx !== -1) setActiveStep(idx);
          }
        });
      },
      {
        root: null,
        rootMargin: "-40% 0px -40% 0px",
        threshold: 0,
      }
    );

    stepsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

        .hiw-root {
          font-family: 'DM Sans', sans-serif;
          background: #d6e8f7; /* Matches website background */
          min-height: 100vh;
          color: #0c1b2e;
        }

        .hiw-hero {
          text-align: center;
          padding: 80px 24px 40px;
        }

        .hiw-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(61, 130, 196, 0.1);
          color: #3d82c4;
          border: 1px solid rgba(61, 130, 196, 0.2);
          border-radius: 100px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .hiw-badge::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3d82c4;
          animation: pulse-dot 2s infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }

        /* ── sticky layout ── */
        .hiw-layout {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 0;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 24px 120px;
          align-items: start;
        }

        /* LEFT: sticky panel */
        .hiw-left {
          position: sticky;
          top: 80px;
          padding: 48px 40px 48px 0;
        }

        .hiw-heading {
          font-family: 'Sora', sans-serif;
          font-size: clamp(32px, 4vw, 46px);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.03em;
          color: #0c1b2e;
          margin-bottom: 40px;
        }

        .hiw-heading span {
          background: linear-gradient(135deg, #3d82c4, #2a5a94);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hiw-nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .hiw-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          cursor: default;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .hiw-nav-item::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(61,130,196,0.08), rgba(42,90,148,0.05));
          opacity: 0;
          transition: opacity 0.35s ease;
          border-radius: 12px;
        }

        .hiw-nav-item.active::before { opacity: 1; }

        .hiw-nav-arrow {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          color: #6b8fad;
        }

        .hiw-nav-item.active .hiw-nav-arrow {
          color: #3d82c4;
          transform: translateX(3px);
        }

        .hiw-nav-label {
          font-size: 14px;
          font-weight: 500;
          color: #6b8fad;
          transition: color 0.35s ease;
          line-height: 1.3;
        }

        .hiw-nav-item.active .hiw-nav-label {
          color: #3d82c4;
          font-weight: 600;
        }

        .hiw-nav-num {
          font-family: 'Sora', sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #6b8fad;
          min-width: 20px;
          transition: color 0.35s ease;
        }

        .hiw-nav-item.active .hiw-nav-num { color: #3d82c4; }

        /* RIGHT: scrollable steps */
        .hiw-right {
          padding: 48px 0 48px 60px;
          border-left: 1px solid rgba(61, 130, 196, 0.12);
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .hiw-step {
          min-height: 60vh;
          display: flex;
          align-items: center;
          padding: 60px 0;
          opacity: 0.35;
          transition: opacity 0.5s ease;
        }

        .hiw-step.active { opacity: 1; }

        .hiw-card {
          background: #fff;
          border-radius: 24px;
          padding: 44px 48px;
          border: 1px solid rgba(61, 130, 196, 0.1);
          box-shadow: 0 4px 6px rgba(0,0,0,0.02), 0 20px 60px rgba(61, 130, 196, 0.06);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateY(12px) scale(0.98);
          max-width: 520px;
          position: relative;
          overflow: hidden;
        }

        .hiw-step.active .hiw-card {
          transform: translateY(0) scale(1);
          box-shadow: 0 8px 16px rgba(0,0,0,0.04), 0 32px 80px rgba(61, 130, 196, 0.12);
          border-color: rgba(61, 130, 196, 0.2);
        }

        .hiw-card::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #3d82c4, #2a5a94, #6ab4ff);
          opacity: 0;
          transition: opacity 0.5s ease;
        }

        .hiw-step.active .hiw-card::after { opacity: 1; }

        .hiw-card-header {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 24px;
        }

        .hiw-icon-wrap {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          background: linear-gradient(135deg, #e0f0fd, #d6e8f7);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #3d82c4;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hiw-step.active .hiw-icon-wrap {
          background: linear-gradient(135deg, #3d82c4, #2a5a94);
          color: #fff;
          box-shadow: 0 8px 24px rgba(61, 130, 196, 0.35);
        }

        .hiw-step-num {
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #6b8fad;
          letter-spacing: 0.06em;
          margin-bottom: 4px;
        }

        .hiw-step-title {
          font-family: 'Sora', sans-serif;
          font-size: clamp(20px, 2.5vw, 26px);
          font-weight: 700;
          color: #0c1b2e;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }

        .hiw-divider {
          height: 1px;
          background: linear-gradient(90deg, rgba(61,130,196,0.15), transparent);
          margin: 20px 0;
        }

        .hiw-step-desc {
          font-size: 16px;
          line-height: 1.7;
          color: #334155;
          font-weight: 400;
        }

        .hiw-pill-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 24px;
        }

        .hiw-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #e0f0fd;
          border: 1px solid rgba(61,130,196,0.15);
          border-radius: 100px;
          padding: 5px 12px;
          font-size: 12px;
          font-weight: 600;
          color: #3d82c4;
        }

        .hiw-pill::before {
          content: '✓';
          font-size: 10px;
          font-weight: 700;
        }

        /* progress dots */
        .hiw-progress {
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: absolute;
          left: -30px;
          top: 50%;
          transform: translateY(-50%);
        }

        /* mobile */
        @media (max-width: 768px) {
          .hiw-layout {
            grid-template-columns: 1fr;
            padding: 0 16px 80px;
          }
          .hiw-left {
            position: static;
            padding: 32px 0 24px;
            border-bottom: 1px solid rgba(61,130,196,0.12);
            margin-bottom: 8px;
          }
          .hiw-right {
            padding: 24px 0;
            border-left: none;
          }
          .hiw-step { min-height: 50vh; }
          .hiw-card { padding: 28px 24px; }
        }
      `}</style>

      <div className="hiw-root" id="how-it-works" ref={sectionRef}>
        {/* Hero badge */}
        <div className="hiw-hero">
          <div className="hiw-badge">The Process</div>
        </div>

        <div className="hiw-layout">
          {/* ── LEFT: sticky ── */}
          <div className="hiw-left">
            <h2 className="hiw-heading">
              How it<br /><span>works</span>
            </h2>

            <nav className="hiw-nav">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`hiw-nav-item ${activeStep === i ? "active" : ""}`}
                >
                  <span className="hiw-nav-num">{step.number}</span>
                  {/* Arrow */}
                  <svg
                    className="hiw-nav-arrow"
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 9h12M10 4l5 5-5 5" />
                  </svg>
                  <span className="hiw-nav-label">{step.title}</span>
                </div>
              ))}
            </nav>
          </div>

          {/* ── RIGHT: scrollable ── */}
          <div className="hiw-right">
            {steps.map((step, i) => (
              <div
                key={i}
                ref={(el) => { stepsRef.current[i] = el; }}
                className={`hiw-step ${activeStep === i ? "active" : ""}`}
              >
                <div className="hiw-card">
                  <div className="hiw-card-header">
                    <div className="hiw-icon-wrap">{step.icon}</div>
                    <div>
                      <div className="hiw-step-num">STEP {step.number}</div>
                      <div className="hiw-step-title">{step.title}</div>
                    </div>
                  </div>

                  <div className="hiw-divider" />

                  <p className="hiw-step-desc">{step.description}</p>

                  {/* Feature pills per step */}
                  <div className="hiw-pill-row">
                    {i === 0 && (
                      <>
                        <span className="hiw-pill">Custom difficulty</span>
                        <span className="hiw-pill">500+ companies</span>
                        <span className="hiw-pill">Any role</span>
                      </>
                    )}
                    {i === 1 && (
                      <>
                        <span className="hiw-pill">Video mode</span>
                        <span className="hiw-pill">Voice mode</span>
                        <span className="hiw-pill">Text mode</span>
                      </>
                    )}
                    {i === 2 && (
                      <>
                        <span className="hiw-pill">Technical score</span>
                        <span className="hiw-pill">Communication</span>
                        <span className="hiw-pill">Confidence</span>
                      </>
                    )}
                    {i === 3 && (
                      <>
                        <span className="hiw-pill">Resources</span>
                        <span className="hiw-pill">Milestones</span>
                        <span className="hiw-pill">Next targets</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
