'use client';

import { motion } from 'framer-motion';

export type RecordButtonState = 'idle' | 'recording' | 'processing';

interface RecordButtonProps {
  state: RecordButtonState;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * RecordButton Component
 * 
 * Voice recording control button with Liquid Glass style
 * - Idle: Gray glass button with "녹음 시작"
 * - Recording: Red pulsing button with "중지"
 * - Processing: Loading spinner with "분석 중..."
 */
export default function RecordButton({
  state,
  onClick,
  disabled = false,
}: RecordButtonProps) {
  const isIdle = state === 'idle';
  const isRecording = state === 'recording';
  const isProcessing = state === 'processing';

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse effect when recording */}
      {isRecording && (
        <motion.div
          className="absolute inset-0 rounded-full bg-red-500/30"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}

      {/* Main button */}
      <motion.button
        onClick={onClick}
        disabled={disabled || isProcessing}
        whileHover={!disabled && !isProcessing ? { scale: 1.05 } : {}}
        whileTap={!disabled && !isProcessing ? { scale: 0.95 } : {}}
        className={`
          relative z-10
          w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full
          flex flex-col items-center justify-center
          transition-all duration-300
          focus:outline-none focus:ring-4 focus:ring-opacity-50
          ${isIdle ? 'glass-button bg-white/10 hover:bg-white/20 focus:ring-purple-400' : ''}
          ${isRecording ? 'bg-red-500/80 backdrop-blur-xl focus:ring-red-400' : ''}
          ${isProcessing ? 'glass-button bg-white/10 cursor-not-allowed' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          shadow-2xl
        `}
        aria-label={
          isIdle ? '녹음 시작' : 
          isRecording ? '녹음 중지' : 
          '음성 분석 중'
        }
      >
        {/* Icon */}
        <div className="mb-2">
          {isIdle && <MicrophoneIcon className="w-12 h-12 text-gray-700 dark:text-gray-300" />}
          {isRecording && <StopIcon className="w-12 h-12 text-white" />}
          {isProcessing && <LoadingSpinner className="w-12 h-12 text-gray-700 dark:text-gray-300" />}
        </div>

        {/* Label */}
        <span className={`
          text-sm font-semibold
          ${isIdle ? 'text-gray-700 dark:text-gray-300' : ''}
          ${isRecording ? 'text-white' : ''}
          ${isProcessing ? 'text-gray-700 dark:text-gray-300' : ''}
        `}>
          {isIdle && '녹음 시작'}
          {isRecording && '중지'}
          {isProcessing && '분석 중...'}
        </span>

        {/* Recording indicator dot */}
        {isRecording && (
          <motion.div
            className="absolute top-4 right-4 w-3 h-3 rounded-full bg-white"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Processing indicator - enhanced blinking effect */}
        {isProcessing && (
          <>
            {/* Outer pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-purple-400/50"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            {/* Inner glow effect */}
            <motion.div
              className="absolute inset-2 rounded-full bg-gradient-to-r from-purple-400/20 to-pink-400/20"
              animate={{ 
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            {/* Center pulsing dot */}
            <motion.div
              className="absolute top-1/2 left-1/2 w-4 h-4 bg-purple-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
              animate={{ 
                scale: [0.8, 1.3, 0.8],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </>
        )}
      </motion.button>

      {/* Recording duration timer */}
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-12 text-center"
        >
          <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
            녹음 중...
          </span>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Microphone Icon
 */
function MicrophoneIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
      />
    </svg>
  );
}

/**
 * Stop Icon
 */
function StopIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
      className={className}
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

/**
 * Loading Spinner
 */
function LoadingSpinner({ className }: { className?: string }) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className={className}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </motion.svg>
  );
}

