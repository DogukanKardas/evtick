"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { ANIMATION_DURATION, ANIMATION_EASING } from "@/lib/animations/variants";
import { useScrollAnimation, useReducedMotion } from "@/lib/animations/hooks";
import type { ReactNode } from "react";

interface FadeInViewProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function FadeInView({ children, className, delay = 0 }: FadeInViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useScrollAnimation(ref);
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{
        duration: ANIMATION_DURATION.normal,
        ease: ANIMATION_EASING.ease,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
