'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';

export default function VerifyPage() {
  const [code, setCode] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(24);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => setTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 3) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <AuthLayout>
      <Link href="/forgot-password" style={{ color: '#9ca3af', fontSize: '0.82rem', textDecoration: 'none', marginBottom: '24px', display: 'inline-block' }}>← Back</Link>

      <h1 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 800, color: '#0c1b2e', marginBottom: '6px', letterSpacing: '-0.02em' }}>
        Verification Code
      </h1>
      <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: '32px' }}>
        We sent you verification code on{' '}
        <span style={{ color: '#0c1b2e', fontWeight: 600 }}>...martinez@gmail.com</span>
      </p>

      {/* OTP inputs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            style={{
              width: '60px',
              height: '60px',
              textAlign: 'center',
              fontSize: '1.4rem',
              fontWeight: 700,
              fontFamily: "'Sora', sans-serif",
              border: `2px solid ${digit ? '#3d82c4' : '#e5e7eb'}`,
              borderRadius: '12px',
              outline: 'none',
              color: '#0c1b2e',
              background: '#fafafa',
              transition: 'border-color 0.2s ease',
            }}
          />
        ))}
      </div>

      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '28px', textAlign: 'right' }}>
        Resend Code in{' '}
        <span style={{ color: '#0c1b2e', fontWeight: 700 }}>
          00:{timer.toString().padStart(2, '0')}
        </span>
      </p>

      <button
        onClick={() => router.push('/reset-password')}
        style={{
          width: '100%',
          padding: '14px',
          background: '#0c1b2e',
          color: '#ffffff',
          border: 'none',
          borderRadius: '10px',
          fontFamily: "'Sora', sans-serif",
          fontSize: '0.9rem',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#1a2f4a')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#0c1b2e')}
      >
        Verify Code
      </button>
    </AuthLayout>
  );
}
