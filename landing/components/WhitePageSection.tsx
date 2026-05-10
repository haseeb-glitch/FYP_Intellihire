'use client';

import { motion } from 'framer-motion';
import AnimatedCards from './AnimatedCards';

export default function WhitePageSection() {
  const containerVariants = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
    show: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 1, ease: [0.16, 1, 0.3, 1] }
    },
  };

  return (
    <div id="features" className="w-full bg-[#d6e8f7]">
      {/* Original Content Section */}
      <div className="w-full" style={{ paddingLeft: 'max(4rem, 10vw)', paddingRight: 'max(4rem, 10vw)', paddingTop: 'max(4rem, 10vw)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Side: Text Content */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col items-start justify-center max-w-xl"
            >

              {/* Heading */}
              <h2 className="text-[4rem] md:text-[5rem] font-bold tracking-tighter leading-[1.05] mb-8 font-['Sora']">
                <motion.div variants={itemVariants}>
                  <span className="text-[#3d82c4]">
                    AI Interview &
                  </span>
                </motion.div>
                <motion.div variants={itemVariants} className="text-[#0c1b2e]">
                  Preparation Platform.
                </motion.div>
              </h2>

              {/* Subtext */}
              <motion.p
                variants={itemVariants}
                className="text-[1.15rem] leading-[1.6] mb-12 text-[#6b8fad]"
              >
                <strong className="text-[#0c1b2e] font-bold">Intellihire uses Multi-agent AI recruiter, emotion detection, real-time evaluation</strong>{' '}
                <span className="font-medium">
                  , and personalised career guidance to help you land your dream role.
                </span>
              </motion.p>

            </motion.div>

            {/* Right Side: Spacer for the cards to "stack" over */}
            <div className="hidden lg:block relative h-[540px]" />
          </div>
        </div>
      </div>

      {/* New Animated Cards Grid Section */}
      <AnimatedCards />
    </div>
  );
}
