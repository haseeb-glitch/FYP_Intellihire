import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageTransition } from '../components/layout/PageTransition';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      setMessage('');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const response = await forgotPassword(email);
      setMessage(response.message || 'If this email exists, a temporary password has been sent.');
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Unable to send password reset email. Please try again.');
      setMessage('');
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
          className="w-full max-w-[860px] rounded-3xl overflow-hidden shadow-2xl shadow-primary-500/20 flex flex-col-reverse md:flex-row"
        >
          <div
            className="md:w-[46%] relative overflow-hidden flex flex-col items-center justify-center min-h-[240px] md:min-h-0"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)' }}
          >
            <div className="absolute right-0 top-0 h-full w-[68px] z-20 hidden md:block">
              <svg viewBox="0 0 68 560" preserveAspectRatio="none" className="h-full w-full">
                <path
                  d="M68,0 L32,0 C12,46 2,92 24,134 C44,172 56,212 30,254 C10,288 2,326 24,368 C44,406 56,444 28,486 C12,510 8,532 24,560 L68,560 Z"
                  fill="white"
                />
              </svg>
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
              <svg viewBox="0 0 500 130" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="xMidYMax slice">
                <ellipse cx="55" cy="138" rx="115" ry="92" fill="white" opacity="0.90" />
                <ellipse cx="195" cy="145" rx="140" ry="84" fill="white" />
                <ellipse cx="348" cy="140" rx="128" ry="88" fill="white" opacity="0.93" />
                <ellipse cx="482" cy="135" rx="108" ry="82" fill="white" opacity="0.86" />
              </svg>
            </div>

            <div className="absolute top-[-20%] left-[-10%] w-64 h-64 rounded-full bg-blue-400/25 blur-[60px] pointer-events-none" />
            <div className="absolute bottom-[30%] right-[15%] w-44 h-44 rounded-full bg-primary-300/20 blur-[50px] pointer-events-none" />

            <div className="relative z-20 text-center px-10 pb-24 md:pb-20 pt-6">
              <img src="/logo.jpg" alt="IntelliHire" className="w-12 h-12 object-contain drop-shadow-lg mx-auto mb-5" />
              <h2 className="text-2xl font-bold text-white mb-3 font-heading">Need help signing in?</h2>
              <p className="text-blue-100/85 text-sm leading-relaxed mb-7 max-w-[205px] mx-auto">
                Enter your registered email and get a temporary password to continue.
              </p>
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/20 border border-white/10 flex items-center justify-center shrink-0">
                    <span className="text-white text-sm">1</span>
                  </div>
                  <span className="text-xs text-blue-50/90 font-medium">Easy recovery with one email</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/20 border border-white/10 flex items-center justify-center shrink-0">
                    <span className="text-white text-sm">2</span>
                  </div>
                  <span className="text-xs text-blue-50/90 font-medium">Secure temporary password delivery</span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:flex-1 bg-white px-10 py-10 flex flex-col justify-center relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <img src="/logo.jpg" alt="IntelliHire" className="w-10 h-10 object-contain drop-shadow-md" />
              <span className="font-heading font-bold text-[17px] text-slate-900">
                Intelli<span className="text-gradient">Hire</span>
              </span>
            </div>

            <h1 className="text-[26px] font-bold text-slate-900 mb-1">Forgot password?</h1>
            <p className="text-sm text-slate-500 mb-6">Enter your email to receive a temporary password.</p>

            {error && (
              <div className="mb-4 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}
            {message && (
              <div className="mb-4 px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                {message}
              </div>
            )}

            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center pointer-events-none">
                  <Mail className="w-3.5 h-3.5 text-primary-500" />
                </div>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full pl-[52px] pr-4 py-3 rounded-xl text-slate-900 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-1 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 text-white text-sm font-bold tracking-widest shadow-lg shadow-primary-500/30 hover:shadow-primary-500/45 hover:from-primary-600 hover:to-primary-800 transition-all duration-200 disabled:opacity-60"
              >
                {loading ? 'SENDING...' : 'SEND TEMP PASSWORD'}
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-500 text-center">
              Remembered your password?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};
