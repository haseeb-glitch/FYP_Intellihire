'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import card1Img from '../Feature-cards/cards1.jpeg';
import card2Img from '../Feature-cards/cards2.jpeg';
import card3Img from '../Feature-cards/cards3.jpeg';

const CW = 440; 
const CH = 270; 
const GAP = 20; 

const GRID_POS = [
  { col: 0, row: 0 }, // c1: top-left
  { col: 1, row: 0 }, // c2: top-right
  { col: 0, row: 1 }, // c3: bottom-left
  { col: 1, row: 1 }, // c4: bottom-right
];

const STACK_OFFSET = [
  { dx: 40, dy: 30, rot: -2, sc: 1.00, z: 4 },
  { dx: 48, dy: 38, rot: 3, sc: 0.97, z: 3 },
  { dx: 34, dy: 46, rot: -5, sc: 0.94, z: 2 },
  { dx: 52, dy: 54, rot: 6, sc: 0.91, z: 1 },
];

export default function AnimatedCards() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRightRef = useRef<HTMLDivElement>(null);
  const gridAnchorRef = useRef<HTMLDivElement>(null);
  const sectionLabelRef = useRef<HTMLDivElement>(null);
  
  const cardRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null)
  ];

  const isLandedRef = useRef(false);

  useEffect(() => {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
    const ease = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const update = () => {
      if (!heroRightRef.current || !gridAnchorRef.current) return;

      const vh = window.innerHeight;
      const heroRect = heroRightRef.current.getBoundingClientRect();
      const gridRect = gridAnchorRef.current.getBoundingClientRect();

      const sc = {
        x: heroRect.left + heroRect.width / 2 - CW / 2,
        y: heroRect.top + heroRect.height / 2 - CH / 2
      };

      const ga = { x: gridRect.left, y: gridRect.top };

      // Expanded trigger zone: 
      // start animation when grid top is at the bottom of viewport (vh)
      // end animation when grid top is almost at the top (vh * 0.05)
      const triggerStart = vh; 
      const triggerEnd = vh * 0.05;

      const raw = clamp((triggerStart - ga.y) / (triggerStart - triggerEnd), 0, 1);
      const t = ease(raw);

      // Handle Landed State (scrolling down into the grid)
      // We use a small epsilon to avoid jitter at the boundary
      if (t >= 0.999) {
        if (!isLandedRef.current) {
          isLandedRef.current = true;
          cardRefs.forEach((ref, i) => {
            const card = ref.current;
            if (!card) return;
            const gp = GRID_POS[i];
            card.style.position = 'absolute';
            card.style.left = (gp.col * (CW + GAP)) + 'px';
            card.style.top = (gp.row * (CH + GAP)) + 'px';
            card.style.transform = 'none';
            card.style.zIndex = '10';
            card.classList.add('landed');
            gridAnchorRef.current?.appendChild(card);
          });
        }
      } 
      // Handle Transition/Stacked State (scrolling up or in between)
      else {
        if (isLandedRef.current) {
          isLandedRef.current = false;
          cardRefs.forEach((ref) => {
            const card = ref.current;
            if (!card) return;
            card.classList.remove('landed');
            card.style.position = 'fixed';
            document.body.appendChild(card);
          });
        }

        cardRefs.forEach((ref, i) => {
          const card = ref.current;
          if (!card) return;
          const sp = STACK_OFFSET[i];
          const gp = GRID_POS[i];

          // Stack position (fixed coords on screen)
          const stackX = sc.x + sp.dx;
          const stackY = sc.y + sp.dy;

          // Target position: where this card sits in the grid (screen coords)
          const gridX = ga.x + gp.col * (CW + GAP);
          const gridY = ga.y + gp.row * (CH + GAP);

          // Interpolate everything based on scroll progress 't'
          const x = lerp(stackX, gridX, t);
          const y = lerp(stackY, gridY, t);
          const rot = lerp(sp.rot, 0, t);
          const sc2 = lerp(sp.sc, 1, t);

          card.style.left = x + 'px';
          card.style.top = y + 'px';
          card.style.transform = `rotate(${rot}deg) scale(${sc2})`;
          // Use high z-index to stay above page content during animation
          card.style.zIndex = (t < 0.5 ? (1000 + sp.z) : (1000 + 10 - i)).toString();
          
          // Cards are visible throughout the animation and in the stack
          // Only fade out if they are truly off-screen to the top
          const opacity = (ga.y < vh * 2) ? 1 : 0; 
          card.style.opacity = opacity.toString();
          card.style.visibility = opacity > 0 ? 'visible' : 'hidden';
        });
      }

      requestAnimationFrame(update);
    };

    const rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <>
      <style jsx global>{`
        :root {
          --bg-card: #d6e8f7;
          --blue-card: #3d82c4;
          --navy-card: #0c1b2e;
          --muted-card: #6b8fad;
          --card-shadow: 0 28px 80px rgba(30,90,160,0.20);
        }

        .card {
          position: fixed;
          width: 440px;
          height: 270px;
          border-radius: 24px;
          overflow: hidden;
          will-change: transform, top, left;
          box-shadow: var(--card-shadow);
          cursor: default;
          opacity: 0;
          pointer-events: auto;
          z-index: 100;
        }
        .card.landed {
          position: absolute;
          pointer-events: auto;
          transition: box-shadow 0.3s;
        }
        .card.landed:hover {
          box-shadow: 0 40px 100px rgba(30,90,160,0.3);
          transform: translateY(-4px) !important;
          transition: box-shadow 0.3s, transform 0.3s;
        }

        /* Card 1 & 2 & 4 */
        #c1 .ci, #c2 .ci, #c4 .ci { position:relative; width:100%; height:100%; display:flex; flex-direction:column; justify-content:flex-end; }
        #c1 .cam, #c2 .cam, #c4 .cam { position:absolute; inset:0; overflow:hidden; background:#0a1828; z-index:0; }
        #c1 .cam img, #c2 .cam img, #c4 .cam img { width:100%; height:100%; object-fit:cover; opacity:1; transition: transform 0.5s ease; }
        #c1:hover .cam img, #c2:hover .cam img, #c4:hover .cam img { transform: scale(1.05); }
        #c1 .cam-ov, #c2 .cam-ov, #c4 .cam-ov { position:absolute; inset:0; background:linear-gradient(to bottom,transparent 30%,#0a1828 100%); opacity:0; transition:opacity 0.4s ease; pointer-events:none; }
        #c1:hover .cam-ov, #c2:hover .cam-ov, #c4:hover .cam-ov { opacity:0.9; }
        #c1 .cf, #c2 .cf, #c4 .cf { padding:0 14px 16px; display:flex; align-items:center; justify-content:space-between; position:relative; z-index:1; opacity:0; transform:translateY(10px); transition:all 0.4s ease; pointer-events:none; }
        #c1:hover .cf, #c2:hover .cf, #c4:hover .cf { opacity:1; transform:translateY(0); }
        #c1 .cf .t, #c2 .cf .t, #c4 .cf .t { font-family:'Sora',sans-serif; font-size:18px; font-weight:700; color:white; }
        #c1 .cf .s, #c2 .cf .s, #c4 .cf .s { font-size:16px; font-weight:600; color:#22c55e; background:rgba(34,197,94,.15); padding:4px 12px; border-radius:20px; }

        /* Card 3 */
        #c3 .ci  { background:linear-gradient(145deg,#e8f4fd,#c2dcf5); padding:18px; width:100%; height:100%; display:flex; flex-direction:column; }
        #c3 .rh  { display:flex; align-items:center; gap:16px; margin-bottom:20px; }
        #c3 .av  { width:54px; height:54px; border-radius:50%; overflow:hidden; border:2px solid var(--blue-card); flex-shrink:0; }
        #c3 .av img { width:100%; height:100%; object-fit:cover; }
        #c3 .rn  { font-family:'Sora',sans-serif; font-size:18px; font-weight:700; color:var(--navy-card); }
        #c3 .rr  { font-size:14px; color:var(--muted-card); }
        #c3 .sr  { margin-left:auto; width:64px; height:64px; position:relative; }
        #c3 .sr svg { transform:rotate(-90deg); width: 64px; height: 64px; }
        #c3 .rb  { fill:none; stroke:#c2dcf5; stroke-width:4; }
        #c3 .rf  { fill:none; stroke:var(--blue-card); stroke-width:4; stroke-linecap:round; stroke-dasharray:113; stroke-dashoffset:28; animation:ring-fill 1.4s cubic-bezier(.16,1,.3,1) forwards; }
        @keyframes ring-fill { from{stroke-dashoffset:113} }
        #c3 .rl  { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-family:'Sora',sans-serif; font-size:16px; font-weight:800; color:var(--blue-card); }
        #c3 .st  { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:20px; }
        #c3 .tg  { font-size:14px; font-weight:600; padding:4px 14px; border-radius:20px; background:rgba(61,130,196,0.12); color:var(--blue-card); border:1px solid rgba(61,130,196,0.25); }
        #c3 .tg.g { background:rgba(34,197,94,.1); color:#16a34a; border-color:rgba(34,197,94,.25); }
        #c3 .pb  { display:flex; flex-direction:column; gap:10px; }
        #c3 .pr  { display:flex; align-items:center; gap:12px; }
        #c3 .pl  { font-size:14px; color:var(--muted-card); font-weight:600; width:90px; flex-shrink:0; }
        #c3 .pt  { flex:1; height:8px; background:#c2dcf5; border-radius:4px; overflow:hidden; }
        #c3 .pf  { height:100%; border-radius:4px; animation:bg-fill 1.2s cubic-bezier(.16,1,.3,1) forwards; }



        .cbadge { position:absolute; bottom:12px; right:12px; background:rgba(255,255,255,.92); backdrop-filter:blur(8px); border-radius:999px; padding:4px 10px; font-family:'Sora',sans-serif; font-size:10px; font-weight:700; color:var(--blue-card); display:flex; align-items:center; gap:4px; z-index:5; }

        .clabel {
          position: absolute;
          bottom: -50px;
          left: 0;
          opacity: 0;
          transition: opacity 0.5s ease;
        }
        .clabel .cn { font-family:'Sora',sans-serif; font-size:18px; font-weight:700; color:var(--navy-card); }
        .clabel .cs { font-size:14px; color:var(--muted-card); }
        .card.landed .clabel { opacity: 1; }

        .section-label {
          display: none;
        }
      `}</style>

      {/* Grid Anchor Section */}
      <section className="relative w-full pt-0 px-[6vw] flex justify-center" style={{ paddingBottom: '40px' }}>
        <div ref={gridAnchorRef} className="card-grid-anchor relative" style={{ width: '900px', height: '560px', marginLeft: '-40px' }}>
          {/* Hero Right spacer */}
          <div ref={heroRightRef} className="absolute -top-[96vh] right-0 w-[45%] h-[560px] pointer-events-none" />
        </div>
      </section>

      {/* The 4 Cards */}
      <div ref={cardRefs[0]} className="card" id="c1">
        <div className="ci">
          <div className="cam">
            <img src={card1Img.src} alt="" />
            <div className="cam-ov"></div>
          </div>
          <div className="cf"><div className="t">Mock Interview</div><div className="s">Score: 87%</div></div>
        </div>
        <div className="clabel"><div className="cn">Mock Interview</div><div className="cs">AI-Powered Simulation</div></div>
      </div>

      <div ref={cardRefs[1]} className="card" id="c2">
        <div className="ci">
          <div className="cam">
            <img src={card2Img.src} alt="" />
            <div className="cam-ov"></div>
          </div>
          <div className="cf"><div className="t">Emotion Analysis</div></div>
        </div>
        <div className="clabel"><div className="cn">Emotion Analysis</div><div className="cs">Real-time Detection</div></div>
      </div>

      <div ref={cardRefs[2]} className="card" id="c3">
        <div className="ci">
          <div className="rh">
            <div className="av"><img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&q=80" alt="" /></div>
            <div><div className="rn">Sarah Johnson</div><div className="rr">Frontend Engineer · 3 yrs exp</div></div>
            <div className="sr">
              <svg viewBox="0 0 40 40" width="48" height="48">
                <circle className="rb" cx="20" cy="20" r="18"/>
                <circle className="rf" cx="20" cy="20" r="18"/>
              </svg>
              <div className="rl">92</div>
            </div>
          </div>
          <div className="st">
            <span className="tg g">React ✓</span><span className="tg g">TypeScript ✓</span>
            <span className="tg">Node.js</span><span className="tg">AWS</span><span className="tg g">Figma ✓</span>
          </div>
          <div className="pb">
            <div className="pr"><span className="pl">Technical</span><div className="pt"><div className="pf" style={{width:'88%',background:'#3d82c4'}}></div></div></div>
            <div className="pr"><span className="pl">Communication</span><div className="pt"><div className="pf" style={{width:'75%',background:'#22c55e'}}></div></div></div>
            <div className="pr"><span className="pl">Leadership</span><div className="pt"><div className="pf" style={{width:'62%',background:'#f59e0b'}}></div></div></div>
          </div>
        </div>
        <div className="cbadge"><span>✦</span> Intellihire</div>
        <div className="clabel"><div className="cn">Resume Review</div><div className="cs">Smart Evaluation</div></div>
      </div>

      <div ref={cardRefs[3]} className="card" id="c4">
        <div className="ci">
          <div className="cam">
            <img src={card3Img.src} alt="" />
            <div className="cam-ov"></div>
          </div>
          <div className="cf"><div className="t">Your Career Roadmap</div></div>
        </div>
        <div className="clabel"><div className="cn">Career Roadmap</div><div className="cs">Personalized Guidance</div></div>
      </div>
    </>
  );
}
