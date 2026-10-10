import React, { useLayoutEffect, useRef, useState } from 'react';

export const overflowDistance = (contentWidth: number, availableWidth: number) =>
  Math.max(0, contentWidth - availableWidth);

type Props = {
  children: string;
  className?: string;
  enabled?: boolean;
};

export function OverflowLabel({ children, className = '', enabled = true }: Props) {
  const container = useRef<HTMLSpanElement>(null);
  const [distance, setDistance] = useState(0);

  useLayoutEffect(() => {
    const node = container.current;
    if (!node) return;
    const measure = () => setDistance(overflowDistance(node.scrollWidth, node.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [children]);

  const scrolling = enabled && distance > 0;
  const duration = Math.max(4, Math.min(16, distance / 28 + 2));
  return (
    <span ref={container} className={`overflow-label ${className}`} title={children}>
      <span
        className={scrolling ? 'overflow-label-text overflow-label-scroll' : 'overflow-label-text'}
        style={
          scrolling
            ? ({
                '--overflow-label-distance': `${distance}px`,
                animationDuration: `${duration}s`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {children}
      </span>
    </span>
  );
}
