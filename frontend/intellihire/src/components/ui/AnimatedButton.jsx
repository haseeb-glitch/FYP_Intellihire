import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

const variants = {
  primary:
    'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/35 hover:from-primary-600 hover:to-primary-700',
  secondary:
    'bg-white text-slate-800 shadow-sm shadow-slate-200/80 border border-[#D6E7F7] hover:bg-primary-50 hover:border-primary-300 hover:shadow-md hover:shadow-primary-100/50',
  outline:
    'bg-transparent text-slate-700 border border-slate-200 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/60',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100/70 hover:text-slate-900',
  danger:
    'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/35',
};

export const AnimatedButton = ({
  children,
  className,
  variant = 'primary',
  icon: Icon,
  to,
  onClick,
  disabled,
  type,
  ...props
}) => {
  const base =
    'relative inline-flex h-[42px] items-center justify-center rounded-xl px-5 text-sm font-semibold transition-all duration-200 gap-2 overflow-hidden group cursor-pointer select-none';

  const cls = cn(base, variants[variant], disabled && 'opacity-55 pointer-events-none', className);

  const motionProps = {
    whileHover: { scale: 1.03 },
    whileTap:   { scale: 0.97 },
    transition: { type: 'spring', stiffness: 420, damping: 22 },
  };

  const inner = (
    <>
      {/* Shine sweep on primary */}
      {(variant === 'primary' || variant === 'danger') && (
        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/18 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-600 ease-in-out pointer-events-none" />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {children}
        {Icon && (
          <Icon className="w-4 h-4 transition-transform group-hover:translate-x-0.5 duration-200" />
        )}
      </span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cls} {...props}>
        {inner}
      </Link>
    );
  }

  return (
    <motion.button
      type={type || 'button'}
      onClick={onClick}
      disabled={disabled}
      className={cls}
      {...motionProps}
      {...props}
    >
      {inner}
    </motion.button>
  );
};
