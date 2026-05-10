'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import { AuthInput } from '@/components/AuthComponents';

export default function ResetPasswordPage() {
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  return (
    <AuthLayout>
      <Link href="/verify" style={{ color: '#9ca3af', fontSize: '0.82rem', textDecoration: 'none', marginBottom: '24px', display: 'inline-block' }}>← Back</Link>

      <h1 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 800, color: '#0c1b2e', marginBottom: '6px', letterSpacing: '-0.02em' }}>
        Reset Password
      </h1>
      <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: '28px' }}>
        Your new password must be different from your previous passwords.
      </p>

      <AuthInput
        label="New Password"
        placeholder="New Password"
        type={showNew ? 'text' : 'password'}
        showToggle
        onToggle={() => setShowNew(!showNew)}
        showPassword={showNew}
      />
      <AuthInput
        label="Confirm Password"
        placeholder="Confirm Password"
        type={showConfirm ? 'text' : 'password'}
        showToggle
        onToggle={() => setShowConfirm(!showConfirm)}
        showPassword={showConfirm}
      />

      <button
        onClick={() => router.push('/login')}
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
          marginTop: '8px',
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#1a2f4a')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#0c1b2e')}
      >
        Reset Password
      </button>
    </AuthLayout>
  );
}
