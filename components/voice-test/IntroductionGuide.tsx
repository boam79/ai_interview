'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface IntroductionGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onStartRecording: () => void;
}

/**
 * IntroductionGuide Component
 * 
 * 자기소개 안내 팝업창
 * - 녹음 시작 전 사용자에게 자기소개 방법 안내
 * - Liquid Glass 스타일 적용
 * - 부드러운 애니메이션
 */
export default function IntroductionGuide({
  isOpen,
  onClose,
  onStartRecording,
}: IntroductionGuideProps) {
  const handleStartRecording = () => {
    onClose();
    onStartRecording();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-1 xs:p-2 sm:p-3 md:p-4 lg:p-6 pointer-events-none overflow-y-auto"
          >
            <div className="glass-card p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 rounded-xl xs:rounded-2xl sm:rounded-3xl w-full max-w-[280px] xs:max-w-xs sm:max-w-sm md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto my-4 pointer-events-auto
              bg-white/85 backdrop-blur-xl border border-white/25 shadow-2xl
              min-h-[80vh] xs:min-h-[75vh] sm:min-h-[70vh] md:min-h-[65vh] lg:min-h-[60vh] flex flex-col">
              
              {/* Header */}
              <div className="text-center mb-3 xs:mb-4 sm:mb-5 md:mb-6 flex-shrink-0">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 xs:mb-3 sm:mb-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 
                    flex items-center justify-center shadow-lg"
                >
                  <svg className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </motion.div>
                
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1 xs:mb-2 leading-tight"
                >
                  자기소개를 해주세요
                </motion.h2>
                
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs xs:text-sm sm:text-base text-gray-600 dark:text-gray-400 px-2"
                >
                  음성 테스트를 위해 간단한 자기소개를 녹음해주세요
                </motion.p>
              </div>

              {/* Content - Scrollable */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex-1 overflow-y-auto space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6 pr-1"
              >
                {/* Instructions */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 
                  p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg xs:rounded-xl sm:rounded-2xl border border-purple-200/50 dark:border-purple-700/50">
                  <h3 className="text-sm xs:text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 xs:mb-3 sm:mb-4 flex items-center">
                    <svg className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 mr-1 xs:mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    안내사항
                  </h3>
                  
                  <div className="space-y-2 xs:space-y-2.5 sm:space-y-3 text-gray-700 dark:text-gray-300">
                    <div className="flex items-start space-x-2 xs:space-x-3">
                      <span className="flex-shrink-0 w-5 h-5 xs:w-6 xs:h-6 bg-purple-100 dark:bg-purple-900/50 text-purple-600 
                        rounded-full flex items-center justify-center text-xs xs:text-sm font-semibold">1</span>
                      <p className="text-xs xs:text-sm sm:text-base leading-relaxed">녹음 버튼을 누르면 3초 후 녹음이 시작됩니다</p>
                    </div>
                    <div className="flex items-start space-x-2 xs:space-x-3">
                      <span className="flex-shrink-0 w-5 h-5 xs:w-6 xs:h-6 bg-purple-100 dark:bg-purple-900/50 text-purple-600 
                        rounded-full flex items-center justify-center text-xs xs:text-sm font-semibold">2</span>
                      <p className="text-xs xs:text-sm sm:text-base leading-relaxed">자신의 이름, 나이, 직업 또는 전공을 간단히 소개해주세요</p>
                    </div>
                    <div className="flex items-start space-x-2 xs:space-x-3">
                      <span className="flex-shrink-0 w-5 h-5 xs:w-6 xs:h-6 bg-purple-100 dark:bg-purple-900/50 text-purple-600 
                        rounded-full flex items-center justify-center text-xs xs:text-sm font-semibold">3</span>
                      <p className="text-xs xs:text-sm sm:text-base leading-relaxed">말하기를 마치면 다시 버튼을 눌러 녹음을 중지해주세요</p>
                    </div>
                  </div>
                </div>

                {/* Example */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg xs:rounded-xl sm:rounded-2xl">
                  <h4 className="text-xs xs:text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200 mb-2 xs:mb-2 sm:mb-3 flex items-center">
                    <svg className="w-3 h-3 xs:w-4 xs:h-4 mr-1 xs:mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    예시
                  </h4>
                  <p className="text-xs xs:text-sm text-gray-600 dark:text-gray-400 italic leading-relaxed">
                    &ldquo;안녕하세요. 저는 김철수입니다. 올해 25살이고, 컴퓨터공학을 전공하고 있습니다. 
                    현재 취업을 준비하고 있으며, AI 면접 연습을 위해 참여하게 되었습니다.&rdquo;
                  </p>
                </div>

                {/* Tips */}
                <div className="flex items-start space-x-2 xs:space-x-2.5 sm:space-x-3 p-2 xs:p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 
                  rounded-lg xs:rounded-xl sm:rounded-2xl border border-yellow-200/50 dark:border-yellow-700/50">
                  <svg className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-xs xs:text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-semibold mb-1">💡 팁</p>
                    <p className="leading-relaxed">조용한 환경에서 명확하게 발음해주시면 더 정확한 인식을 도와줍니다.</p>
                  </div>
                </div>
              </motion.div>

              {/* Actions - Fixed at bottom */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex-shrink-0 flex flex-col xs:flex-row gap-2 xs:gap-3 mt-4 xs:mt-5 sm:mt-6 pt-2 xs:pt-3 sm:pt-4 border-t border-gray-200/50 dark:border-gray-700/50"
              >
                <button
                  onClick={onClose}
                  className="glass-button text-gray-700 dark:text-gray-300 px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs xs:text-sm sm:text-base font-semibold
                    hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 flex-1"
                >
                  나중에 하기
                </button>
                
                <button
                  onClick={handleStartRecording}
                  className="glass-button-primary text-white px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs xs:text-sm sm:text-base font-semibold
                    hover:shadow-lg transition-all duration-200 flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  <span className="flex items-center justify-center space-x-1 xs:space-x-2">
                    <svg className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                    <span>녹음 시작</span>
                  </span>
                </button>
              </motion.div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-1 right-1 xs:top-2 xs:right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-gray-100 dark:bg-gray-800 
                  flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300
                  hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm"
                aria-label="닫기"
              >
                <svg className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
