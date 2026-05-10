'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useImagePreloader } from '@/hooks/useImagePreloader';

const TOTAL_FRAMES = 240;

const getFrameUrl = (index: number) =>
  `/images/(${index + 1}).jpg`;

export default function HeroScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentFrameRef = useRef(0);
  const rafRef = useRef<number>(0);

  const { images, loaded, progress } = useImagePreloader(TOTAL_FRAMES, getFrameUrl);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const drawFrame = useCallback(
    (frameIndex: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = images[frameIndex];
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const { width, height } = canvas;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = width / height;

      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

      if (imgAspect > canvasAspect) {
        sw = img.naturalHeight * canvasAspect;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        sh = img.naturalWidth / canvasAspect;
        sy = (img.naturalHeight - sh) / 2;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
    },
    [images]
  );

  // Resize canvas to window
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawFrame(currentFrameRef.current);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [drawFrame]);

  // Draw first frame once loaded
  useEffect(() => {
    if (loaded && images[0]) {
      drawFrame(0);
    }
  }, [loaded, images, drawFrame]);

  // Drive canvas from scroll progress
  useEffect(() => {
    return scrollYProgress.on('change', (latest) => {
      const frameIndex = Math.min(
        Math.floor(latest * (TOTAL_FRAMES - 1)),
        TOTAL_FRAMES - 1
      );

      if (frameIndex === currentFrameRef.current) return;
      currentFrameRef.current = frameIndex;

      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => drawFrame(frameIndex));
    });
  }, [scrollYProgress, drawFrame]);

  return (
    <div ref={containerRef} className="relative" style={{ height: '400vh' }}>
      {/* Sticky canvas container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ display: 'block' }}
        />

        {/* Dark gradient overlays */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(5,5,5,0.35) 0%, transparent 30%, transparent 65%, rgba(5,5,5,0.7) 100%)',
          }}
        />

        {/* Loading progress bar */}
        {!loaded && (
          <div className="absolute bottom-0 left-0 h-px w-full" style={{ background: 'var(--border)' }}>
            <motion.div
              className="h-full"
              style={{
                background: 'var(--accent)',
                width: `${progress * 100}%`,
                transition: 'width 0.1s linear',
              }}
            />
          </div>
        )}

        {/* Hero text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.div
            style={{
              opacity: useTransform(scrollYProgress, [0, 0.15, 1], [1, 0, 0]),
              filter: useTransform(scrollYProgress, [0, 0.15, 1], ['blur(0px)', 'blur(16px)', 'blur(16px)']),
              y: useTransform(scrollYProgress, [0, 0.15, 0.151, 1], [0, -80, -1500, -1500]),
            }}
            className="text-center px-6"
          >
            <h1
              className="leading-none text-balance"
              style={{
                fontFamily: "var(--font-league-spartan), sans-serif",
                fontWeight: 500,
                fontSize: "clamp(2.5rem, 7vw, 7rem)",
                letterSpacing: "-0.02em",
                color: "#ffffff",
                textShadow: "0 4px 60px rgba(0,0,0,0.8), 0 2px 20px rgba(0,0,0,0.8)",
              }}
            >
              Every Hire,
              <br />
              Precisely Chosen.
            </h1>
          </motion.div>
        </div>
      </div>
      
      {/* Smooth blend gradient at the absolute bottom of the 400vh scroll container */}
      <div className="absolute bottom-0 left-0 right-0 h-[80vh] bg-gradient-to-t from-[#d6e8f7] via-[#d6e8f7]/70 to-transparent pointer-events-none z-10" />
    </div>
  );
}
