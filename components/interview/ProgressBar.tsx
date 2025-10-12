'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface ProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
  onInterrupt?: () => void;
}

export default function ProgressBar({ 
  currentQuestion, 
  totalQuestions,
  onInterrupt 
}: ProgressBarProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showInterruptModal, setShowInterruptModal] = useState(false);

  // 경과 시간 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 시간 포맷팅 (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 진행률 계산
  const progress = (currentQuestion / totalQuestions) * 100;

  // 면접 중단 확인
  const handleInterruptClick = () => {
    setShowInterruptModal(true);
  };

  const handleConfirmInterrupt = () => {
    setShowInterruptModal(false);
    if (onInterrupt) {
      onInterrupt();
    }
  };

  const handleCancelInterrupt = () => {
    setShowInterruptModal(false);
  };

  return (
    <>
      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-xl border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
          
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            
            {/* 왼쪽: 진행 상황 */}
            <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
              
              {/* 아이콘 */}
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <span className="text-sm sm:text-base">💼</span>
              </div>

              {/* 진행률 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs sm:text-sm font-bold text-white">
                    질문 {currentQuestion} / {totalQuestions}
                  </span>
                  <span className="text-xs sm:text-sm text-white/60">
                    {Math.round(progress)}%
                  </span>
                </div>
                
                {/* 진행률 바 */}
                <div className="h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>

            {/* 중앙: 경과 시간 */}
            <div className="flex-shrink-0 flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/5 border border-white/10">
              <span className="text-xs sm:text-sm">⏱️</span>
              <span className="text-xs sm:text-sm font-mono text-white">
                {formatTime(elapsedTime)}
              </span>
            </div>

            {/* 오른쪽: 중단 버튼 */}
            {onInterrupt && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleInterruptClick}
                className="flex-shrink-0 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 text-xs sm:text-sm text-white/70 hover:text-white"
              >
                ✕ 중단
              </motion.button>
            )}
          </div>

        </div>
      </motion.div>

      {/* 중단 확인 모달 */}
      {showInterruptModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleCancelInterrupt}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs sm:max-w-sm md:max-w-md bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-white/20 shadow-2xl"
          >
            {/* 아이콘 */}
            <div className="flex justify-center mb-3 sm:mb-4 md:mb-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl md:text-4xl">⚠️</span>
              </div>
            </div>

            {/* 제목 */}
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-white text-center mb-2 sm:mb-3">
              면접을 중단하시겠습니까?
            </h3>

            {/* 설명 */}
            <p className="text-xs sm:text-sm text-white/70 text-center mb-4 sm:mb-6 md:mb-8">
              지금까지의 진행 상황이 저장되며,<br />
              나중에 다시 시작할 수 없습니다.
            </p>

            {/* 버튼 */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleCancelInterrupt}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-300"
              >
                취소
              </button>
              <button
                onClick={handleConfirmInterrupt}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 transition-all duration-300"
              >
                중단하기
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}

