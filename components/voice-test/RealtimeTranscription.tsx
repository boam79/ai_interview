'use client';

import { motion } from 'framer-motion';

interface RealtimeTranscriptionProps {
  isRecording: boolean;
  currentText: string;
  isProcessing: boolean;
  className?: string;
}

/**
 * RealtimeTranscription Component
 * 
 * 실시간 음성 변환 창
 * - 녹음 중 실시간으로 변환된 텍스트 표시
 * - 타이핑 효과로 자연스러운 텍스트 등장
 * - Liquid Glass 스타일
 */
export default function RealtimeTranscription({
  isRecording,
  currentText,
  isProcessing,
  className = '',
}: RealtimeTranscriptionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
        className={`glass-card p-3 sm:p-4 md:p-6 rounded-2xl w-full ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`
            w-3 h-3 rounded-full transition-all duration-300
            ${isRecording ? 'bg-red-500 animate-pulse' : 
              isProcessing ? 'bg-yellow-500 animate-spin' : 
              'bg-gray-400'}
          `} />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            실시간 변환
          </h3>
        </div>
        
        {/* Status indicator */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {isRecording && '🎤 녹음 중...'}
          {isProcessing && '⚡ 음성 분석 중...'}
          {!isRecording && !isProcessing && '⏸️ 대기 중'}
        </div>
      </div>

      {/* Text content area */}
      <div className="relative min-h-[120px]">
        {currentText ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-lg leading-relaxed text-gray-900 dark:text-gray-100"
          >
            {/* Simulate typing effect */}
            <TypingText text={currentText} />
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 dark:text-gray-400">
              {isRecording ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  <p className="text-sm">음성을 분석하고 있습니다...</p>
                </div>
              ) : isProcessing ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"
                    />
                  </div>
                  <p className="text-sm">음성을 텍스트로 변환 중...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-4xl">🎤</div>
                  <p className="text-sm">녹음을 시작하면 여기에 실시간 변환 결과가 표시됩니다</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>🔒 실시간 처리</span>
            <span>⚡ 빠른 응답</span>
          </div>
          <span>Powered by OpenAI Whisper</span>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * TypingText Component
 * 
 * 타이핑 효과로 텍스트를 자연스럽게 표시
 */
function TypingText({ text }: { text: string }) {
  return (
    <div className="relative">
      <span>{text}</span>
      {/* Blinking cursor */}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="inline-block w-0.5 h-5 bg-purple-500 ml-1"
      />
    </div>
  );
}
