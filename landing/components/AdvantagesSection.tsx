'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const advantages = [
  {
    icon: '◈',
    title: 'Pets Welcome',
    body: 'Onboarding top talent means treating people like people — not paperwork. Our platform adapts to your team culture with zero friction, making every new hire feel at home from day one.',
  },
  {
    icon: '◉',
    title: '24/7 Support',
    body: 'Our expert team is available around the clock to handle any request — from urgent role requisitions to real-time pipeline questions. With IntelliHire, support is never more than a message away.',
  },
  {
    icon: '◎',
    title: 'Personalized Onboarding',
    body: 'Every hire is tailored with a range of personalized onboarding services designed to elevate integration. From structured first weeks to role-specific learning paths, every detail is arranged for success.',
  },
  {
    icon: '◆',
    title: 'Radically Efficient',
    body: 'Efficiency is at the core of every search we run. From optimized talent pipelines to streamlined offer flows, we make sure your time is always spent on what matters — closing great hires, faster.',
  },
];

export default function AdvantagesSection() {
  const headingRef = useRef<HTMLDivElement>(null);
  const inView = useInView(headingRef, { once: true, margin: '-10% 0px' });

  return (
    <section
      id="advantages"
      className="relative py-24 md:py-36 px-6 md:px-12 lg:px-20"
      style={{ background: 'var(--black)' }}
    >
      <div className="max-w-screen-xl mx-auto">
        {/* Header */}
        <motion.div
          ref={headingRef}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 md:mb-24"
        >
          <p
            className="text-xs tracking-widest uppercase mb-4"
            style={{ color: 'var(--accent)', letterSpacing: '0.25em' }}
          >
            Advantages
          </p>
          <h2
            className="font-light leading-tight max-w-2xl"
            style={{
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              letterSpacing: '-0.02em',
              color: 'var(--white)',
            }}
          >
            Built for those who refuse to compromise.
          </h2>
        </motion.div>

        {/* 2×2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background: 'var(--border)' }}>
          {advantages.map((item, i) => (
            <AdvantageCard key={item.title} item={item} index={i} />
          ))}
        </div>

        {/* Stats row */}
        <StatsRow />
      </div>
    </section>
  );
}

function AdvantageCard({
  item,
  index,
}: {
  item: (typeof advantages)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: index * 0.1 }}
      className="group relative p-10 md:p-14 overflow-hidden"
      style={{
        background: 'var(--black)',
        transition: 'background 0.4s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'var(--charcoal)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'var(--black)';
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 30% 40%, rgba(200,169,110,0.06) 0%, transparent 60%)',
          transition: 'opacity 0.4s ease',
        }}
      />

      <div className="relative z-10">
        <div
          className="text-3xl mb-6"
          style={{ color: 'var(--accent)' }}
        >
          {item.icon}
        </div>
        <h3
          className="font-light text-xl md:text-2xl mb-4"
          style={{ color: 'var(--white)', letterSpacing: '-0.01em' }}
        >
          {item.title}
        </h3>
        <p
          className="font-light leading-relaxed"
          style={{ color: 'var(--white-dim)', fontSize: '0.9rem' }}
        >
          {item.body}
        </p>
      </div>
    </motion.div>
  );
}

function StatsRow() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });

  const stats = [
    { value: '5K+', label: 'Placements Made' },
    { value: '150+', label: 'Global Markets' },
    { value: '98%', label: 'Client Retention' },
    { value: '<6 Days', label: 'Avg. Time-to-Hire' },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="mt-16 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-px"
      style={{ background: 'var(--border)' }}
    >
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="py-10 px-8 flex flex-col gap-2"
          style={{ background: 'var(--black)' }}
        >
          <div
            className="font-light"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: 'var(--white)', letterSpacing: '-0.02em' }}
          >
            {stat.value}
          </div>
          <div
            className="text-xs tracking-widest uppercase"
            style={{ color: 'var(--white-dim)', letterSpacing: '0.15em' }}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
