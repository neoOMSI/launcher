import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface Tip {
  text: string;
  x: number;
  y: number;
  below: boolean;
}

const DELAY = 250;
const WARM = 500;
const EDGE = 8;

function adopt(el: HTMLElement) {
  const title = el.getAttribute('title');
  if (title !== null) {
    el.removeAttribute('title');
    if (!title) return undefined;
    el.dataset.tip = title;
    if (!el.hasAttribute('aria-label') && !el.textContent?.trim()) {
      el.setAttribute('aria-label', title);
    }
  }
  return el.dataset.tip;
}

export function Tooltips() {
  const [tip, setTip] = useState<Tip | null>(null);
  const [shift, setShift] = useState(0);
  const bubble = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let target: HTMLElement | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let visible = false;
    let warmUntil = 0;

    const show = (el: HTMLElement) => {
      const text = el.dataset.tip;
      if (!text || !el.isConnected) return;
      const r = el.getBoundingClientRect();
      const below = r.top < 56;
      visible = true;
      setTip({ text, x: r.left + r.width / 2, y: below ? r.bottom + 8 : r.top - 8, below });
    };
    const hide = () => {
      clearTimeout(timer);
      if (visible) warmUntil = Date.now() + WARM;
      visible = false;
      target = null;
      setTip(null);
    };
    const enter = (el: HTMLElement, now = false) => {
      if (el === target) return;
      const warm = visible || Date.now() < warmUntil;
      hide();
      if (!adopt(el)) return;
      target = el;
      timer = setTimeout(() => show(el), now || warm ? 0 : DELAY);
    };
    const find = (node: EventTarget | null) =>
      node instanceof Element ? node.closest<HTMLElement>('[title], [data-tip]') : null;

    const over = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const el = find(e.target);
      if (el) enter(el);
      else if (target) hide();
    };
    const focus = (e: FocusEvent) => {
      const el = find(e.target);
      if (el && el === e.target && el.matches(':focus-visible')) enter(el, true);
    };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && hide();
    const scroll = (e: Event) => {
      if (target && e.target instanceof Node && e.target.contains(target)) hide();
    };

    document.addEventListener('pointerover', over);
    document.addEventListener('pointerdown', hide, true);
    document.addEventListener('scroll', scroll, true);
    document.addEventListener('focusin', focus);
    document.addEventListener('focusout', hide);
    document.addEventListener('keydown', key);
    window.addEventListener('blur', hide);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerover', over);
      document.removeEventListener('pointerdown', hide, true);
      document.removeEventListener('scroll', scroll, true);
      document.removeEventListener('focusin', focus);
      document.removeEventListener('focusout', hide);
      document.removeEventListener('keydown', key);
      window.removeEventListener('blur', hide);
    };
  }, []);

  useLayoutEffect(() => {
    const el = bubble.current;
    if (!tip || !el) return;
    const half = el.offsetWidth / 2;
    const left = Math.max(EDGE + half, Math.min(window.innerWidth - EDGE - half, tip.x));
    setShift(left - tip.x);
  }, [tip]);

  if (!tip) return null;
  return createPortal(
    <div
      ref={bubble}
      role="tooltip"
      className="tooltip"
      data-below={tip.below || undefined}
      style={{ left: tip.x + shift, top: tip.y }}
    >
      {tip.text}
    </div>,
    document.body,
  );
}
