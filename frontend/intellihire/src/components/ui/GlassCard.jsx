import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export const GlassCard = ({ children, className, hover = true, delay = 0, glow = false, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-36px' }}
      transition={{ duration: 0.58, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? {
        scale: 1.018,
        y: -4,
        transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
      } : {}}
      className={cn(
        'glass-card rounded-2xl relative overflow-hidden group',
        glow && 'glow-card',
        className
      )}
      {...props}
    >
      {/* Top inset highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />

      {/* Hover shimmer sweep */}
      {hover && (
        <div
          className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/18 to-white/0 opacity-0 group-hover:opacity-100 pointer-events-none"
          style={{ transition: 'opacity 0.45s ease' }}
        />
      )}

      {children}
    </motion.div>
  );
};
