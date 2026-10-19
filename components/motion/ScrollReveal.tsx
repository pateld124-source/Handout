'use client';
import { useEffect, useRef, ReactNode, CSSProperties } from 'react';

type RevealDirection = 'up' | 'left' | 'right' | 'scale' | 'fade';

interface ScrollRevealProps {
  children: ReactNode;
  direction?: RevealDirection;
  delay?: number;
  duration?: number;
  distance?: number;
  threshold?: number;
  once?: boolean;
  className?: string;
  style?: CSSProperties;
  as?: keyof React.JSX.IntrinsicElements;
}

const hiddenTransforms: Record<RevealDirection, string> = {
  up:    'translateY(40px)',
  left:  'translateX(-36px)',
  right: 'translateX(36px)',
  scale: 'scale(0.93)',
  fade:  'translateY(0)',
};

export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 750,
  distance = 40,
  threshold = 0.12,
  once = true,
  className = '',
  style = {},
  as: Tag = 'div',
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const initial = direction === 'up'    ? `translateY(${distance}px)` :
                    direction === 'left'  ? `translateX(-${distance}px)` :
                    direction === 'right' ? `translateX(${distance}px)` :
                    direction === 'scale' ? 'scale(0.93)' :
                    'translateY(0)';

    el.style.opacity = '0';
    el.style.transform = initial;
    el.style.transition = `opacity ${duration}ms ease ${delay}ms, transform ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'none';
          if (once) obs.disconnect();
        } else if (!once) {
          el.style.opacity = '0';
          el.style.transform = initial;
        }
      },
      { threshold }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [direction, delay, duration, distance, threshold, once]);

  return (
    // @ts-ignore
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}

// Stagger children with sequential delays
export function StaggerReveal({
  children,
  staggerDelay = 80,
  baseDelay = 0,
  direction = 'up',
  className = '',
}: {
  children: ReactNode[];
  staggerDelay?: number;
  baseDelay?: number;
  direction?: RevealDirection;
  className?: string;
}) {
  return (
    <div className={className}>
      {(children as ReactNode[]).map((child, i) => (
        <ScrollReveal key={i} direction={direction} delay={baseDelay + i * staggerDelay}>
          {child}
        </ScrollReveal>
      ))}
    </div>
  );
}

// Counter that animates when in view
export function CountUp({
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
  const hasRun = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasRun.current) {
        hasRun.current = true;
        const start = Date.now();
        const tick = () => {
          const progress = Math.min((Date.now() - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = prefix + Math.floor(eased * target).toLocaleString() + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        };
        tick();
        obs.disconnect();
      }
    }, { threshold: 0.3 });

    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration, suffix, prefix]);

  return <span ref={ref} className={className}>{prefix}0{suffix}</span>;
}
