import React, { useState } from 'react';
import { PageTransition } from '../components/layout/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Building2, Star } from 'lucide-react';

const PLANS = [
  {
    name: 'Free', icon: Star, description: 'Explore the platform with no commitment.',
    monthly: 0, yearly: 0, cta: 'Get Started', to: '/signup', popular: false,
    features: ['1 AI Mock Interview / month', 'Basic performance feedback', 'Standard AI Coach', 'Community support'],
  },
  {
    name: 'Pro', icon: Zap, description: 'Everything you need to land your dream job.',
    monthly: 29, yearly: 24, cta: 'Start Free Trial', to: '/signup', popular: true,
    features: ['Unlimited AI Mock Interviews', 'Advanced analytics & radar charts', 'Personalised career roadmap', 'Priority 24/7 AI Coach', 'Resume & Cover Letter review', 'Video body-language analysis'],
  },
  {
    name: 'Enterprise', icon: Building2, description: 'For bootcamps, universities & teams.',
    monthly: 99, yearly: 89, cta: 'Contact Sales', to: '/signup', popular: false,
    features: ['Custom interview scenarios', 'Admin dashboard & reporting', 'API access & integration', 'Dedicated account manager', 'White-labelling options', 'SSO & security controls'],
  },
];

const FAQ = [
  { q: 'Is there a free trial for Pro?', a: 'Yes — all Pro features are free for 7 days, no credit card required.' },
  { q: 'Can I cancel anytime?', a: 'Absolutely. Cancel from your billing settings at any time with no penalty.' },
  { q: 'What interview formats are supported?', a: 'Video, voice, and text modes. All three are available on every plan.' },
];

export const Pricing = () => {
  const [isYearly, setIsYearly] = useState(true);
  const [openFaq, setOpenFaq]   = useState(null);

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto py-8">

        {/* Header */}
        <div className="text-center mb-14">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl lg:text-5xl font-bold mb-5">
            Simple, Transparent Pricing
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-slate-500 text-lg max-w-2xl mx-auto mb-8">
            Invest in your career. Cancel anytime.
          </motion.p>

          {/* Toggle */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-1.5 p-1.5 bg-white/70 backdrop-blur-md rounded-full border border-white/80 shadow-sm"
          >
            {['Monthly', 'Yearly'].map((label, i) => {
              const active = (label === 'Yearly') === isYearly;
              return (
                <button key={label} onClick={() => setIsYearly(label === 'Yearly')}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${active ? 'bg-primary-500 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {label}
                  {label === 'Yearly' && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${active ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-600'}`}>
                      Save 20%
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-center relative mb-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[70%] bg-primary-200/20 blur-[100px] rounded-full pointer-events-none" />

          {PLANS.map((plan, i) => (
            <GlassCard
              key={i} delay={0.1 + i * 0.1}
              hover={!plan.popular}
              glow={plan.popular}
              className={`flex flex-col p-8 relative z-10 ${plan.popular ? 'scale-[1.04] border-primary-200 bg-white/85' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-primary-400 to-primary-600 text-white text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg shadow-primary-500/30">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.popular ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-slate-100 text-slate-600'}`}>
                  <plan.icon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
              </div>

              <p className="text-sm text-slate-500 mb-6 min-h-[40px]">{plan.description}</p>

              <div className="mb-8">
                <AnimatePresence mode="wait">
                  <motion.div key={isYearly ? 'yr' : 'mo'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <span className="text-5xl font-bold text-slate-900">${isYearly ? plan.yearly : plan.monthly}</span>
                    <span className="text-slate-400 text-sm">/mo</span>
                  </motion.div>
                </AnimatePresence>
                {isYearly && plan.monthly > 0 && (
                  <p className="text-xs text-slate-400 mt-1">Billed ${plan.yearly * 12}/yr · Save ${(plan.monthly - plan.yearly) * 12}</p>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-3 text-sm text-slate-700">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${plan.popular ? 'bg-primary-100' : 'bg-slate-100'}`}>
                      <Check className={`w-3 h-3 ${plan.popular ? 'text-primary-600' : 'text-slate-600'}`} />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <AnimatedButton to={plan.to} variant={plan.popular ? 'primary' : 'outline'} className="w-full">
                {plan.cta}
              </AnimatedButton>
            </GlassCard>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <GlassCard key={i} delay={i * 0.08} className="!p-0 overflow-hidden" hover={false}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className="font-semibold text-slate-800 text-sm">{item.q}</span>
                  <motion.span animate={{ rotate: openFaq === i ? 45 : 0 }} className="text-slate-400 text-xl font-light ml-4 shrink-0">+</motion.span>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <p className="px-6 pb-4 text-sm text-slate-500 leading-relaxed">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            ))}
          </div>
        </div>

      </div>
    </PageTransition>
  );
};
