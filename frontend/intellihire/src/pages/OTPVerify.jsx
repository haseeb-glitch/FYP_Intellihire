import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, RefreshCcw } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageTransition } from '../components/layout/PageTransition';

export const OTPVerify = () => {
  const { verifyOtp, sendOtp } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);

  useEffect(() => {
    const incomingEmail = location.state?.email || new URLSearchParams(location.search).get('email') || '';
    if (incomingEmail) setEmail(incomingEmail);
  }, [location.state]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email || !otp) {
      setError('Please enter both your email and OTP code.');
      return;
    }

    setError('');
    setBusy(true);

    try {
      await verifyOtp(email, otp);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Please enter the email you registered with.');
      return;
    }

    setError('');
    setResendBusy(true);
    try {
      const res = await sendOtp(email);
      const successText = 'A new OTP has been sent to your email.';
      setMessage(successText + (res.otp ? ` Your OTP is ${res.otp}` : ''));
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Unable to resend OTP.');
    } finally {
      setResendBusy(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-[calc(100vh-64px)] flex items-start justify-center px-4 pt-0 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[860px] rounded-3xl overflow-hidden shadow-2xl shadow-primary-500/20 flex flex-col md:flex-row"
        >
          <div className="md:w-[46%] bg-white px-10 py-12 flex flex-col justify-center relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <img src="/logo.jpg" alt="IntelliHire" className="w-10 h-10 object-contain drop-shadow-md" />
              <span className="font-heading font-bold text-[17px] text-slate-900">
                Intelli<span className="text-gradient">Hire</span>
              </span>
            </div>

            <h1 className="text-[26px] font-bold text-slate-900 mb-1">Email verification</h1>
            <p className="text-sm text-slate-500 mb-7">Enter the code we sent to your inbox to complete registration.</p>

            {message && (
              <div className="mb-4 px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                {message}
              </div>
            )}
            {error && (
              <div className="mb-4 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleVerify}>
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

              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center pointer-events-none">
                  <Lock className="w-3.5 h-3.5 text-primary-500" />
                </div>
                <input
                  type="text"
                  placeholder="Enter OTP code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="glass-input w-full pl-[52px] pr-4 py-3 rounded-xl text-slate-900 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 text-white text-sm font-bold tracking-widest shadow-lg shadow-primary-500/30 hover:from-primary-600 hover:to-primary-800 transition-all duration-200 disabled:opacity-60"
              >
                {busy ? 'VERIFYING...' : 'VERIFY OTP'}
              </button>
            </form>

            <div className="mt-5 text-center text-sm text-slate-500">
              Didn’t receive a code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendBusy}
                className="inline-flex items-center gap-2 font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
                {resendBusy ? 'Resending...' : 'Resend OTP'}
              </button>
            </div>

            <p className="mt-6 text-sm text-slate-500 text-center">
              Already verified?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                Sign in instead
              </Link>
            </p>
          </div>

          <div
            className="md:flex-1 relative overflow-hidden flex flex-col items-center justify-center min-h-[240px] md:min-h-0"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)' }}
          >
            <div className="absolute left-0 top-0 h-full w-[68px] z-20 hidden md:block">
              <svg viewBox="0 0 68 560" preserveAspectRatio="none" className="h-full w-full">
                <path
                  d="M0,0 L36,0 C56,46 66,92 44,134 C24,172 12,212 38,254 C58,288 66,326 44,368 C24,406 12,444 40,486 C56,510 60,532 44,560 L0,560 Z"
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

            <div className="relative z-20 text-center px-12 pb-24 md:pb-20 pt-6">
              <img src="/logo.jpg" alt="IntelliHire" className="w-12 h-12 object-contain drop-shadow-lg mx-auto mb-5" />
              <h2 className="text-2xl font-bold text-white mb-3 font-heading">Verify your account</h2>
              <p className="text-blue-100/85 text-sm leading-relaxed max-w-[205px] mx-auto">
                We sent a one-time code to your email. Use it to finish account setup and unlock the dashboard.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};
