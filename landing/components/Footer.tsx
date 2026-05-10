'use client';

import { useState } from 'react';

const footerSections = [
  {
    title: 'Product',
    links: [
      { label: 'Mock Interviews', href: '#' },
      { label: 'Emotion Analysis', href: '#' },
      { label: 'Resume Coach', href: '#' },
      { label: 'Career Roadmap', href: '#' },
      { label: 'AI Agents', href: '#agents' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '#' },
      { label: 'How It Works', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Press', href: '#' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '#' },
      { label: 'Contact Us', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Cookie Policy', href: '#' },
    ],
  },
];

const socialLinks = [
  {
    label: 'X (Twitter)',
    href: '#',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: '#',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: 'GitHub',
    href: '#',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: '#',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
];

function FooterLink({ label, href }: { label: string; href: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontFamily: "'Sora', sans-serif",
        fontSize: '0.8rem',
        fontWeight: 400,
        color: hovered ? '#ffffff' : 'rgba(255,255,255,0.45)',
        transition: 'color 0.25s ease',
        textDecoration: 'none',
        letterSpacing: '0.01em',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          background: hovered ? '#3d82c4' : 'transparent',
          transition: 'background 0.25s ease',
          flexShrink: 0,
        }}
      />
      {label}
    </a>
  );
}

export default function Footer() {
  return (
    <footer
      style={{
        width: '100%',
        background: '#000000',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* ── Main footer content ── */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: 'clamp(48px, 7vw, 80px) clamp(24px, 6vw, 64px) 0',
          display: 'grid',
          gridTemplateColumns: '1.6fr repeat(3, 1fr)',
          gap: '48px',
        }}
      >
        {/* Brand column */}
        <div>
          <a
            href="/"
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: '1.15rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.35em',
              textDecoration: 'none',
              display: 'block',
              marginBottom: '16px',
            }}
          >
            INTELLIHIRE
          </a>
          <p
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.4)',
              lineHeight: 1.75,
              maxWidth: '280px',
              marginBottom: '28px',
            }}
          >
            The AI-powered interview preparation platform built to help you land your dream role — faster, smarter, and with confidence.
          </p>

          {/* Social icons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {socialLinks.map((social) => (
              <SocialIcon key={social.label} {...social} />
            ))}
          </div>
        </div>

        {/* Link columns */}
        {footerSections.map((section) => (
          <div key={section.title}>
            <p
              style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.25)',
                marginBottom: '20px',
              }}
            >
              {section.title}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {section.links.map((link) => (
                <FooterLink key={link.label} {...link} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Divider + bottom bar ── */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '32px clamp(24px, 6vw, 64px)',
          marginTop: '48px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <span
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: '0.72rem',
            color: 'rgba(255,255,255,0.22)',
          }}
        >
          © {new Date().getFullYear()} IntelliHire. All rights reserved.
        </span>

        <div style={{ display: 'flex', gap: '24px' }}>
          {['Privacy Policy', 'Terms of Service', 'Cookies'].map((item) => (
            <a
              key={item}
              href="#"
              style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: '0.72rem',
                color: 'rgba(255,255,255,0.22)',
                textDecoration: 'none',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.22)')}
            >
              {item}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ label, href, icon }: { label: string; href: string; icon: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
        background: hovered ? 'rgba(255,255,255,0.07)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: hovered ? '#ffffff' : 'rgba(255,255,255,0.35)',
        transition: 'all 0.25s ease',
        textDecoration: 'none',
      }}
    >
      {icon}
    </a>
  );
}
