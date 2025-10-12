'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { numberEntry } from '@/utils/animations';

interface PhoneDisplayProps {
  phoneNumber: string;
  placeholder?: string;
}

/**
 * PhoneDisplay Component
 * Displays the phone number with automatic hyphen formatting
 * Uses Liquid Glass styling for a premium look
 */
export default function PhoneDisplay({ 
  phoneNumber, 
  placeholder = '전화번호 입력' 
}: PhoneDisplayProps) {
  return (
    <div className="glass-card w-full max-w-[100px] px-1 py-0.5 text-center relative">
      <div className="text-[6px] text-gray-500 dark:text-gray-400 mb-0.5 font-medium opacity-60">
        연락처
      </div>
      
      <div className="relative h-3 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {phoneNumber ? (
            <motion.div
              key={phoneNumber}
              variants={numberEntry}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-[8px] font-bold tracking-wider text-gray-900 dark:text-gray-100 font-mono"
              style={{ 
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.02em'
              }}
            >
              {phoneNumber}
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[8px] text-gray-400 dark:text-gray-600 font-medium opacity-50"
            >
              {placeholder}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Subtle indicator dots */}
      <div className="flex items-center justify-center gap-1 mt-4">
        {Array.from({ length: 11 }).map((_, index) => {
              // const digitIndex = index < 3 ? index : index < 7 ? index - 1 : index - 2;
              const hasDigit = phoneNumber.replace(/\D/g, '').length > index;
          
          return (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              animate={{ 
                scale: hasDigit ? 1 : 0.5,
                backgroundColor: hasDigit 
                  ? 'rgba(139, 92, 246, 0.8)' 
                  : 'rgba(156, 163, 175, 0.3)'
              }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 30,
              }}
              className="w-1.5 h-1.5 rounded-full"
            />
          );
        })}
      </div>
    </div>
  );
}

