'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const platforms = [
  {
    id: 'ai-screening',
    label: 'AI Screening Engine',
    tag: 'Core',
    description:
      'IntelliHire\'s proprietary screening engine analyzes thousands of candidates in seconds. Powered by large language models and behavioral pattern recognition, it surfaces only the highest-fit applicants — with transparent scoring you can trust.',
    specs: [
      { label: 'Precision', value: '98.2%' },
      { label: 'Avg. Time-to-Hire', value: '6 Days' },
      { label: 'Bias Reduction', value: '94%' },
    ],
  },
  {
    id: 'talent-insights',
    label: 'Deep Talent Insights',
    tag: 'Intelligence',
    description:
      'Move beyond the résumé. IntelliHire profiles candidates across skills, culture alignment, growth trajectory, and competitive market positioning — giving hiring managers the full picture before the first call.',
    specs: [
      { label: 'Data Points', value: '2,400+' },
      { label: 'Markets Covered', value: '150+' },
      { label: 'Languages', value: '40+' },
    ],
  },
  {
    id: 'workflow',
    label: 'Seamless Workflow',
    tag: 'Operations',
    description:
      'From requisition to offer letter, every stage of your recruitment pipeline is orchestrated by IntelliHire. Automated scheduling, collaborative scorecards, and real-time pipeline analytics keep your entire team aligned.',
    specs: [
      { label: 'Integration Sync', value: '<1s' },
      { label: 'ATS Partners', value: '30+' },
      { label: 'Uptime SLA', value: '99.99%' },
    ],
  },
];

export default function PlatformSection() {
  const headingRef = useRef<HTMLDivElement>(null);
  const headingInView = useInView(headingRef, { once: true, margin: '-10% 0px' });

  return (
    <section
      id="platform"
      className="relative py-24 md:py-36 px-6 md:px-12 lg:px-20 overflow-hidden"
      style={{ background: 'var(--charcoal)' }}
    >
      {/* Subtle background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(200,169,110,0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="max-w-screen-xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          ref={headingRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headingInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end gap-8 justify-between"
        >
          <div>
            <p
              className="text-xs tracking-widest uppercase mb-4"
              style={{ color: 'var(--accent)', letterSpacing: '0.25em' }}
            >
              Our Platform
            </p>
            <h2
              className="font-light leading-tight"
              style={{
                fontSize: 'clamp(2rem, 5vw, 4rem)',
                letterSpacing: '-0.02em',
                color: 'var(--white)',
              }}
            >
              Technology that
              <br />
              thinks ahead.
            </h2>
          </div>
          <p
            className="font-light leading-relaxed max-w-sm"
            style={{ color: 'var(--white-dim)', fontSize: '0.95rem' }}
          >
            IntelliHire is engineered for exceptional accuracy and speed — purpose-built for teams who expect more from their hiring stack.
          </p>
        </motion.div>

        {/* Platform cards */}
        <div className="space-y-1">
          {platforms.map((item, i) => (
            <PlatformCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PlatformCard({
  item,
  index,
}: {
  item: (typeof platforms)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: index * 0.12 }}
      className="group relative rounded-sm overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border)',
        transition: 'background 0.3s ease, border-color 0.3s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(200,169,110,0.04)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,169,110,0.2)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
      }}
    >
      <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left: label + tag */}
        <div className="md:col-span-4">
          <span
            className="inline-block text-xs tracking-widest uppercase px-2 py-1 rounded-sm mb-4"
            style={{
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
              letterSpacing: '0.15em',
            }}
          >
            {item.tag}
          </span>
          <h3
            className="font-light text-xl md:text-2xl"
            style={{ color: 'var(--white)', letterSpacing: '-0.01em' }}
          >
            {item.label}
          </h3>
        </div>

        {/* Middle: description */}
        <div className="md:col-span-5">
          <p
            className="font-light leading-relaxed"
            style={{ color: 'var(--white-dim)', fontSize: '0.95rem' }}
          >
            {item.description}
          </p>
        </div>

        {/* Right: specs */}
        <div className="md:col-span-3 flex flex-col gap-4">
          {item.specs.map((spec) => (
            <div key={spec.label} className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
              <div
                className="text-2xl font-light"
                style={{ color: 'var(--white)' }}
              >
                {spec.value}
              </div>
              <div
                className="text-xs tracking-widest uppercase mt-1"
                style={{ color: 'var(--white-faint)', letterSpacing: '0.12em' }}
              >
                {spec.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
