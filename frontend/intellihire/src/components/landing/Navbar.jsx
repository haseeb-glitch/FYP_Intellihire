import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Our Agents', href: '#agents' },
  { label: 'How it works', href: '#how-it-works' },
];

export default function LandingNavbar() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [vh, setVh] = useState(1000);
  const [zoomOffset, setZoomOffset] = useState(999999);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      setVh(window.innerHeight);
      const zoomEl = document.getElementById('scroll-zoom');
      if (zoomEl) {
        setZoomOffset(zoomEl.getBoundingClientRect().top + window.scrollY);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { scrollY } = useScroll();
  const [navVisible, setNavVisible] = useState(true);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > zoomOffset && latest < zoomOffset + vh * 0.96) {
      if (navVisible) setNavVisible(false);
    } else {
      if (!navVisible) setNavVisible(true);
    }
  });

  const logoY       = useTransform(scrollY, [vh * 2.2, vh * 2.9], [vh / 2 - 120, 0]);
  const logoScale   = useTransform(scrollY, [vh * 2.2, vh * 2.9], [1.4, 1]);
  const logoOpacity = useTransform(scrollY, [vh * 1.5, vh * 2.2], [0, 1]);

  const barBg      = useTransform(scrollY, [vh * 3.35, vh * 3.55, zoomOffset + vh * 0.85, zoomOffset + vh * 1.05], ['rgba(0,0,0,0)', 'rgba(214, 232, 247, 0.35)', 'rgba(214, 232, 247, 0.35)', 'rgba(0,0,0,0)']);
  const barBlur    = useTransform(scrollY, [vh * 3.35, vh * 3.55, zoomOffset + vh * 0.85, zoomOffset + vh * 1.05], [0, 24, 24, 0]);
  const barShadow  = useTransform(scrollY, [vh * 3.35, vh * 3.55, zoomOffset + vh * 0.85, zoomOffset + vh * 1.05], ['0 0 0 transparent', '0 4px 30px rgba(12,27,46,0.08)', '0 4px 30px rgba(12,27,46,0.08)', '0 0 0 transparent']);
  const barBorder  = useTransform(scrollY, [vh * 3.35, vh * 3.55, zoomOffset + vh * 0.85, zoomOffset + vh * 1.05], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']);

  const colPrimary = useTransform(scrollY, [vh * 3.35, vh * 3.55, zoomOffset + vh * 0.85, zoomOffset + vh * 1.05], ['#ffffff', '#0c1b2e', '#0c1b2e', '#ffffff']);
  const colInverse = useTransform(scrollY, [vh * 3.35, vh * 3.55, zoomOffset + vh * 0.85, zoomOffset + vh * 1.05], ['#0c1b2e', '#ffffff', '#ffffff', '#0c1b2e']);
  const colMuted   = useTransform(scrollY, [vh * 3.35, vh * 3.55, zoomOffset + vh * 0.85, zoomOffset + vh * 1.05], ['rgba(255,255,255,0.5)', 'rgba(12,27,46,0.45)', 'rgba(12,27,46,0.45)', 'rgba(255,255,255,0.5)']);
  const colHover   = useTransform(scrollY, [vh * 3.35, vh * 3.55, zoomOffset + vh * 0.85, zoomOffset + vh * 1.05], ['rgba(255,255,255,0.85)', 'rgba(12,27,46,0.8)', 'rgba(12,27,46,0.8)', 'rgba(255,255,255,0.85)']);

  const handleNavClick = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <style>{`
        .ih-link {
          position: relative;
          font-family: 'Sora', sans-serif;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 0;
          color: var(--ih-muted);
          transition: color 0.3s ease, letter-spacing 0.4s cubic-bezier(0.22,1,0.36,1);
        }
        .ih-link:hover {
          color: var(--ih-hover) !important;
          letter-spacing: 0.26em;
        }
        .ih-link::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -2px;
          width: 100%;
          height: 1px;
          background: var(--ih-primary);
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.45s cubic-bezier(0.22,1,0.36,1);
          opacity: 0.5;
        }
        .ih-link:hover::after {
          transform: scaleX(1);
          transform-origin: left;
        }
        .ih-cta {
          position: relative;
          font-family: 'Sora', sans-serif;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 12px 30px;
          border-radius: 999px;
          overflow: hidden;
          border: 1.5px solid var(--ih-primary);
          color: var(--ih-primary);
          background: transparent;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 1;
          display: inline-block;
        }
        .ih-cta::before {
          content: '';
          position: absolute;
          top: 100%;
          left: 0;
          width: 100%;
          height: 100%;
          background: var(--ih-primary);
          border-radius: 50% 50% 0 0;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: -1;
        }
        .ih-cta:hover {
          color: var(--ih-inverse) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(12,27,46,0.12);
        }
        .ih-cta:hover::before {
          transform: translateY(-100%) scale(1.05);
          border-radius: 0;
        }
      `}</style>

      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: navVisible ? 0 : -100, opacity: navVisible ? 1 : 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: mounted ? 0 : 0.3 }}
        className="fixed top-4 left-6 right-6 z-50"
        style={{
          borderRadius: '20px',
          background: barBg,
          backdropFilter: useTransform(barBlur, (v) => `blur(${v}px)`),
          WebkitBackdropFilter: useTransform(barBlur, (v) => `blur(${v}px)`),
          boxShadow: barShadow,
          borderBottom: '1px solid',
          borderColor: barBorder,
          '--ih-primary': colPrimary,
          '--ih-inverse': colInverse,
          '--ih-muted': colMuted,
          '--ih-hover': colHover,
        }}
      >
        <div className="flex items-center justify-between relative" style={{ padding: '22px 52px', maxWidth: '1800px', margin: '0 auto' }}>

          <div className="hidden md:flex items-center gap-9 flex-shrink-0">
            {navLinks.map((link) => (
              <button key={link.href} onClick={() => handleNavClick(link.href)} className="ih-link">
                {link.label}
              </button>
            ))}
          </div>

          <div className="absolute left-1/2 top-1/2 pointer-events-none" style={{ transform: 'translate(-50%, -50%)' }}>
            {mounted && (
              <motion.button
                onClick={() => navigate('/')}
                className="pointer-events-auto block"
                style={{
                  y: logoY,
                  scale: logoScale,
                  opacity: logoOpacity,
                  color: colPrimary,
                  fontFamily: "'Sora', sans-serif",
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  letterSpacing: '0.38em',
                  whiteSpace: 'nowrap',
                }}
              >
                INTELLIHIRE
              </motion.button>
            )}
          </div>

          <div className="hidden md:block flex-shrink-0">
            <button onClick={() => navigate('/signup')} className="ih-cta">Get Started</button>
          </div>

          <div className="md:hidden ml-auto flex flex-col gap-[5px] cursor-pointer p-2">
            <motion.span className="block w-5 h-[1.5px] rounded-full" style={{ background: colPrimary }} />
            <motion.span className="block w-3.5 h-[1.5px] rounded-full" style={{ background: colPrimary }} />
          </div>

        </div>
      </motion.nav>
    </>
  );
}
