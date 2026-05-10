'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const [imageHovered, setImageHovered] = useState(false);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        fontFamily: "'Sora', sans-serif",
        background: '#d6e8f7',
      }}
    >
      {/* ── Left: Full-height Image Panel ── */}
      <div
        onMouseEnter={() => setImageHovered(true)}
        onMouseLeave={() => setImageHovered(false)}
        style={{
          position: 'relative',
          width: '42%',
          height: '100%',
          flexShrink: 0,
          overflow: 'hidden',
          cursor: 'default',
        }}
      >
        {/* Image with scale on hover */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: imageHovered ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <Image
            src="/1.jpg"
            alt="IntelliHire"
            fill
            style={{ objectFit: 'cover', objectPosition: 'center' }}
            priority
          />
        </div>

        {/* Permanent light gradient for logo readability */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(160deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.08) 60%, transparent 100%)',
            zIndex: 1,
          }}
        />

        {/* Hover dark overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.22)',
            opacity: imageHovered ? 1 : 0,
            transition: 'opacity 0.5s ease',
            zIndex: 2,
          }}
        />

        {/* Logo */}
        <div style={{ position: 'absolute', top: '32px', left: '32px', zIndex: 3 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span
              style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: '0.9rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '0.3em',
              }}
            >
              INTELLIHIRE
            </span>
          </Link>
        </div>
      </div>

      {/* ── Right: Form Panel ── */}
      <div
        style={{
          flex: 1,
          height: '100%',
          background: '#d6e8f7',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 clamp(28px, 5vw, 56px)',
          overflowY: 'auto',
        }}
      >
        <div style={{ maxWidth: '560px', width: '100%', margin: '0 auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
