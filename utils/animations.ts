/**
 * Framer Motion Animation Presets
 * Apple-inspired smooth animations with spring physics
 */

import { Variants, Transition } from 'framer-motion';

// ============================================
// Spring Animation Configs
// ============================================

export const springConfig: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
  mass: 1,
};

export const softSpringConfig: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 25,
  mass: 1,
};

export const bouncySpringConfig: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 20,
  mass: 0.8,
};

// ============================================
// Animation Variants
// ============================================

/**
 * Fade in with upward slide
 * Perfect for card entrances
 */
export const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: springConfig,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 },
  },
};

/**
 * Fade in with downward slide
 * Good for dropdown menus
 */
export const fadeInDown: Variants = {
  initial: {
    opacity: 0,
    y: -20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: springConfig,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 },
  },
};

/**
 * Scale in animation
 * Perfect for button presses and modals
 */
export const scaleIn: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: springConfig,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

/**
 * Spring button animation
 * For interactive button feedback
 */
export const springButton = {
  tap: {
    scale: 0.95,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 20,
    },
  },
  hover: {
    scale: 1.05,
    transition: softSpringConfig,
  },
};

/**
 * Gentle scale animation for keypad buttons
 * More subtle than springButton
 */
export const keypadButton = {
  tap: {
    scale: 0.92,
    transition: {
      type: 'spring',
      stiffness: 600,
      damping: 25,
    },
  },
  hover: {
    scale: 1.02,
    transition: softSpringConfig,
  },
};

/**
 * Stagger children animation
 * For sequential appearance of list items
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/**
 * Stagger child item
 * Use with staggerContainer
 */
export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: springConfig,
  },
};

/**
 * Slide in from right
 * Good for page transitions
 */
export const slideInRight: Variants = {
  initial: {
    x: '100%',
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: springConfig,
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

/**
 * Slide in from left
 * Good for back navigation
 */
export const slideInLeft: Variants = {
  initial: {
    x: '-100%',
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: springConfig,
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

/**
 * Pulse animation
 * For recording indicators or attention grabbers
 */
export const pulse: Variants = {
  initial: {
    scale: 1,
  },
  animate: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Ripple effect for touch feedback
 * Use with absolute positioned overlay
 */
export const ripple: Variants = {
  initial: {
    scale: 0,
    opacity: 0.5,
  },
  animate: {
    scale: 2,
    opacity: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

/**
 * Modal overlay backdrop
 */
export const modalBackdrop: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

/**
 * Modal content
 */
export const modalContent: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springConfig,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 },
  },
};

/**
 * Number input animation
 * For displaying newly entered numbers
 */
export const numberEntry: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 600,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.15 },
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Create custom delay transition
 */
export const createDelayedTransition = (delay: number): Transition => ({
  ...springConfig,
  delay,
});

/**
 * Create custom spring with parameters
 */
export const createCustomSpring = (
  stiffness: number,
  damping: number,
  mass: number = 1
): Transition => ({
  type: 'spring',
  stiffness,
  damping,
  mass,
});

