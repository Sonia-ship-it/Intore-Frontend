import { useEffect, useRef } from 'react';

function prefersReducedMotion() {
  if (typeof window === 'undefined') return true;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

/**
 * Global mouse-controlled background motion.
 * - Smooth but "real-time": rAF loop w/ small smoothing.
 * - Works across the whole app (fixed layers).
 * - No transforms are applied to app content (only background layers).
 */
export function GlobalMouseMotion() {
  const blobA = useRef<HTMLDivElement | null>(null);
  const blobB = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };

    const loop = () => {
      // Faster than before: feels "locked" but still premium smooth
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;

      const a = blobA.current;
      const b = blobB.current;
      if (a) a.style.transform = `translate3d(${x}px, ${y}px, 0) translate3d(-50%, -50%, 0)`;
      if (b) b.style.transform = `translate3d(${(window.innerWidth - x)}px, ${(window.innerHeight - y)}px, 0) translate3d(-50%, -50%, 0)`;

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
    <div className="pointer-events-none fixed inset-0 z-[5]">
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

