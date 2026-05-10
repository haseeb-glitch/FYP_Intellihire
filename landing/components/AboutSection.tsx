'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const features = [
  {
    number: '01',
    title: 'Direct Access to Top Talent',
    body: 'Reach beyond conventional pipelines with IntelliHire. Our global AI network ensures seamless, personalized candidate discovery — from the first search to the final offer. Every engagement is tailored to your role, culture, and timeline.',
  },
  {
    number: '02',
    title: 'Your Freedom to Build',
    body: 'We value your time above all. IntelliHire gives you the freedom to lead, grow, and scale wherever business takes you — without compromising hiring quality or speed.',
  },
  {
    number: '03',
    title: 'Precision and Excellence',
    body: 'Each detail of your recruitment — from job requisition to final decision — reflects our dedication to perfection. Our AI and expert network meet the highest global standards, ensuring reliability in every placement.',
  },
  {
    number: '04',
    title: 'Global Reach, Personal Touch',
    body: "With access to talent across 150+ markets, IntelliHire brings the world's best candidates closer to you. Our platform manages every touchpoint, guaranteeing a smooth and effortless hiring journey.",
  },
];

function FeatureItem({
  item,
  index,
}: {
  item: (typeof features)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: index * 0.1 }}
      className="group relative border-t py-10 md:py-14"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-2 md:col-span-1">
          <span
            className="font-mono text-xs"
            style={{ color: 'var(--white-faint)' }}
          >
            {item.number}
          </span>
        </div>
        <div className="col-span-10 md:col-span-4">
          <h3
            className="font-light text-xl md:text-2xl"
            style={{ color: 'var(--white)', letterSpacing: '-0.01em', lineHeight: 1.3 }}
          >
            {item.title}
          </h3>
        </div>
        <div className="col-span-12 md:col-span-6 md:col-start-7">
          <p
            className="font-light leading-relaxed"
            style={{ color: 'var(--white-dim)', fontSize: '0.95rem' }}
          >
            {item.body}
          </p>
        </div>
      </div>

      {/* Accent line on hover */}
      <motion.div
        className="absolute left-0 top-0 h-px w-0 group-hover:w-full"
        style={{ background: 'var(--accent)', transition: 'width 0.5s ease' }}
      />
    </motion.div>
  );
}

export default function AboutSection() {
  const headingRef = useRef<HTMLDivElement>(null);
  const headingInView = useInView(headingRef, { once: true, margin: '-10% 0px' });

  return (
    <section
      id="about"
      className="relative py-24 md:py-36 px-6 md:px-12 lg:px-20"
      style={{ background: 'var(--black)' }}
    >
      <div className="max-w-screen-xl mx-auto">
        {/* Section label */}
        <motion.div
          ref={headingRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headingInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 md:mb-24"
        >
          <p
            className="text-xs tracking-widest uppercase mb-4"
            style={{ color: 'var(--accent)', letterSpacing: '0.25em' }}
          >
            About
          </p>
          <h2
            className="font-light leading-tight text-balance"
            style={{
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              letterSpacing: '-0.02em',
              color: 'var(--white)',
              maxWidth: '700px',
            }}
          >
            Hiring intelligence, elevated to an art form.
          </h2>
        </motion.div>

        {/* Feature list */}
        <div>
          {features.map((item, i) => (
            <FeatureItem key={item.number} item={item} index={i} />
          ))}
          <div
            className="border-t"
            style={{ borderColor: 'var(--border)' }}
          />
        </div>
      </div>
    </section>
  );
}
