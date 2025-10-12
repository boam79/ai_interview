'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface ChecklistCardProps {
  title: string;
  description: string[];
  icon: string;
  index: number;
  onCheck: (checked: boolean) => void;
}

export default function ChecklistCard({ 
  title, 
  description, 
  icon,
  index,
  onCheck 
}: ChecklistCardProps) {
  const [isChecked, setIsChecked] = useState(false);

  const handleClick = () => {
    const newChecked = !isChecked;
    setIsChecked(newChecked);
    onCheck(newChecked);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.2,
        ease: [0.16, 1, 0.3, 1] 
      }}
      onClick={handleClick}
      className="cursor-pointer"
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          relative overflow-hidden rounded-3xl p-4 sm:p-5 md:p-6
          transition-all duration-300
          ${isChecked 
            ? 'bg-white/20 border-2 border-purple-500/70' 
            : 'bg-white/15 border-2 border-white/30'
          }
          backdrop-blur-xl
          hover:bg-white/25
          shadow-lg hover:shadow-xl
        `}
      >
        {/* 체크 표시 */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: isChecked ? 1 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
          >
            <svg 
              className="w-4 h-4 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={3} 
                d="M5 13l4 4L19 7"
              />
            </svg>
          </motion.div>
          
          {/* 체크되지 않았을 때 빈 원 */}
          {!isChecked && (
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-gray-400" />
          )}
        </div>

        {/* 아이콘 */}
        <div className="mb-3 sm:mb-4">
          <div className="text-3xl sm:text-4xl md:text-5xl">{icon}</div>
        </div>

        {/* 제목 */}
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-2 sm:mb-3">
          {title}
        </h3>

        {/* 설명 */}
        <div className="space-y-1 sm:space-y-1.5">
          {description.map((line, i) => (
            <p key={i} className="text-xs sm:text-sm text-gray-700 font-semibold">
              • {line}
            </p>
          ))}
        </div>

        {/* 유리 효과 반사광 */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 pointer-events-none" />
      </motion.div>
    </motion.div>
  );
}

