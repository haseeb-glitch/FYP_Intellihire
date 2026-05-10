"use client";

import { useRef, useEffect, useState } from "react";

// ─── SVG Logo Components ────────────────────────────────────────────────────

const UdemyLogo = () => (
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="17" fill="#FDECEA" />
      <text
        x="18"
        y="25"
        fontFamily="Georgia, serif"
        fontSize="22"
        fontWeight="bold"
        fill="#EC5252"
        textAnchor="middle"
        fontStyle="italic"
      >
        U
      </text>
    </svg>
    <span
      style={{
        fontFamily: "'Georgia', serif",
        fontSize: "22px",
        fontWeight: "600",
        color: "#333",
        letterSpacing: "-0.3px",
      }}
    >
      Udemy
    </span>
  </div>
);

const GoogleLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 272 92" width="120" height="40">
    <path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#EA4335" />
    <path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#FBBC05" />
    <path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z" fill="#4285F4" />
    <path d="M225 3v65h-9.5V3h9.5z" fill="#34A853" />
    <path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z" fill="#EA4335" />
    <path d="M35.29 41.41V32h31.69c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 35.17.36 16.45 16.32 1 35.29 1c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.48.08z" fill="#4285F4" />
  </svg>
);

const GarnierLogo = () => (
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="19" cy="19" r="17.5" stroke="#999" strokeWidth="1.5" fill="none" />
      <ellipse cx="19" cy="19" rx="10" ry="17.5" stroke="#999" strokeWidth="1.5" fill="none" />
      <line x1="1.5" y1="19" x2="36.5" y2="19" stroke="#999" strokeWidth="1.5" />
      <line x1="1.5" y1="12.5" x2="36.5" y2="12.5" stroke="#999" strokeWidth="1" />
      <line x1="1.5" y1="25.5" x2="36.5" y2="25.5" stroke="#999" strokeWidth="1" />
    </svg>
    <span
      style={{
        fontFamily: "'Arial Narrow', 'Arial', sans-serif",
        fontSize: "20px",
        fontWeight: "500",
        color: "#888",
        letterSpacing: "4px",
        textTransform: "uppercase",
      }}
    >
      GARNIER
    </span>
  </div>
);

const SlackLogo = () => (
  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 54" width="36" height="36">
      <path d="M19.712.133a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386h5.376V5.52A5.381 5.381 0 0 0 19.712.133m0 14.365H5.376A5.381 5.381 0 0 0 0 19.884a5.381 5.381 0 0 0 5.376 5.387h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386" fill="#36C5F0" />
      <path d="M53.76 19.884a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386v5.387h5.376a5.381 5.381 0 0 0 5.376-5.387m-14.336 0V5.52A5.381 5.381 0 0 0 34.048.133a5.381 5.381 0 0 0-5.376 5.387v14.364a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387" fill="#2EB67D" />
      <path d="M34.048 54a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386h-5.376v5.386A5.381 5.381 0 0 0 34.048 54m0-14.365h14.336a5.381 5.381 0 0 0 5.376-5.386 5.381 5.381 0 0 0-5.376-5.387H34.048a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386" fill="#ECB22E" />
      <path d="M0 34.249a5.381 5.381 0 0 0 5.376 5.386 5.381 5.381 0 0 0 5.376-5.386v-5.387H5.376A5.381 5.381 0 0 0 0 34.249m14.336 0v14.364A5.381 5.381 0 0 0 19.712 54a5.381 5.381 0 0 0 5.376-5.387V34.249a5.381 5.381 0 0 0-5.376-5.387 5.381 5.381 0 0 0-5.376 5.387" fill="#E01E5A" />
    </svg>
    <span
      style={{
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontSize: "26px",
        fontWeight: "700",
        color: "#1D1C1D",
        letterSpacing: "-0.5px",
      }}
    >
      slack
    </span>
  </div>
);

// ─── Logo data ───────────────────────────────────────────────────────────────

const logos = [
  { id: "udemy", component: <UdemyLogo /> },
  { id: "google", component: <GoogleLogo /> },
  { id: "garnier", component: <GarnierLogo /> },
  { id: "slack", component: <SlackLogo /> },
];

const allLogos = [...logos, ...logos, ...logos];

// ─── Individual animated logo item ───────────────────────────────────────────

function LogoItem({
  children,
  containerRef,
}: {
  children: React.ReactNode;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  const itemRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // No opacity effect needed as requested
  }, [containerRef]);

  return (
    <div
      ref={itemRef}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0 60px",
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

// ─── Main Marquee ────────────────────────────────────────────────────────────

export default function LogoMarquee() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let rafId: number;
    const speed = 1.6; // px per frame

    const tick = () => {
      posRef.current -= speed;
      const oneSetWidth = track.scrollWidth / 3;
      if (Math.abs(posRef.current) >= oneSetWidth) {
        posRef.current += oneSetWidth;
      }
      track.style.transform = `translateX(${posRef.current}px)`;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        backgroundColor: "transparent",
        overflow: "hidden",
        position: "relative",
        padding: "40px 0",
      }}
    >
      {/* Scrolling track */}
      <div
        ref={trackRef}
        style={{
          display: "flex",
          alignItems: "center",
          willChange: "transform",
          whiteSpace: "nowrap",
        }}
      >
        {allLogos.map((logo, i) => (
          <LogoItem
            key={`${logo.id}-${i}`}
            containerRef={containerRef as React.RefObject<HTMLDivElement>}
          >
            {logo.component}
          </LogoItem>
        ))}
      </div>
    </div>
  );
}
