'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

export default function ContactSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--border)',
    color: 'var(--white)',
    fontSize: '0.95rem',
    padding: '12px 0',
    outline: 'none',
    fontFamily: 'inherit',
    fontWeight: 300,
    transition: 'border-color 0.2s ease',
  };

  return (
    <section id="contact" className="relative py-24 md:py-36 px-6 md:px-12 lg:px-20" style={{ background: 'var(--black)' }}>
      <div className="max-w-screen-xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
          <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--accent)', letterSpacing: '0.25em' }}>For Inquiries</p>
            <h2 className="font-light leading-tight mb-8" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', letterSpacing: '-0.02em', color: 'var(--white)' }}>
              Hire anywhere with total comfort and control.
            </h2>
            <div className="space-y-4">
              <a href="mailto:hello@intellihire.ai" className="flex items-center gap-3 text-sm" style={{ color: 'var(--white-dim)' }}>
                <span style={{ color: 'var(--accent)' }}>✉</span> hello@intellihire.ai
              </a>
              <a href="tel:+14155550192" className="flex items-center gap-3 text-sm" style={{ color: 'var(--white-dim)' }}>
                <span style={{ color: 'var(--accent)' }}>✆</span> +1 (415) 555-0192
              </a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}>
            {submitted ? (
              <div className="flex flex-col gap-4 py-12">
                <div className="text-3xl" style={{ color: 'var(--accent)' }}>✓</div>
                <p className="font-light text-lg" style={{ color: 'var(--white)' }}>Message received.</p>
                <p className="font-light text-sm" style={{ color: 'var(--white-dim)' }}>Our team will get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                {[
                  { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Jane Smith' },
                  { label: 'Email', key: 'email', type: 'email', placeholder: 'jane@company.com' },
                  { label: 'Company', key: 'company', type: 'text', placeholder: 'Acme Corp' },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--white-dim)', letterSpacing: '0.15em' }}>{label}</label>
                    <input
                      type={type}
                      required={key !== 'company'}
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      placeholder={placeholder}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderBottomColor = 'var(--accent)')}
                      onBlur={(e) => (e.target.style.borderBottomColor = 'var(--border)')}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--white-dim)', letterSpacing: '0.15em' }}>Message</label>
                  <textarea rows={4} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us about your hiring needs..." style={{ ...inputStyle, resize: 'none' }} onFocus={(e) => (e.target.style.borderBottomColor = 'var(--accent)')} onBlur={(e) => (e.target.style.borderBottomColor = 'var(--border)')} />
                </div>
                <button type="submit" style={{ background: 'var(--accent)', color: '#050505', fontWeight: 500, fontFamily: 'inherit', letterSpacing: '0.15em', cursor: 'pointer', border: 'none', padding: '1rem 2rem', alignSelf: 'flex-start', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  Submit
                </button>
                <p className="text-xs" style={{ color: 'var(--white-faint)' }}>
                  By submitting, you agree to our <a href="#" style={{ color: 'var(--white-dim)', textDecoration: 'underline' }}>Privacy Policy</a>.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
