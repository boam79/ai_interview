'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface QuestionCardProps {
  question: string;
  questionNumber: number;
  totalQuestions: number;
  isTyping?: boolean;
}

export default function QuestionCard({ 
  question, 
  questionNumber, 
  totalQuestions,
  isTyping = true 
}: QuestionCardProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  // 타이핑 효과
  useEffect(() => {
    if (!isTyping) {
      setDisplayedText(question);
      setIsTypingComplete(true);
      return;
    }

    setDisplayedText('');
    setIsTypingComplete(false);
    
    let currentIndex = 0;
    const typingSpeed = 30; // 30ms per character

    const typingInterval = setInterval(() => {
      if (currentIndex < question.length) {
        setDisplayedText(question.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTypingComplete(true);
        clearInterval(typingInterval);
      }
    }, typingSpeed);

    return () => clearInterval(typingInterval);
  }, [question, isTyping]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full"
    >
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg">
        
        {/* AI 아바타 및 헤더 */}
        <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg"
          >
            <span className="text-lg sm:text-xl md:text-2xl">🤖</span>
          </motion.div>
          
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-bold text-white/90">
              AI 면접관
            </h3>
            <p className="text-xs sm:text-sm text-white/60">
              질문 {questionNumber} / {totalQuestions}
            </p>
          </div>

          {/* 타이핑 인디케이터 */}
          {!isTypingComplete && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="flex space-x-1"
            >
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full" />
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full" />
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full" />
            </motion.div>
          )}
        </div>

        {/* 질문 텍스트 */}
        <div className="relative">
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white font-medium leading-relaxed">
            {displayedText}
            {!isTypingComplete && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="inline-block w-0.5 h-5 sm:h-6 md:h-7 bg-purple-400 ml-1"
              />
            )}
          </p>
        </div>

        {/* 유리 효과 반사광 */}
        <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
        
        {/* 테두리 하이라이트 */}
        <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border border-white/10 pointer-events-none" />
      </div>

      {/* 안내 메시지 */}
      {isTypingComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-3 sm:mt-4 text-center"
        >
          <p className="text-xs sm:text-sm text-white/60">
            💡 답변을 준비하시고 녹음 버튼을 눌러주세요
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

