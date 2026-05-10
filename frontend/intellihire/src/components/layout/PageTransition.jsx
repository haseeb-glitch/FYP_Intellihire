import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 24,
    filter: 'blur(10px)',
    scale: 0.988,
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    scale: 1,
    transition: {
      duration: 0.60,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -16,
    filter: 'blur(8px)',
    scale: 0.992,
    transition: {
      duration: 0.38,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const PageTransition = ({ children, className = '' }) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        'w-full min-h-screen pt-16 pb-20 px-4 sm:px-6 lg:px-8 relative z-10',
        className
      )}
    >
      {children}
    </motion.div>
  );
};
