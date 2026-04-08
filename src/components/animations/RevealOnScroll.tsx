import { useEffect, useRef, type ReactNode } from 'react';
import { motion, useInView, useAnimation, type Variant } from 'framer-motion';


type AnimationPreset =
  | 'fadeUp'
  | 'fadeDown'
  | 'fadeLeft'
  | 'fadeRight'
  | 'fadeIn'
  | 'scaleUp'
  | 'scaleIn'
  | 'blurIn'
  | 'slideUp'
  | 'slideLeft'
  | 'slideRight'
  | 'rotateIn'
  | 'flipUp';

const presets: Record<AnimationPreset, { hidden: Variant; visible: Variant }> = {
  fadeUp: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  fadeDown: {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0 },
  },
  fadeLeft: {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 },
  },
  fadeRight: {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  scaleUp: {
    hidden: { opacity: 0, scale: 0.85, y: 30 },
    visible: { opacity: 1, scale: 1, y: 0 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  },
  blurIn: {
    hidden: { opacity: 0, filter: 'blur(12px)' },
    visible: { opacity: 1, filter: 'blur(0px)' },
  },
  slideUp: {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: -80 },
    visible: { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: 80 },
    visible: { opacity: 1, x: 0 },
  },
  rotateIn: {
    hidden: { opacity: 0, rotate: -5, scale: 0.95, y: 20 },
    visible: { opacity: 1, rotate: 0, scale: 1, y: 0 },
  },
  flipUp: {
    hidden: { opacity: 0, rotateX: 15, y: 30, transformPerspective: 800 },
    visible: { opacity: 1, rotateX: 0, y: 0, transformPerspective: 800 },
  },
};



interface RevealOnScrollProps {
  children: ReactNode;
  preset?: AnimationPreset;
  delay?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
  once?: boolean;
  threshold?: number;
  staggerChildren?: number;
  as?: 'div' | 'section' | 'span' | 'li' | 'p' | 'h1' | 'h2' | 'h3' | 'h4';
}

export function RevealOnScroll({
  children,
  preset = 'fadeUp',
  delay = 0,
  duration = 0.7,
  className = '',
  style = {},
  once = true,
  threshold = 0.15,
  staggerChildren,
  as = 'div',
}: RevealOnScrollProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  const variants = presets[preset];

  const containerVariants = staggerChildren
    ? {
        hidden: {},
        visible: {
          transition: {
            staggerChildren,
            delayChildren: delay,
          },
        },
      }
    : undefined;

  const MotionComponent = motion[as] as any;

  return (
    <MotionComponent
      ref={ref}
      className={className}
      style={style}
      initial="hidden"
      animate={controls}
      variants={containerVariants || variants}
      transition={
        !staggerChildren
          ? {
              duration,
              delay,
              ease: [0.22, 1, 0.36, 1],
            }
          : undefined
      }
    >
      {children}
    </MotionComponent>
  );
}



interface RevealChildProps {
  children: ReactNode;
  preset?: AnimationPreset;
  duration?: number;
  className?: string;
  as?: 'div' | 'span' | 'li' | 'p';
}

export function RevealChild({
  children,
  preset = 'fadeUp',
  duration = 0.6,
  className = '',
  as = 'div',
}: RevealChildProps) {
  const MotionComponent = motion[as] as any;
  return (
    <MotionComponent
      className={className}
      variants={presets[preset]}
      transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionComponent>
  );
}

/* ─── Parallax on cursor hook ─── */

export function useParallaxCursor(strength: number = 20) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let frameId: number;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      targetX = ((e.clientX - centerX) / (window.innerWidth / 2)) * strength;
      targetY = ((e.clientY - centerY) / (window.innerHeight / 2)) * strength;
    };

    const animate = () => {
      // Direct interpolation for smoothness (0.1 coefficient for heavy inertia)
      x += (targetX - x) * 0.08;
      y += (targetY - y) * 0.08;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      frameId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMove);
    frameId = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(frameId);
    };
  }, [strength]);

  return ref;
}

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let frameId: number;

    const handleMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const animate = () => {
      x += (targetX - x) * 0.12;
      y += (targetY - y) * 0.12;
      glow.style.transform = `translate3d(calc(${x}px - 50%), calc(${y}px - 50%), 0)`;
      frameId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMove);
    frameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed top-0 left-0 w-[600px] h-[600px] rounded-full z-[1] select-none opacity-40 mix-blend-screen overflow-hidden"
      style={{
        background: 'radial-gradient(circle, rgba(75,123,255,0.15) 0%, rgba(75,123,255,0.05) 40%, transparent 70%)',
        filter: 'blur(50px)',
        willChange: 'transform',
      }}
    />
  );
}

/* ─── Magnetic button hook ─── */

export function useMagneticHover(strength: number = 0.3) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    };

    const handleLeave = () => {
      el.style.transform = 'translate(0, 0)';
      el.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
    };

    const handleEnter = () => {
      el.style.transition = 'transform 0.15s ease-out';
    };

    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    el.addEventListener('mouseenter', handleEnter);

    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
      el.removeEventListener('mouseenter', handleEnter);
    };
  }, [strength]);

  return ref;
}

/* ─── Counting number animation ─── */

export function AnimatedCounter({
  target,
  suffix = '',
  prefix = '',
  duration = 2000,
  className = '',
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current || !ref.current) return;
    hasAnimated.current = true;

    const el = ref.current;
    const startTime = performance.now();
    const isDecimal = !Number.isInteger(target);

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out expo
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = eased * target;
      el.textContent = prefix + (isDecimal ? current.toFixed(1) : Math.round(current).toString()) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [isInView, target, suffix, prefix, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}
