'use client';

import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/utils/animations';

interface NumericKeypadProps {
  onNumberPress: (digit: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}

/**
 * NumericKeypad Component
 * Galaxy-style numeric keypad with glass morphism design
 * 3x4 grid layout (1-9, *, 0, backspace)
 */
export default function NumericKeypad({ 
  onNumberPress, 
  onBackspace, 
  disabled = false 
}: NumericKeypadProps) {
  
  const buttons = [
    { value: '1', label: '1', sublabel: '' },
    { value: '2', label: '2', sublabel: 'ABC' },
    { value: '3', label: '3', sublabel: 'DEF' },
    { value: '4', label: '4', sublabel: 'GHI' },
    { value: '5', label: '5', sublabel: 'JKL' },
    { value: '6', label: '6', sublabel: 'MNO' },
    { value: '7', label: '7', sublabel: 'PQRS' },
    { value: '8', label: '8', sublabel: 'TUV' },
    { value: '9', label: '9', sublabel: 'WXYZ' },
    { value: '', label: '', sublabel: '', type: 'empty' }, // Empty space
    { value: '0', label: '0', sublabel: '+' },
    { value: 'backspace', label: '⌫', sublabel: '', type: 'backspace' },
  ];

  const handlePress = (button: typeof buttons[0]) => {
    if (disabled) return;
    
    if (button.type === 'backspace') {
      onBackspace();
      // Haptic feedback for mobile
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } else if (button.value && button.type !== 'empty') {
      onNumberPress(button.value);
      // Haptic feedback for mobile
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="w-full max-w-[100px] mx-auto"
    >
      <div className="glass-card p-0.5">
        <div className="grid grid-cols-3 gap-0.5">
        {buttons.map((button, index) => {
          if (button.type === 'empty') {
            return <div key={index} />;
          }

          return (
            <motion.button
              key={index}
              variants={staggerItem}
              whileTap={disabled ? undefined : { scale: 0.95 }}
              whileHover={disabled ? undefined : { scale: 1.02 }}
              onClick={() => handlePress(button)}
              disabled={disabled}
              className={`
                glass-button glass-button-ripple
                w-full aspect-square
                flex flex-col items-center justify-center
                text-gray-900 dark:text-gray-100
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-1 focus:ring-purple-400 focus:ring-opacity-30
                min-h-[16px]
                transition-all duration-100 ease-out
                ${button.type === 'backspace' ? 'col-start-3' : ''}
                ${button.type === 'backspace' ? 'bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/10 dark:hover:bg-red-900/20' : ''}
              `}
              aria-label={button.type === 'backspace' ? 'Backspace' : `Number ${button.value}`}
            >
              <span className={`
                font-semibold font-display
                ${button.type === 'backspace' ? 'text-[8px]' : 'text-[9px]'}
                ${button.type === 'backspace' ? 'text-red-600 dark:text-red-400' : ''}
              `}>
                {button.label}
              </span>
              {button.sublabel && (
                <span className="text-[5px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium tracking-wide opacity-50">
                  {button.sublabel}
                </span>
              )}
            </motion.button>
          );
        })}
        </div>
      </div>
    </motion.div>
  );
}

