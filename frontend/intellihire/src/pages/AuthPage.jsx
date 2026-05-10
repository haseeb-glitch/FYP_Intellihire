import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Diamond, User, Mail, BrainCircuit, BarChart2, Route } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageTransition } from '../components/layout/PageTransition';



export const AuthPage = () => {
  const { pathname } = useLocation();
  const navigate     = useNavigate();
  const { login, register } = useAuth();
  const isSignup = pathname === '/signup';

  /* ── Login state ── */
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginErr,  setLoginErr]  = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [showLP,    setShowLP]    = useState(false);

  /* ── Register state ── */
  const [regUser,    setRegUser]    = useState('');
  const [regEmail,   setRegEmail]   = useState('');
  const [regPass,    setRegPass]    = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regErr,     setRegErr]     = useState('');
  const [regBusy,    setRegBusy]    = useState(false);
  const [showRP,     setShowRP]     = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPass) { setLoginErr('Please fill in all fields'); return; }
    setLoginErr(''); setLoginBusy(true);
    try { await login(loginEmail, loginPass); navigate('/dashboard'); }
    catch (err) { setLoginErr(err.response?.data?.detail || err.response?.data?.message || 'Login failed. Please try again.'); }
    finally { setLoginBusy(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regUser || !regEmail || !regPass || !regConfirm) { setRegErr('Please fill in all fields'); return; }
    if (regPass !== regConfirm) { setRegErr('Passwords do not match'); return; }
    if (regPass.length < 6) { setRegErr('Password must be at least 6 characters'); return; }
    setRegErr(''); setRegBusy(true);
    try {
      const result = await register(regUser, regEmail, regPass);
      navigate('/verify', { state: { email: result.email || regEmail } });
    } catch (err) {
      setRegErr(err.response?.data?.detail || err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setRegBusy(false); }
  };

  const iconBox = 'absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-900/40 border border-primary-100 dark:border-primary-700/40 flex items-center justify-center pointer-events-none';
  const field   = 'glass-input w-full pl-[46px] pr-4 py-2.5 rounded-xl text-slate-900 text-sm';
  const submitBtn = 'w-full py-2.5 mt-0.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 text-white text-sm font-bold tracking-widest shadow-lg shadow-primary-500/30 hover:from-primary-600 hover:to-primary-800 transition-all duration-200 disabled:opacity-60';



  return (
    <PageTransition>
      <div className="min-h-[calc(100vh-64px)] flex items-start justify-center px-4 pt-0 pb-8">
        <div
          className="relative w-full max-w-[860px] rounded-3xl overflow-hidden shadow-2xl shadow-primary-500/20"
          style={{ height: 490 }}
        >

          {/* ══════════════ FORMS CONTAINER ══════════════ */}
          <div className="absolute inset-0 flex">
            {/* Login Form */}
            <motion.div
              className="w-[56%] h-full bg-white z-10"
              initial={false}
              animate={{ 
                x: isSignup ? '-20%' : '0%',
                opacity: isSignup ? 0 : 1,
                pointerEvents: isSignup ? 'none' : 'auto'
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="h-full flex flex-col justify-center px-12 py-8">
                <div className="flex items-center gap-2 mb-6">
                  <img src="/logo.jpg" alt="IntelliHire" className="w-10 h-10 object-contain drop-shadow-md" />
                  <span className="font-heading font-bold text-[18px] text-slate-900">
                    Intelli<span className="text-gradient">Hire</span>
                  </span>
                </div>
                <h1 className="text-[28px] font-bold text-slate-900 mb-1">Welcome Back!</h1>
                <p className="text-sm text-slate-500 mb-6">Enter your details to continue</p>
                
                {loginErr && (
                  <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                    {loginErr}
                  </div>
                )}
                
                <form className="space-y-3.5" onSubmit={handleLogin}>
                  <div className="relative">
                    <div className={iconBox}><Mail className="w-3.5 h-3.5 text-primary-500" /></div>
                    <input type="email" placeholder="Email address" value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)} className={field} />
                  </div>
                  <div className="relative">
                    <div className={iconBox}><Lock className="w-3.5 h-3.5 text-primary-500" /></div>
                    <input type={showLP ? 'text' : 'password'} placeholder="Password"
                      value={loginPass} onChange={e => setLoginPass(e.target.value)}
                      className={field + ' pr-11'} />
                    <button type="button" onClick={() => setShowLP(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600 transition-colors">
                      {showLP ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button type="submit" disabled={loginBusy} className={submitBtn}>
                    {loginBusy ? 'SIGNING IN...' : 'SIGN IN'}
                  </button>
                </form>

                <p className="mt-4 text-sm text-slate-500">
                  <Link to="/forgot-password" className="font-semibold text-primary-600 hover:text-primary-700">
                    Forgot password?
                  </Link>
                </p>

                {/* Mobile/Small screen fallback toggle */}
                <p className="mt-6 text-sm text-slate-500 text-center lg:hidden">
                  New here?{' '}
                  <button onClick={() => navigate('/signup')} className="font-semibold text-primary-600 hover:text-primary-700">
                    Create account
                  </button>
                </p>
              </div>
            </motion.div>

            {/* Empty space for overlay to slide over */}
            <div className="w-[44%] h-full" />

            {/* Signup Form */}
            <motion.div
              className="absolute top-0 right-0 w-[56%] h-full bg-white z-10"
              initial={false}
              animate={{ 
                x: isSignup ? '0%' : '20%',
                opacity: isSignup ? 1 : 0,
                pointerEvents: isSignup ? 'auto' : 'none'
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="h-full flex flex-col justify-center px-12 py-8">
                <div className="flex items-center gap-2 mb-6">
                  <img src="/logo.jpg" alt="IntelliHire" className="w-10 h-10 object-contain drop-shadow-md" />
                  <span className="font-heading font-bold text-[18px] text-slate-900">
                    Intelli<span className="text-gradient">Hire</span>
                  </span>
                </div>
                <h1 className="text-[28px] font-bold text-slate-900 mb-1">Create Account</h1>
                <p className="text-sm text-slate-500 mb-6">Join the future of interview prep</p>
                
                {regErr && (
                  <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                    {regErr}
                  </div>
                )}

                <form className="space-y-3" onSubmit={handleRegister}>
                  <div className="relative">
                    <div className={iconBox}><User className="w-3.5 h-3.5 text-primary-500" /></div>
                    <input type="text" placeholder="Username" value={regUser}
                      onChange={e => setRegUser(e.target.value)} className={field} />
                  </div>
                  <div className="relative">
                    <div className={iconBox}><Mail className="w-3.5 h-3.5 text-primary-500" /></div>
                    <input type="email" placeholder="Email address" value={regEmail}
                      onChange={e => setRegEmail(e.target.value)} className={field} />
                  </div>
                  <div className="relative">
                    <div className={iconBox}><Lock className="w-3.5 h-3.5 text-primary-500" /></div>
                    <input type={showRP ? 'text' : 'password'} placeholder="Password"
                      value={regPass} onChange={e => setRegPass(e.target.value)}
                      className={field + ' pr-11'} />
                    <button type="button" onClick={() => setShowRP(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600 transition-colors">
                      {showRP ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <div className={iconBox}><Lock className="w-3.5 h-3.5 text-primary-500" /></div>
                    <input type="password" placeholder="Confirm password" value={regConfirm}
                      onChange={e => setRegConfirm(e.target.value)} className={field} />
                  </div>
                  <button type="submit" disabled={regBusy} className={submitBtn}>
                    {regBusy ? 'CREATING...' : 'CREATE ACCOUNT'}
                  </button>
                </form>

                <p className="mt-6 text-sm text-slate-500 text-center lg:hidden">
                  Already have an account?{' '}
                  <button onClick={() => navigate('/login')} className="font-semibold text-primary-600 hover:text-primary-700">
                    Sign in
                  </button>
                </p>
              </div>
            </motion.div>
          </div>

          {/* ══════════════ SLIDING OVERLAY PANEL ══════════════ */}
          <motion.div
            className="absolute top-0 h-full z-20 overflow-hidden"
            initial={false}
            animate={{ 
              left: isSignup ? '0%' : '56%',
              width: '44%'
            }}
            transition={{ type: 'spring', stiffness: 260, damping: 32 }}
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)',
            }}
          >
            {/* Decorative background elements */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_#fff_0%,_transparent_70%)] opacity-10" />
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            </div>

            {/* Content inside sliding panel */}
            <AnimatePresence mode="wait">
              {!isSignup ? (
                <motion.div 
                  key="overlay-login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="relative z-30 h-full flex flex-col items-center justify-center text-center px-10"
                >
                  <h2 className="text-[28px] font-bold text-white mb-4">Hello, Friend!</h2>
                  <p className="text-white/80 text-[15px] leading-relaxed mb-8">
                    Don't have an account yet? Join us and start your journey today.
                  </p>
                  <button 
                    onClick={() => navigate('/signup')}
                    className="px-10 py-3 rounded-full border-2 border-white/30 text-white font-bold hover:bg-white hover:text-primary-600 transition-all duration-300 shadow-xl"
                  >
                    SIGN UP
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="overlay-signup"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4 }}
                  className="relative z-30 h-full flex flex-col items-center justify-center text-center px-10"
                >
                  <h2 className="text-[28px] font-bold text-white mb-4">Welcome Back!</h2>
                  <p className="text-white/80 text-[15px] leading-relaxed mb-8">
                    To keep connected with us please login with your personal info.
                  </p>
                  <button 
                    onClick={() => navigate('/login')}
                    className="px-10 py-3 rounded-full border-2 border-white/30 text-white font-bold hover:bg-white hover:text-primary-600 transition-all duration-300 shadow-xl"
                  >
                    SIGN IN
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom cloud shapes (Restored) */}
            <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
              <svg viewBox="0 0 380 105" className="w-full" preserveAspectRatio="xMidYMax slice">
                <ellipse cx="42"  cy="112" rx="88"  ry="72" fill="#E0F2FE" opacity="0.90" />
                <ellipse cx="152" cy="118" rx="108" ry="64" fill="#E0F2FE" />
                <ellipse cx="268" cy="114" rx="98"  ry="68" fill="#E0F2FE" opacity="0.93" />
                <ellipse cx="370" cy="110" rx="82"  ry="60" fill="#E0F2FE" opacity="0.86" />
              </svg>
            </div>

            {/* Original Wavy Divider (Zigzag design) */}
            <AnimatePresence mode="wait">
              {!isSignup ? (
                <motion.div 
                  key="wl-orig"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute left-0 top-0 h-full w-[68px] z-30 pointer-events-none"
                >
                  <svg viewBox="0 0 68 490" preserveAspectRatio="none" className="h-full w-full">
                    <path d="M0,0 L34,0 C54,40 64,82 42,118 C22,152 10,188 36,226 C56,256 64,290 42,328 C22,362 10,396 38,432 C54,456 58,474 42,490 L0,490 Z" fill="white"/>
                  </svg>
                </motion.div>
              ) : (
                <motion.div 
                  key="wr-orig"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute right-0 top-0 h-full w-[68px] z-30 pointer-events-none"
                >
                  <svg viewBox="0 0 68 490" preserveAspectRatio="none" className="h-full w-full">
                    <path d="M68,0 L34,0 C14,40 4,82 26,118 C46,152 58,188 32,226 C12,256 4,290 26,328 C46,362 58,396 30,432 C14,456 10,474 26,490 L68,490 Z" fill="white"/>
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </div>
    </PageTransition>
  );
};
