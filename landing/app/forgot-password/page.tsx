'use client';

import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';
import { AuthInput, AuthButton } from '@/components/AuthComponents';

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <Link href="/login" style={{ color: '#9ca3af', fontSize: '0.82rem', textDecoration: 'none', marginBottom: '24px', display: 'inline-block' }}>← Back</Link>

      <h1 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 800, color: '#0c1b2e', marginBottom: '6px', letterSpacing: '-0.02em' }}>
        Forgot Password
      </h1>
      <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: '28px' }}>
        We&apos;ll send a verification code to your email address
      </p>

      <AuthInput label="Email Address" placeholder="john62martinez@gmail.com" type="email" />

      <AuthButton label="Send Verification Code" href="/verify" accentColor="#0c1b2e" />
    </AuthLayout>
  );
}
