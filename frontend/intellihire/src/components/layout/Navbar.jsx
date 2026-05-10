import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Menu, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const mobileAuthLinks = [
  { name: 'Dashboard',     path: '/dashboard' },
  { name: 'New Interview', path: '/setup' },
  { name: 'AI Coach',      path: '/ai-coach' },
  { name: 'Roadmap',       path: '/roadmap' },
  { name: 'Settings',      path: '/settings' },
];

const SLOGANS = [
  { text: "Master Your Next Interview with AI.", gradient: "from-blue-600 via-indigo-600 to-violet-600" },
  { text: "Your Dream Job is Just One Practice Away.", gradient: "from-emerald-600 via-teal-600 to-cyan-600" },
  { text: "Precision Feedback for Maximum Impact.", gradient: "from-purple-600 via-fuchsia-600 to-pink-600" },
  { text: "Elevate Your Career with IntelliHire.", gradient: "from-blue-500 via-primary-600 to-primary-700" },
  { text: "Turn Every Interview into an Offer.", gradient: "from-amber-500 via-orange-600 to-rose-600" },
  { text: "The Future of Hiring Starts Here.", gradient: "from-indigo-600 via-blue-600 to-sky-600" }
];

const SloganSlider = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SLOGANS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-10 overflow-hidden flex items-center justify-center min-w-[380px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ y: 24, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -24, opacity: 0, scale: 0.95 }}
          transition={{ 
            duration: 0.6, 
            ease: [0.22, 1, 0.36, 1],
            opacity: { duration: 0.4 }
          }}
          className="flex items-center justify-center"
        >
          <p
            className={cn(
              "text-[15px] font-heading font-bold tracking-tight bg-gradient-to-r bg-clip-text text-transparent",
              SLOGANS[index].gradient
            )}
          >
            {SLOGANS[index].text}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export const Navbar = () => {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location]);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <>
      {/* ── Main Bar ── */}
      <motion.header
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'fixed top-0 left-0 right-0 z-[9999] h-16 flex items-center px-4 sm:px-6 lg:px-8',
          'transition-all duration-300',
          scrolled ? 'glass-nav' : 'bg-white/70 backdrop-blur-xl border-b border-[#D6E7F7]/60'
        )}
      >
        <div className="w-full max-w-screen-2xl mx-auto flex items-center justify-between gap-4">

          {/* Logo */}
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="flex items-center gap-2.5 shrink-0 group"
          >
            <img 
              src="/logo.jpg" 
              alt="IntelliHire" 
              className="w-10 h-10 object-contain transition-all duration-250 group-hover:scale-105"
            />
            <span className="font-heading font-bold text-[17px] tracking-tight text-slate-900">
              Intelli<span className="text-gradient">Hire</span>
            </span>
          </Link>

          {/* Center section — sliding slogans for auth users */}
          {isAuthenticated && (
            <div className="hidden md:flex flex-1 items-center justify-center">
              <SloganSlider />
            </div>
          )}

          {/* Right section */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* User chip */}
                <Link
                  to="/settings"
                  className="hidden sm:flex items-center gap-2 h-9 px-3.5 rounded-xl bg-primary-50 border border-primary-200/60 hover:bg-primary-100 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-[10px] font-bold uppercase shrink-0">
                    {(user?.username || 'U')[0]}
                  </div>
                  <span className="text-sm font-semibold text-primary-700 max-w-[120px] truncate">
                    {user?.username}
                  </span>
                </Link>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="hidden sm:flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200/60 transition-all duration-150"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:flex h-9 px-4 text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors rounded-xl hover:bg-primary-50/60 items-center"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="h-9 px-4 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 shadow-sm shadow-primary-500/25 hover:shadow-md hover:shadow-primary-500/35 hover:from-primary-600 hover:to-primary-700 transition-all duration-200 flex items-center"
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 transition-colors md:hidden"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-[68px] left-3 right-3 z-[9998] glass-card rounded-2xl p-3 shadow-xl"
          >
            {/* Auth mobile links */}
            {isAuthenticated && mobileAuthLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="flex items-center px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
              >
                {link.name}
              </Link>
            ))}

            {/* Divider + auth actions */}
            <div className="border-t border-[#D6E7F7] mt-2 pt-2 flex gap-2">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="flex-1 text-center py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors border border-red-100"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link to="/login"  className="flex-1 text-center py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                    Log in
                  </Link>
                  <Link to="/signup" className="flex-1 text-center py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold hover:from-primary-600 hover:to-primary-700 transition-colors shadow-sm">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
