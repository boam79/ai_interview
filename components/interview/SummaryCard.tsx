'use client';

import { motion } from 'framer-motion';

interface SummaryCardProps {
  title: string;
  content: string;
  icon: string;
  delay?: number;
}

export default function SummaryCard({ title, content, icon, delay = 0 }: SummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg"
    >
      {/* 아이콘 */}
      <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
        <div className="text-2xl sm:text-3xl">{icon}</div>
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">
          {title}
        </h3>
      </div>

      {/* 내용 */}
      <div className="text-xs sm:text-sm md:text-base text-white/80 leading-relaxed whitespace-pre-wrap">
        {content}
      </div>

      {/* 유리 효과 반사광 */}
      <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
    </motion.div>
  );
}

