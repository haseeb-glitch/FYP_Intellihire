import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export const BlurBackground = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 20, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 20, damping: 30 });

  useEffect(() => {
    const handle = (e) => {
      const { innerWidth, innerHeight } = window;
      mouseX.set((e.clientX / innerWidth - 0.5) * 40);
      mouseY.set((e.clientY / innerHeight - 0.5) * 40);
    };
    window.addEventListener('mousemove', handle, { passive: true });
    return () => window.removeEventListener('mousemove', handle);
  }, [mouseX, mouseY]);

  return (
    <div
      className="fixed inset-0 z-[-1] overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #F5F8FC 0%, #EDF3FB 50%, #F0F5FA 100%)' }}
    >
      {/* Primary brand blob — top-left */}
      <motion.div
        className="absolute top-[-12%] left-[-8%] w-[65vw] h-[65vw] max-w-[900px] max-h-[900px] rounded-full"
        aria-hidden="true"
        animate={{ x: [0, 60, -30, 0], y: [0, -40, 60, 0], scale: [1, 1.10, 0.92, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle, rgba(214,231,247,0.55) 0%, rgba(214,231,247,0) 70%)',
          filter: 'blur(80px)',
          x: springX,
          y: springY,
        }}
      />

      {/* Secondary blue blob — bottom-right */}
      <motion.div
        className="absolute bottom-[-8%] right-[-10%] w-[60vw] h-[60vw] max-w-[820px] max-h-[820px] rounded-full"
        aria-hidden="true"
        animate={{ x: [0, -80, 40, 0], y: [0, 50, -70, 0], scale: [1, 1.08, 0.94, 1] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle, rgba(147,197,253,0.32) 0%, rgba(147,197,253,0) 68%)',
          filter: 'blur(90px)',
          x: springX,
          y: springY,
        }}
      />

      {/* Accent blue-cyan blob — center */}
      <motion.div
        className="absolute top-[35%] left-[28%] w-[50vw] h-[50vw] max-w-[680px] max-h-[680px] rounded-full"
        aria-hidden="true"
        animate={{ x: [0, 50, -60, 0], y: [0, 80, -40, 0], scale: [0.92, 1.12, 1.0, 0.92] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle, rgba(191,219,254,0.28) 0%, rgba(191,219,254,0) 70%)',
          filter: 'blur(100px)',
          x: springX,
          y: springY,
        }}
      />

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: 'radial-gradient(circle, #c7d8ec 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 100%)',
        }}
      />
    </div>
  );
};
