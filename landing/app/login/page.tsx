'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';
import { AuthInput, AuthButton, AuthDivider, SocialButtons } from '@/components/AuthComponents';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AuthLayout>
      <Link href="/" style={{ color: '#9ca3af', fontSize: '0.82rem', textDecoration: 'none', marginBottom: '24px', display: 'inline-block' }}>← Back</Link>

      <h1 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 800, color: '#0c1b2e', marginBottom: '6px', letterSpacing: '-0.02em' }}>
        Log in
      </h1>
      <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: '28px' }}>
        Don&apos;t have an account?{' '}
        <Link href="/signup" style={{ color: '#3d82c4', fontWeight: 600, textDecoration: 'none' }}>Create an Account</Link>
      </p>

      <AuthInput label="Email Address" placeholder="john62martinez@gmail.com" type="email" />
      <AuthInput
        label="Password"
        placeholder="Password"
        type={showPassword ? 'text' : 'password'}
        showToggle
        onToggle={() => setShowPassword(!showPassword)}
        showPassword={showPassword}
      />

      <div style={{ textAlign: 'right', marginBottom: '20px', marginTop: '-4px' }}>
        <Link href="/forgot-password" style={{ fontSize: '0.78rem', color: '#3d82c4', textDecoration: 'none', fontWeight: 600 }}>
          Forgot Password?
        </Link>
      </div>

      <AuthButton label="Log in" href="/dashboard" accentColor="#0c1b2e" />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '14px 0' }}>
        <input type="checkbox" id="terms" style={{ accentColor: '#3d82c4', cursor: 'pointer' }} />
        <label htmlFor="terms" style={{ fontSize: '0.75rem', color: '#9ca3af', cursor: 'pointer' }}>
          I agree to the <a href="#" style={{ color: '#3d82c4', textDecoration: 'none', fontWeight: 600 }}>Terms & Condition</a>
        </label>
      </div>

      <AuthDivider />
      <SocialButtons />
    </AuthLayout>
  );
}
