'use client';

interface AuthInputProps {
  label: string;
  placeholder: string;
  type?: string;
  showToggle?: boolean;
  onToggle?: () => void;
  showPassword?: boolean;
}

export function AuthInput({ label, placeholder, type = 'text', showToggle, onToggle, showPassword }: AuthInputProps) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#374151', marginBottom: '8px', fontFamily: "'Sora', sans-serif" }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '14px 20px',
            paddingRight: showToggle ? '50px' : '20px',
            border: '1.5px solid #cce0f5',
            borderRadius: '12px',
            fontSize: '0.95rem',
            fontFamily: "'Sora', sans-serif",
            color: '#0c1b2e',
            outline: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            background: '#ffffff',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#3d82c4';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(61,130,196,0.12)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#cce0f5';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            style={{
              position: 'absolute',
              right: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

interface AuthButtonProps {
  label: string;
  href: string;
  accentColor: string;
}

export function AuthButton({ label, href, accentColor }: AuthButtonProps) {
  return (
    <a
      href={href}
      style={{
        display: 'block',
        width: '100%',
        padding: '16px',
        background: accentColor,
        color: '#ffffff',
        border: 'none',
        borderRadius: '12px',
        fontFamily: "'Sora', sans-serif",
        fontSize: '1rem',
        fontWeight: 700,
        cursor: 'pointer',
        textAlign: 'center',
        textDecoration: 'none',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        marginTop: '6px',
        boxSizing: 'border-box',
        letterSpacing: '0.02em',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = '0.88';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = '1';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      {label}
    </a>
  );
}

export function AuthDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '22px 0' }}>
      <div style={{ flex: 1, height: '1px', background: '#cce0f5' }} />
      <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontFamily: "'Sora', sans-serif" }}>or</span>
      <div style={{ flex: 1, height: '1px', background: '#cce0f5' }} />
    </div>
  );
}

export function SocialButtons() {
  return (
    <div style={{ display: 'flex', gap: '14px' }}>
      <button
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: '14px',
          border: '1.5px solid #cce0f5',
          borderRadius: '12px',
          background: '#ffffff',
          cursor: 'pointer',
          fontFamily: "'Sora', sans-serif",
          fontSize: '0.85rem',
          fontWeight: 600,
          color: '#374151',
          transition: 'border-color 0.2s ease, background 0.2s ease, transform 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = '#3d82c4';
          (e.currentTarget as HTMLElement).style.background = '#eef6ff';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = '#cce0f5';
          (e.currentTarget as HTMLElement).style.background = '#ffffff';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>
      <button
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: '14px',
          border: '1.5px solid #cce0f5',
          borderRadius: '12px',
          background: '#ffffff',
          cursor: 'pointer',
          fontFamily: "'Sora', sans-serif",
          fontSize: '0.85rem',
          fontWeight: 600,
          color: '#374151',
          transition: 'border-color 0.2s ease, background 0.2s ease, transform 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = '#1877f2';
          (e.currentTarget as HTMLElement).style.background = '#eef3ff';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = '#cce0f5';
          (e.currentTarget as HTMLElement).style.background = '#ffffff';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877f2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        Continue with Facebook
      </button>
    </div>
  );
}
