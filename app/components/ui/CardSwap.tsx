'use client';

import React, { Children, cloneElement, forwardRef, isValidElement, useEffect, useMemo, useRef, ReactNode, HTMLAttributes } from 'react';
import gsap from 'gsap';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  customClass?: string;
  children?: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ customClass, ...rest }, ref) => (
  <div
    ref={ref}
    {...rest}
    className={`absolute top-1/2 left-1/2 rounded-xl border border-border-default bg-background [transform-style:preserve-3d] [will-change:transform,opacity] [backface-visibility:hidden] overflow-hidden opacity-0 ${customClass ?? ''} ${rest.className ?? ''}`.trim()}
  />
));
Card.displayName = 'Card';

const makeSlot = (i: number, distX: number, distY: number, total: number) => {
  // Constant Z-depth ensures the 'deck' look is consistent and tactile
  const zDepth = 60;
  return {
    x: i * distX,
    y: -i * distY,
    z: -i * zDepth,
    zIndex: total - i
  };
};

const placeNow = (el: HTMLElement | null, slot: { x: number; y: number; z: number; zIndex: number }, skew: number) => {
  if (!el) return;
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
    force3D: true
  });
};

interface CardSwapProps {
  width?: number | string;
  height?: number | string;
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  pauseOnHover?: boolean;
  onCardClick?: (idx: number) => void;
  skewAmount?: number;
  easing?: 'linear' | 'elastic';
  className?: string;
  children: ReactNode;
}

const CardSwap = ({
  width = 500,
  height = 400,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 5000,
  pauseOnHover = false,
  onCardClick,
  skewAmount = 6,
  easing = 'elastic',
  className = '',
  children
}: CardSwapProps) => {
  const config =
    easing === 'elastic'
      ? {
          ease: 'elastic.out(0.6,0.9)',
          durDrop: 2,
          durMove: 2,
          durReturn: 2,
          promoteOverlap: 0.9,
          returnDelay: 0.05
        }
      : {
          ease: 'power1.inOut',
          durDrop: 0.8,
          durMove: 0.8,
          durReturn: 0.8,
          promoteOverlap: 0.45,
          returnDelay: 0.2
        };

  const childArr = useMemo(() => Children.toArray(children), [children]);
  const refs = useMemo(
    () => childArr.map(() => React.createRef<HTMLDivElement>()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [childArr.length]
  );

  const order = useRef(Array.from({ length: childArr.length }, (_, i) => i));

  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const total = refs.length;
    refs.forEach((r, i) => {
      if (r.current) {
        placeNow(r.current, makeSlot(i, cardDistance, verticalDistance, total), skewAmount);
        gsap.to(r.current, { autoAlpha: 1, duration: 0.8, delay: i * 0.15, ease: 'power2.out' });
      }
    });

    const swap = () => {
      if (order.current.length < 2) return;
      if (tlRef.current?.isActive()) return;

      const [front, ...rest] = order.current;
      const elFront = refs[front].current;
      if (!elFront) return;

      const tl = gsap.timeline();
      tlRef.current = tl;

      const totalCards = refs.length;
      const backSlot = makeSlot(totalCards - 1, cardDistance, verticalDistance, totalCards);

      // --- THE PEEL & TUCK LOGIC ---

      // 1. THE PEEL: Slide down and disappear
      tl.to(elFront, {
        y: '120%', 
        z: '+=50', // Slight lift before dropping
        rotationX: -10,
        autoAlpha: 0,
        duration: 0.6,
        ease: 'power2.in'
      });

      // 2. THE SHIFT: Advance the rest of the cards
      tl.addLabel('advance', 0.2);
      rest.forEach((idx, i) => {
        const el = refs[idx].current;
        if (!el) return;
        const slot = makeSlot(i, cardDistance, verticalDistance, totalCards);
        
        tl.to(el, {
          x: slot.x,
          y: slot.y,
          z: slot.z,
          zIndex: slot.zIndex,
          duration: 0.6,
          ease: 'expo.out'
        }, 'advance');
      });

      // 3. THE TUCK: Teleport to back position while invisible
      tl.set(elFront, {
        x: backSlot.x,
        y: backSlot.y,
        z: backSlot.z,
        rotationX: 0,
        zIndex: backSlot.zIndex
      });

      // 4. THE REVEAL: Fade back in at the deepest slot
      tl.to(elFront, {
        autoAlpha: 1,
        duration: 0.5,
        ease: 'power2.out'
      });

      tl.call(() => {
        order.current = [...rest, front];
      });
    };

    intervalRef.current = setInterval(swap, delay);

    if (pauseOnHover) {
      const node = container.current;
      if (node) {
        const pause = () => {
          tlRef.current?.pause();
          if (intervalRef.current) clearInterval(intervalRef.current);
        };
        const resume = () => {
          tlRef.current?.play();
          intervalRef.current = setInterval(swap, delay);
        };
        node.addEventListener('mouseenter', pause);
        node.addEventListener('mouseleave', resume);
        return () => {
          node.removeEventListener('mouseenter', pause);
          node.removeEventListener('mouseleave', resume);
          if (intervalRef.current) clearInterval(intervalRef.current);
        };
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, easing]);

  const rendered = childArr.map((child, i) => {
    if (isValidElement(child)) {
      const element = child as React.ReactElement<any>;
      return cloneElement(element, {
        key: i,
        ref: refs[i],
        style: { width, height, ...(element.props.style ?? {}) },
        onClick: (e: React.MouseEvent) => {
          element.props.onClick?.(e);
          onCardClick?.(i);
        }
      });
    }
    return child;
  });

  return (
    <div
      ref={container}
      className={`relative lg:ml-auto lg:mr-0 [perspective:2500px] [transform-style:preserve-3d] overflow-visible scale-100 transition-all duration-500 ${className}`}
      style={{ width, height: height || '400px' }}
    >
      {rendered}
    </div>
  );
};

export default CardSwap;
