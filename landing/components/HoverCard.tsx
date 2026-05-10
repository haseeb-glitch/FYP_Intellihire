'use client';

import { useState } from 'react';
import Image from 'next/image';

interface CardData {
  name: string;
  role: string;
  description: string;
  accentColor: string;
  bgGradient: string;
  baseImage: string;
  hoverImage: string;
  hoverImageScale?: number;
}

const cards: CardData[] = [
  {
    name: 'AI Interviewer',
    role: 'Lead Recruiter Agent',
    description: 'Conducts real-time mock interviews with instant feedback.',
    accentColor: '#3d82c4',
    bgGradient: 'linear-gradient(135deg, #0c1b2e 0%, #1a2f4a 100%)',
    baseImage: '/haseeb1.jpeg',
    hoverImage: '/haseeb2.png',
    hoverImageScale: 1.4,
  },
  {
    name: 'Emotion Analyst',
    role: 'Behavioral Intelligence',
    description: 'Detects micro-expressions to measure confidence & composure.',
    accentColor: '#22c55e',
    bgGradient: 'linear-gradient(135deg, #0a2010 0%, #0f3a1e 100%)',
    baseImage: '/card1.jpeg',
    hoverImage: '/card.png',
  },
  {
    name: 'Resume Coach',
    role: 'ATS Optimization Agent',
    description: 'Scores your ATS compatibility and rewrites for max impact.',
    accentColor: '#a78bfa',
    bgGradient: 'linear-gradient(135deg, #1a0a2e 0%, #2a1040 100%)',
    baseImage: '/afra1.jpeg',
    hoverImage: '/afra2.png',
    hoverImageScale: 1.4,
  },
];

const CARD_SIZE = 220;
const IMG_OVERFLOW = 56;

function CircleCard({ card }: { card: CardData }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: `${CARD_SIZE}px`,
        // extra space at top for image overflow
        paddingTop: `${IMG_OVERFLOW}px`,
        flexShrink: 0,
        cursor: 'pointer',
      }}
    >
      {/* ── LAYER 1: Circle (z-index 2) — contains card1.jpeg background ── */}
      <div
        style={{
          width: `${CARD_SIZE}px`,
          height: `${CARD_SIZE}px`,
          borderRadius: '50%',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 2,
          background: card.bgGradient,
          border: `2px solid ${hovered ? card.accentColor : card.accentColor + '55'}`,
          boxShadow: hovered
            ? `0 24px 64px rgba(0,0,0,0.7), 0 0 0 3px ${card.accentColor}44`
            : `0 12px 40px rgba(0,0,0,0.5)`,
          transition: 'box-shadow 0.4s ease, border-color 0.4s ease',
        }}
      >
        {/* card1.jpeg — fades out on hover */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: hovered ? 0 : 1,
            transition: 'opacity 0.35s ease',
          }}
        >
          <Image
            src={card.baseImage}
            alt={`${card.name} preview`}
            fill
            style={{ objectFit: 'cover', objectPosition: 'center top' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)',
            }}
          />
        </div>

        {/* Dark overlay when hovered (so text is readable) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 55%, transparent 100%)`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        />

        {/* Radial accent glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 50% 85%, ${card.accentColor}33 0%, transparent 70%)`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        />
      </div>

      {/* ── LAYER 2: card.png (z-index 3) — overflows above circle, in front of it ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          width: `${CARD_SIZE * 0.72}px`,
          height: `${CARD_SIZE * 0.95}px`,
          transform: `translateX(-50%) scale(${hovered ? 1.28 * (card.hoverImageScale || 1) : 0.82}) translateY(${hovered ? 0 : 18}px)`,
          opacity: hovered ? 1 : 0,
          transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease',
          zIndex: 3,
          pointerEvents: 'none',
          filter: hovered ? `drop-shadow(0 -14px 28px ${card.accentColor}88)` : 'none',
        }}
      >
        <Image
          src={card.hoverImage}
          alt={card.name}
          fill
          style={{ objectFit: 'contain', objectPosition: 'bottom center' }}
        />
      </div>

      {/* ── LAYER 3: Text overlay (z-index 4) — positioned over the bottom of the circle, always in front ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          // sits over the bottom ~60% of the circle
          height: `${CARD_SIZE * 0.65}px`,
          zIndex: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '20px 16px',
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.4s ease 0.1s, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.1s',
          pointerEvents: 'none',
          borderRadius: `0 0 ${CARD_SIZE / 2}px ${CARD_SIZE / 2}px`,
          overflow: 'hidden',
        }}
      >
        <p
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: card.accentColor,
            marginBottom: '4px',
            textAlign: 'center',
          }}
        >
          {card.role}
        </p>
        <h3
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: '0.92rem',
            fontWeight: 800,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.2,
            marginBottom: '5px',
          }}
        >
          {card.name}
        </h3>
        <p
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: '0.66rem',
            color: 'rgba(255,255,255,0.7)',
            textAlign: 'center',
            lineHeight: 1.55,
          }}
        >
          {card.description}
        </p>
      </div>

      {/* ── Label below (visible by default, hides on hover) ── */}
      <div
        style={{
          marginTop: '16px',
          textAlign: 'center',
          opacity: hovered ? 0 : 1,
          transform: hovered ? 'translateY(6px)' : 'translateY(0)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}
      >
        <p
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: '3px',
          }}
        >
          {card.name}
        </p>
        <p
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: '0.68rem',
            color: card.accentColor,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {card.role}
        </p>
      </div>
    </div>
  );
}

export default function HoverCardSection() {
  return (
    <section
      id="agents"
      style={{
        width: '100%',
        background: '#000000',
        padding: 'clamp(60px, 8vw, 100px) clamp(24px, 6vw, 80px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '72px' }}>
        <p
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#3d82c4',
            marginBottom: '14px',
          }}
        >
          Meet Your Team
        </p>
        <h2
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: 'clamp(1.8rem, 3.5vw, 3rem)',
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}
        >
          AI Agents, Built for You
        </h2>
      </div>

      {/* Single row */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '48px',
          justifyContent: 'center',
          alignItems: 'flex-start',
          flexWrap: 'nowrap',
          width: '100%',
          maxWidth: '1200px',
          overflowX: 'auto',
          paddingBottom: '16px',
        }}
      >
        {cards.map((card) => (
          <CircleCard key={card.name} card={card} />
        ))}
      </div>
    </section>
  );
}
