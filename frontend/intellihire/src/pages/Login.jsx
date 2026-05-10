import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Diamond, User, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageTransition } from '../components/layout/PageTransition';

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-[calc(100vh-64px)] flex items-start justify-center px-4 pt-0 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[860px] rounded-3xl overflow-hidden shadow-2xl shadow-primary-500/20 flex flex-col md:flex-row"
        >

          {/* ── Left: Form panel ── */}
          <div className="md:w-[46%] bg-white dark:bg-[#0D1322] px-10 py-12 flex flex-col justify-center relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-8">
              <img src="/logo.jpg" alt="IntelliHire" className="w-10 h-10 object-contain drop-shadow-md" />
              <span className="font-heading font-bold text-[17px] text-slate-900 dark:text-slate-100">
                Intelli<span className="text-gradient">Hire</span>
              </span>
            </div>

            <h1 className="text-[26px] font-bold text-slate-900 dark:text-slate-100 mb-1">Hello!</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-7">Sign in to your account</p>

            {error && (
              <div className="mb-4 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <form className="space-y-3.5" onSubmit={handleSubmit}>
              {/* Username */}
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-900/40 border border-primary-100 dark:border-primary-700/40 flex items-center justify-center pointer-events-none">
                  <Mail className="w-3.5 h-3.5 text-primary-500" />
                </div>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full pl-[52px] pr-4 py-3 rounded-xl text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-900/40 border border-primary-100 dark:border-primary-700/40 flex items-center justify-center pointer-events-none">
                  <Lock className="w-3.5 h-3.5 text-primary-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full pl-[52px] pr-12 py-3 rounded-xl text-slate-900 dark:text-slate-100 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-1 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 text-white text-sm font-bold tracking-widest shadow-lg shadow-primary-500/30 hover:shadow-primary-500/45 hover:from-primary-600 hover:to-primary-800 transition-all duration-200 disabled:opacity-60"
              >
                {loading ? 'SIGNING IN...' : 'SIGN IN'}
              </button>
            </form>

            <p className="mt-7 text-sm text-slate-500 dark:text-slate-400 text-center">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                Create
              </Link>
            </p>
          </div>

          {/* ── Right: Brand panel ── */}
          <div
            className="md:flex-1 relative overflow-hidden flex flex-col items-center justify-center min-h-[240px] md:min-h-0"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)' }}
          >
            {/* Left wavy white divider — only on md+ */}
            <div className="absolute left-0 top-0 h-full w-[68px] z-20 hidden md:block">
              <svg viewBox="0 0 68 560" preserveAspectRatio="none" className="h-full w-full">
                <path
                  d="M0,0 L36,0 C56,46 66,92 44,134 C24,172 12,212 38,254 C58,288 66,326 44,368 C24,406 12,444 40,486 C56,510 60,532 44,560 L0,560 Z"
                  fill="white"
                />
              </svg>
            </div>

            {/* Bottom cloud shapes */}
            <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
              <svg viewBox="0 0 500 130" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="xMidYMax slice">
                <ellipse cx="55"  cy="138" rx="115" ry="92" fill="white" opacity="0.90" />
                <ellipse cx="195" cy="145" rx="140" ry="84" fill="white" />
                <ellipse cx="348" cy="140" rx="128" ry="88" fill="white" opacity="0.93" />
                <ellipse cx="482" cy="135" rx="108" ry="82" fill="white" opacity="0.86" />
              </svg>
            </div>

            {/* Ambient glow blobs */}
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 rounded-full bg-blue-400/25 blur-[60px] pointer-events-none" />
            <div className="absolute top-[40%] left-[20%]  w-44 h-44 rounded-full bg-primary-300/20 blur-[50px] pointer-events-none" />

            {/* Content */}
            <div className="relative z-20 text-center px-12 pb-24 md:pb-20 pt-6">
              <img src="/logo.jpg" alt="IntelliHire" className="w-12 h-12 object-contain drop-shadow-lg mx-auto mb-5" />
              <h2 className="text-2xl font-bold text-white mb-3 font-heading">Welcome Back!</h2>
              <p className="text-blue-100/85 text-sm leading-relaxed max-w-[205px] mx-auto">
                Continue your AI-powered interview prep and land your dream job.
              </p>
            </div>
          </div>

        </motion.div>
      </div>
    </PageTransition>
  );
};
