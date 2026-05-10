import React from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { motion } from 'framer-motion';
import { Building2, Cpu, Users, Map, ArrowRight, CheckCircle2 } from 'lucide-react';

const STEPS = [
  {
    n: '01', icon: Building2, title: 'Choose Company & Role',
    color: 'from-blue-400 to-blue-600',
    body: 'Select from 50+ top companies and hundreds of roles. IntelliHire tailors question difficulty, interviewer persona, and evaluation rubrics to match each company\'s real hiring bar.',
    bullets: ['Company-specific question banks', 'Role-calibrated difficulty', 'Industry-tuned evaluation'],
  },
  {
    n: '02', icon: Cpu, title: 'Start AI Interview',
    color: 'from-primary-400 to-primary-600',
    body: 'Go live with a realistic AI recruiter in video, voice, or text mode. Emotion detection and real-time language analysis run throughout the session.',
    bullets: ['Video, voice, or text modes', 'Live emotion & tone analysis', 'Adaptive follow-up questions'],
  },
  {
    n: '03', icon: Users, title: 'Multi-Agent Feedback',
    color: 'from-violet-400 to-violet-600',
    body: 'Three independent AI judges — Technical, Behavioural, and Confidence analysts — score your session from different angles to eliminate bias.',
    bullets: ['3 independent AI judges', 'Bias-free objective scoring', 'Detailed per-metric breakdown'],
  },
  {
    n: '04', icon: Map, title: 'View Your Roadmap',
    color: 'from-emerald-400 to-emerald-600',
    body: 'Receive a personalised improvement plan with skill gaps identified, learning resources linked, and next-interview targets set for you automatically.',
    bullets: ['Skill gap identification', 'Curated learning resources', 'Next-session auto-scheduling'],
  },
];

export const HowItWorks = () => (
  <PageTransition>
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="text-center mb-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full bg-primary-50 border border-primary-200/60 text-primary-700 text-sm font-medium"
        >
          How It Works
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-4xl lg:text-5xl font-bold mb-5"
        >
          From nervous to hired — <br className="hidden sm:block" />
          <span className="text-gradient">in 4 steps</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="text-slate-500 text-lg max-w-2xl mx-auto"
        >
          IntelliHire's pipeline is designed to replicate the real interview experience as closely as possible, then give you surgical feedback to improve fast.
        </motion.p>
      </div>

      {/* Steps */}
      <div className="relative space-y-8">
        {/* Vertical connector */}
        <div className="absolute left-[28px] top-14 bottom-14 w-0.5 bg-gradient-to-b from-blue-300 via-primary-300 via-violet-300 to-emerald-300 hidden lg:block" />

        {STEPS.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col lg:flex-row gap-6"
          >
            {/* Step circle */}
            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shrink-0 shadow-xl text-white font-bold text-lg z-10 self-start`}>
              {step.n}
            </div>

            {/* Content card */}
            <GlassCard className="flex-1 p-7 lg:p-8" delay={i * 0.1}>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shrink-0 shadow-lg`}>
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-3">{step.title}</h2>
                  <p className="text-slate-500 leading-relaxed mb-5">{step.body}</p>
                  <ul className="space-y-2.5">
                    {step.bullets.map(b => (
                      <li key={b} className="flex items-center gap-3 text-sm text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-primary-500 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ delay: 0.2 }}
        className="mt-20"
      >
        <GlassCard hover={false} glow className="p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-slate-500 mb-8 max-w-lg mx-auto">It takes less than 2 minutes to set up your first AI mock interview.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <AnimatedButton to="/setup" variant="primary" icon={ArrowRight} className="px-10">
              Start Free Interview
            </AnimatedButton>
            <AnimatedButton to="/pricing" variant="secondary">
              View Pricing
            </AnimatedButton>
          </div>
        </GlassCard>
      </motion.div>

    </div>
  </PageTransition>
);
