'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const regions = [
  { name: 'North America', roles: '12,400+ roles' },
  { name: 'Europe', roles: '18,700+ roles' },
  { name: 'Middle East', roles: '6,300+ roles' },
  { name: 'Asia Pacific', roles: '21,500+ roles' },
  { name: 'Africa', roles: '4,100+ roles' },
  { name: 'Latin America', roles: '7,900+ roles' },
];

export default function GlobalSection() {
  const headingRef = useRef<HTMLDivElement>(null);
  const inView = useInView(headingRef, { once: true, margin: '-10% 0px' });

  return (
    <section
      id="global"
      className="relative py-24 md:py-36 px-6 md:px-12 lg:px-20 overflow-hidden"
      style={{ background: 'var(--charcoal)' }}
    >
      {/* Animated world grid lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(200,169,110,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(200,169,110,0.07) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      <div className="max-w-screen-xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          ref={headingRef}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 md:mb-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-end"
        >
          <div>
            <p
              className="text-xs tracking-widest uppercase mb-4"
              style={{ color: 'var(--accent)', letterSpacing: '0.25em' }}
            >
              Global
            </p>
            <h2
              className="font-light leading-tight"
              style={{
                fontSize: 'clamp(2rem, 5vw, 4rem)',
                letterSpacing: '-0.02em',
                color: 'var(--white)',
              }}
            >
              Hire anywhere
              <br />with total confidence.
            </h2>
          </div>
          <p
            className="font-light leading-relaxed"
            style={{ color: 'var(--white-dim)', fontSize: '0.95rem' }}
          >
            With access to talent pools spanning 150+ countries and 40+ languages, IntelliHire brings the world's best candidates to your doorstep. Our experts manage every aspect of cross-border hiring — compliance, cultural fit, compensation benchmarking — so your expansion is effortless.
          </p>
        </motion.div>

        {/* Regions grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-px" style={{ background: 'var(--border)' }}>
          {regions.map((region, i) => (
            <RegionTile key={region.name} region={region} index={i} />
          ))}
        </div>

        {/* Bottom CTA strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 flex flex-col md:flex-row items-center justify-between gap-6 border-t pt-10"
          style={{ borderColor: 'var(--border)' }}
        >
          <p
            className="font-light text-lg md:text-2xl"
            style={{ color: 'var(--white)', letterSpacing: '-0.01em' }}
          >
            5K+ placements. Successfully arranged.
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-3 text-sm tracking-widest uppercase px-8 py-4 rounded-sm"
            style={{
              background: 'var(--accent)',
              color: '#050505',
              fontWeight: 500,
              letterSpacing: '0.15em',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
          >
            Start Hiring
            <span>→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function RegionTile({
  region,
  index,
}: {
  region: { name: string; roles: string };
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: index * 0.07 }}
      className="group relative p-8 md:p-10 overflow-hidden"
      style={{
        background: 'var(--charcoal)',
        transition: 'background 0.3s ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(200,169,110,0.05)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--charcoal)')}
    >
      <div className="flex flex-col gap-3">
        <div
          className="w-6 h-px"
          style={{ background: 'var(--accent)' }}
        />
        <h3
          className="font-light text-lg md:text-xl"
          style={{ color: 'var(--white)', letterSpacing: '-0.01em' }}
        >
          {region.name}
        </h3>
        <p
          className="text-xs tracking-widest uppercase"
          style={{ color: 'var(--white-dim)', letterSpacing: '0.12em' }}
        >
          {region.roles}
        </p>
      </div>
    </motion.div>
  );
}
