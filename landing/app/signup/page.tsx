'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';
import { AuthInput, AuthButton, AuthDivider, SocialButtons } from '@/components/AuthComponents';

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  return (
    <AuthLayout>
      <Link href="/" style={{ color: '#9ca3af', fontSize: '0.82rem', textDecoration: 'none', marginBottom: '24px', display: 'inline-block' }}>← Back</Link>

      <h1 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 800, color: '#0c1b2e', marginBottom: '6px', letterSpacing: '-0.02em' }}>
        Create an Account
      </h1>
      <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: '28px' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: '#3d82c4', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '0' }}>
        <AuthInput label="First Name" placeholder="John" />
        <AuthInput label="Last Name" placeholder="Last Name" />
      </div>
      <AuthInput label="Email Address" placeholder="Email Address" type="email" />
      <AuthInput
        label="Password"
        placeholder="Password"
        type={showPassword ? 'text' : 'password'}
        showToggle
        onToggle={() => setShowPassword(!showPassword)}
        showPassword={showPassword}
      />

      <AuthButton label="Create Account" href="/dashboard" accentColor="#0c1b2e" />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '14px 0' }}>
        <input type="checkbox" id="terms" checked={agreed} onChange={() => setAgreed(!agreed)} style={{ accentColor: '#3d82c4', cursor: 'pointer' }} />
        <label htmlFor="terms" style={{ fontSize: '0.75rem', color: '#9ca3af', cursor: 'pointer' }}>
          I agree to the <a href="#" style={{ color: '#3d82c4', textDecoration: 'none', fontWeight: 600 }}>Terms & Condition</a>
        </label>
      </div>

      <AuthDivider />
      <SocialButtons />
    </AuthLayout>
  );
}
