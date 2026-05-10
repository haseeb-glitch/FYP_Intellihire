"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function ScrollZoomReveal() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Section is 300vh tall. We measure how far we've scrolled inside it.
      const sectionTop = rect.top;
      const sectionHeight = rect.height;

      // progress: 0 = section just entered view, 1 = section fully scrolled past
      const scrolled = -sectionTop;
      const scrollable = sectionHeight - windowHeight;
      const p = Math.min(Math.max(scrolled / scrollable, 0), 1);

      setProgress(p);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Phase breakdown:
  // 0.0 – 0.5 : text zooms from normal → fills screen, bg stays white, text black
  // 0.5 – 0.65: background transitions white → black (text already huge/invisible)
  // 0.65 – 1.0: detail text fades in on black bg

  const zoomProgress = Math.min(progress / 0.55, 1); // 0→1 during first 55%
  
  // Using an exponential/cubic ease makes the zoom feel much smoother and more natural
  const easeInCubic = (t: number) => t * t * t;
  const scale = 1 + easeInCubic(zoomProgress) * 159;

  // Background flips to black right before we fade the text (so we don't see a white splash)
  const bgColor = progress > 0.48 ? "#000000" : "#d6e8f7";

  // Opacity of the big word: fade it out only AFTER background is black
  const bigTextOpacity = progress < 0.5 ? 1 : 1 - Math.min((progress - 0.5) / 0.1, 1);

  // Detail text fade in: starts significantly earlier now (at 0.52 instead of 0.68)
  const detailOpacity = Math.min(Math.max((progress - 0.52) / 0.2, 0), 1);
  const detailTranslateY = (1 - detailOpacity) * 30;

  return (
    <>
      {/* ── Sticky scroll container ── */}
      <div
        id="scroll-zoom"
        ref={sectionRef}
        style={{ height: "300vh", position: "relative" }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            width: "100%",
            overflow: "hidden",
            backgroundColor: bgColor,
            transition: "background-color 0.05s linear",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* ── Big zoom word ── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-league-spartan), sans-serif",
                fontWeight: 900,
                fontSize: "clamp(3rem, 10vw, 7rem)",
                letterSpacing: "-0.02em",
                color: "#000000",
                transform: `scale(${scale})`,
                transformOrigin: "center center",
                opacity: bigTextOpacity,
                display: "inline-block",
                whiteSpace: "nowrap",
                userSelect: "none",
              }}
            >
              INTELLIHIRE
            </span>
          </div>

          {/* ── Detail text (revealed after zoom) ── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 clamp(1.5rem, 8vw, 6rem)",
              opacity: detailOpacity,
              transform: `translateY(${detailTranslateY}px)`,
              pointerEvents: detailOpacity > 0 ? "auto" : "none",
              maxWidth: "900px",
              margin: "0 auto",
              left: 0,
              right: 0,
            }}
          >
            {/* Eyebrow */}
            <p
              style={{
                fontFamily: "'Courier New', 'Courier', monospace",
                fontSize: "clamp(0.65rem, 1.2vw, 0.8rem)",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "#666",
                marginBottom: "1.5rem",
              }}
            >
              Getting Started
            </p>

            {/* Headline */}
            <h2
              style={{
                fontFamily: "var(--font-league-spartan), sans-serif",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 700,
                color: "#ffffff",
                textAlign: "center",
                lineHeight: 1.1,
                marginBottom: "1.5rem",
                letterSpacing: "-0.02em",
              }}
            >
              Everything you need
              <br />
              to hire top talent.
            </h2>

            {/* Divider */}
            <div
              style={{
                width: "3rem",
                height: "2px",
                backgroundColor: "#ffffff",
                marginBottom: "1.75rem",
                opacity: 0.4,
              }}
            />

            {/* Body */}
            <p
              style={{
                fontFamily: "var(--font-league-spartan), sans-serif",
                fontSize: "clamp(0.95rem, 1.8vw, 1.15rem)",
                color: "#aaaaaa",
                textAlign: "center",
                lineHeight: 1.85,
                maxWidth: "600px",
                marginBottom: "2.5rem",
              }}
            >
              Intellihire automates the recruitment process from start to finish. Our AI agents handle screening, interviewing, and analysis so you can focus on building great teams.
            </p>



            {/* CTA */}
            <Link href="/signup" passHref>
              <button
                style={{
                  marginTop: "2.5rem",
                  padding: "0.75rem 2.25rem",
                  backgroundColor: "#ffffff",
                  color: "#000000",
                  border: "none",
                  borderRadius: "2px",
                  fontFamily: "'Courier New', monospace",
                  fontSize: "0.75rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLButtonElement).style.backgroundColor = "#dddddd")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLButtonElement).style.backgroundColor = "#ffffff")
                }
              >
                Get Started →
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
