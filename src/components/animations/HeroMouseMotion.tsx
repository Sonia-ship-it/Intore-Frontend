import { useEffect, useRef } from 'react';

function prefersReducedMotion() {
  if (typeof window === 'undefined') return true;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

/**
 * Hero mouse-controlled background motion.
 * - Smooth but "real-time": rAF loop w/ small smoothing.
 * - Confined to the hero section container.
 */
export function HeroMouseMotion() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const blobA = useRef<HTMLDivElement | null>(null);
  const blobB = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const container = containerRef.current;
    if (!container) return;

    let raf = 0;
    let tx = container.clientWidth / 2;
    let ty = container.clientHeight / 2;
    let x = tx;
    let y = ty;

    const onMove = (e: PointerEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      tx = e.clientX - rect.left;
      ty = e.clientY - rect.top;
    };

    const loop = () => {
      if (!container) return;
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;

      const a = blobA.current;
      const b = blobB.current;
      if (a) a.style.transform = `translate3d(${x}px, ${y}px, 0) translate3d(-50%, -50%, 0)`;
      if (b) b.style.transform = `translate3d(${(container.clientWidth - x)}px, ${(container.clientHeight - y)}px, 0) translate3d(-50%, -50%, 0)`;

      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-[3] overflow-hidden pointer-events-none">
      <div
        ref={blobA}
        className="hidden md:block absolute w-[620px] h-[620px] rounded-full"
        style={{
          left: 0,
          top: 0,
          background:
            'radial-gradient(circle, rgba(75,123,255,0.22) 0%, rgba(75,123,255,0.10) 30%, rgba(75,123,255,0.03) 52%, transparent 70%)',
          filter: 'blur(34px)',
          willChange: 'transform',
        }}
      />
      <div
        ref={blobB}
        className="hidden md:block absolute w-[820px] h-[820px] rounded-full opacity-80"
        style={{
          left: 0,
          top: 0,
          background:
            'radial-gradient(circle, rgba(45,61,181,0.20) 0%, rgba(30,42,138,0.10) 34%, rgba(10,14,46,0.03) 58%, transparent 74%)',
          filter: 'blur(46px)',
          willChange: 'transform',
          mixBlendMode: 'screen',
        }}
      />
    </div>
  );
}
