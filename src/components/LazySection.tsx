import { useEffect, useRef, useState, type ReactNode } from 'react';

interface LazySectionProps {
  children: ReactNode;
  /** Placeholder height while the section is offscreen (px). */
  minHeight?: number;
}

/**
 * Renders children only when the section scrolls near the viewport,
 * keeping the initial page light. A sized placeholder prevents layout jumps.
 */
export const LazySection = ({ children, minHeight = 320 }: LazySectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '800px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={ref}>
      {visible ? children : <div style={{ minHeight }} aria-hidden="true" />}
    </div>
  );
};
