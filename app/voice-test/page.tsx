'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import RecordButton, { RecordButtonState } from '@/components/voice-test/RecordButton';
import RealtimeTranscription from '@/components/voice-test/RealtimeTranscription';
import IntroductionGuide from '@/components/voice-test/IntroductionGuide';
import { fadeInUp, scaleIn } from '@/utils/animations';
import {
  requestMicrophoneAccess,
  startAudioStream,
  stopAudioStream,
  AudioCaptureState,
  getMicrophoneErrorMessage,
  isMicrophoneSupported,
} from '@/utils/audioCapture';
import { createAudioRecorder } from '@/utils/audioRecorder';
import { 
  startRealtimeTranscription, 
  simulateRealtimeTranscription,
  formatTranscriptionText,
  isStreamingSupported 
} from '@/utils/realtimeTranscription';

/**
 * Voice Test Page
 * 
 * User flow:
 * 1. Request microphone permission
 * 2. Show test sentence
 * 3. Record user speaking
 * 4. Send to Whisper API
 * 5. Display recognized text
 * 6. Allow retry or continue to next step
 */
export default function VoiceTestPage() {
  const router = useRouter();

  // Microphone permission state
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [selectedMicrophoneInfo, setSelectedMicrophoneInfo] = useState<{
    label: string;
    deviceId: string;
    isBluetooth: boolean;
  } | null>(null);

  // Audio state
  const [audioCaptureState, setAudioCaptureState] = useState<AudioCaptureState | null>(null);
  const audioRecorderRef = useRef(createAudioRecorder({ maxDuration: 60000 })); // 60 seconds max

  // Recording state
  const [recordButtonState, setRecordButtonState] = useState<RecordButtonState>('idle');
  const [isRecording, setIsRecording] = useState<boolean>(false);

  // Transcription state
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  // Realtime transcription state
  const [realtimeText, setRealtimeText] = useState<string>('');
  const [isRealtimeProcessing, setIsRealtimeProcessing] = useState<boolean>(false);
  const realtimeControllerRef = useRef<AbortController | null>(null);

  // Introduction guide state
  const [showIntroductionGuide, setShowIntroductionGuide] = useState<boolean>(false);

  // Test sentence
  const testSentence = '안녕하세요. 저는 AI 면접을 준비하고 있습니다.';

  /**
   * Request microphone permission on mount
   */
  useEffect(() => {
    handleRequestPermission();
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (audioCaptureState) {
        stopAudioStream(audioCaptureState);
      }
      audioRecorderRef.current.cleanup();
      
      // Cancel realtime transcription if running
      if (realtimeControllerRef.current) {
        realtimeControllerRef.current.abort();
      }
    };
  }, [audioCaptureState]);

  /**
   * Request microphone permission (auto-select best microphone)
   */
  const handleRequestPermission = async () => {
    try {
      console.log('🎤 Requesting microphone permission...');

      // Check browser support
      if (!isMicrophoneSupported()) {
        throw new Error('브라우저가 마이크를 지원하지 않습니다.');
      }

      // Request permission (automatically selects best microphone)
      const { stream, microphoneInfo } = await requestMicrophoneAccess();
      
      // Start audio stream
      const captureState = startAudioStream(stream);
      setAudioCaptureState(captureState);
      setSelectedMicrophoneInfo(microphoneInfo);
      setPermissionGranted(true);
      setPermissionError(null);

      console.log('✅ Microphone permission granted (auto-selected best device)');
      console.log('🎤 Selected microphone:', microphoneInfo);

    } catch (error: any) {
      console.error('❌ Microphone permission error:', error);
      setPermissionError(getMicrophoneErrorMessage(error));
      setPermissionGranted(false);
      setSelectedMicrophoneInfo(null);
    }
  };

  /**
   * Handle record button click
   */
  const handleRecordButtonClick = async () => {
    if (isRecording) {
      // Stop recording
      await handleStopRecording();
    } else {
      // Show introduction guide first
      setShowIntroductionGuide(true);
    }
  };

  /**
   * Handle start recording after guide
   */
  const handleStartRecordingFromGuide = () => {
    handleStartRecording();
  };

  /**
   * Start recording
   */
  const handleStartRecording = () => {
    try {
      if (!audioCaptureState || !audioCaptureState.stream) {
        throw new Error('오디오 스트림을 사용할 수 없습니다.');
      }

      console.log('🔴 Starting recording...');

      // Clear previous results
      setRecognizedText('');
      setTranscriptionError(null);
      setRealtimeText('');

      // Start recording
      audioRecorderRef.current.startRecording(audioCaptureState.stream);
      setIsRecording(true);
      setRecordButtonState('recording');

    } catch (error: any) {
      console.error('❌ Recording start error:', error);
      alert(`녹음 시작 오류: ${error.message}`);
    }
  };

  /**
   * Stop recording and send to Whisper API
   */
  const handleStopRecording = async () => {
    try {
      console.log('🛑 Stopping recording...');

      // Stop recording
      audioRecorderRef.current.stopRecording();
      setIsRecording(false);
      setRecordButtonState('processing');

      // Get recorded file
      const audioFile = audioRecorderRef.current.getRecordedFile('voice-test.webm');
      if (!audioFile) {
        throw new Error('녹음된 오디오를 가져올 수 없습니다.');
      }

      console.log('📤 Starting realtime transcription...');

      // Start realtime transcription
      setIsRealtimeProcessing(true);
      
      // Use regular transcription with typing effect (realtime API disabled)
      console.log('📤 Using real-time streaming transcription...');
      await handleStreamingTranscription(audioFile);

    } catch (error: any) {
      console.error('❌ Transcription error:', error);
      setTranscriptionError(error.message || '음성 인식 중 오류가 발생했습니다.');
      setRecordButtonState('idle');
      audioRecorderRef.current.cleanup();
    }
  };

  /**
   * Handle streaming transcription
   */
  const handleStreamingTranscription = async (audioFile: File) => {
    try {
      console.log('📤 Starting streaming transcription...');
      
      realtimeControllerRef.current = await startRealtimeTranscription(audioFile, {
        onTextUpdate: (deltaText, fullText) => {
          console.log('📝 Streaming delta:', deltaText);
          setRealtimeText(fullText);
        },
        onComplete: (finalText, duration) => {
          console.log('✅ Streaming transcription completed:', finalText);
          setRecognizedText(finalText);
          setIsRealtimeProcessing(false);
          setRecordButtonState('idle');
          audioRecorderRef.current.cleanup();
        },
        onError: (error) => {
          console.error('❌ Streaming transcription error:', error);
          setTranscriptionError(error);
          setIsRealtimeProcessing(false);
          setRecordButtonState('idle');
          audioRecorderRef.current.cleanup();
        }
      });
      
    } catch (error: any) {
      console.error('❌ Streaming transcription setup error:', error);
      setTranscriptionError(error.message || '실시간 음성 인식 설정에 실패했습니다.');
      setIsRealtimeProcessing(false);
      setRecordButtonState('idle');
      audioRecorderRef.current.cleanup();
    }
  };

  /**
   * Handle regular (non-streaming) transcription
   */
  const handleRegularTranscription = async (audioFile: File) => {
    try {
      console.log('📤 Sending audio to regular Whisper API...');

      // Send to Whisper API
      const formData = new FormData();
      formData.append('audio', audioFile);

      const response = await fetch('/api/voice-to-text', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '음성 인식에 실패했습니다.');
      }

      console.log('✅ Regular transcription successful:', result.text);

      // Simulate realtime typing effect for better UX
      const formattedText = formatTranscriptionText(result.text);
      
      realtimeControllerRef.current = simulateRealtimeTranscription(formattedText, {
        onTextUpdate: (deltaText, fullText) => {
          setRealtimeText(fullText);
        },
        onComplete: (finalText, duration) => {
          console.log('✅ Typing effect completed, setting recognized text:', finalText);
          setRecognizedText(finalText);
          setIsRealtimeProcessing(false);
          setRecordButtonState('idle');
          audioRecorderRef.current.cleanup();
        }
      }, 30); // Faster typing for demo
      
      // 백업: 타이핑 효과가 5초 이상 걸리면 강제로 완료 처리
      setTimeout(() => {
        if (isRealtimeProcessing && !recognizedText) {
          console.log('⚠️ Typing effect timeout, forcing completion');
          setRecognizedText(formattedText);
          setIsRealtimeProcessing(false);
          setRecordButtonState('idle');
          audioRecorderRef.current.cleanup();
        }
      }, 5000);

    } catch (error: any) {
      console.error('❌ Regular transcription error:', error);
      setTranscriptionError(error.message || '음성 인식에 실패했습니다.');
      setIsRealtimeProcessing(false);
      setRecordButtonState('idle');
      audioRecorderRef.current.cleanup();
    }
  };

  /**
   * Handle retry - reset everything for new test
   */
  const handleRetry = () => {
    setRecognizedText('');
    setTranscriptionError(null);
    setRealtimeText('');
    setIsRealtimeProcessing(false);
    setRecordButtonState('idle');
    
    // Cancel any ongoing transcription
    if (realtimeControllerRef.current) {
      realtimeControllerRef.current.abort();
      realtimeControllerRef.current = null;
    }
    
    audioRecorderRef.current.cleanup();
    console.log('🔄 테스트를 다시 시작합니다.');
  };

  /**
   * Handle continue to next step
   */
  const handleContinue = () => {
    // Save voice test result
    if (typeof window !== 'undefined') {
      localStorage.setItem('voiceTestPassed', 'true');
      localStorage.setItem('voiceTestText', recognizedText);
    }
    
    // Navigate to voice interview page
    console.log('✅ 음성 테스트 완료! 음성 면접으로 이동합니다.');
    router.push('/voice-interview');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 relative">
      <div className="w-full max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto flex flex-col items-center space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
        
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="text-center space-y-2"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 text-center">
            음성 테스트
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 text-center">
            마이크가 정상적으로 작동하는지 확인합니다
          </p>
        </motion.div>

        {/* Permission Error */}
        {permissionError && (
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            className="glass-card bg-red-50/80 border-red-200 p-3 sm:p-4 md:p-6 rounded-2xl w-full mx-2 sm:mx-4"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">마이크 권한 오류</h3>
                <p className="text-red-800 mb-4">{permissionError}</p>
                <button
                  onClick={handleRequestPermission}
                  className="glass-button-primary text-white px-6 py-2 rounded-lg"
                >
                  다시 시도
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main content (only show if permission granted) */}
        {permissionGranted && (
          <>
            {/* Test sentence card */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.1 }}
              className="glass-card p-3 sm:p-4 md:p-6 lg:p-8 rounded-2xl w-full text-center mx-2 sm:mx-4"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 sm:mb-4">
                자기소개를 해주세요
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                이름, 나이, 직업 또는 전공을 간단히 소개해주세요
              </p>
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 
                p-3 sm:p-4 rounded-xl border border-purple-200/50 dark:border-purple-700/50">
                <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 font-medium mb-2">💡 예시:</p>
                <p className="text-xs sm:text-sm lg:text-base text-gray-700 dark:text-gray-300 italic leading-relaxed">
                  "안녕하세요. 저는 김철수입니다. 올해 25살이고, 컴퓨터공학을 전공하고 있습니다."
                </p>
              </div>
            </motion.div>

            {/* Microphone status */}
            {permissionGranted && selectedMicrophoneInfo && (
              <motion.div
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.15 }}
                className="w-full mx-2 sm:mx-4"
              >
                <div className="glass-card p-4 rounded-2xl text-center">
                  <div className="flex items-center justify-center space-x-2 text-gray-700 dark:text-gray-300 mb-2">
                    <span className="text-lg">{selectedMicrophoneInfo.isBluetooth ? '🎧' : '🎤'}</span>
                    <span className="text-sm font-medium">
                      {selectedMicrophoneInfo.isBluetooth ? '블루투스 이어폰이 선택되었습니다' : '마이크가 선택되었습니다'}
                    </span>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 mb-2">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {selectedMicrophoneInfo.label || '기본 마이크'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {selectedMicrophoneInfo.isBluetooth ? '블루투스 디바이스' : '일반 마이크'}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      상태: {selectedMicrophoneInfo.isBluetooth ? '블루투스 연결됨' : '유선 연결됨'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedMicrophoneInfo.isBluetooth 
                      ? '🎧 블루투스 이어폰으로 녹음됩니다' 
                      : '🎤 일반 마이크로 녹음됩니다'
                    }
                  </p>
                </div>
              </motion.div>
            )}


            {/* Realtime transcription window */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.25 }}
              className="w-full mx-2 sm:mx-4"
            >
              <RealtimeTranscription
                isRecording={isRecording}
                currentText={realtimeText}
                isProcessing={isRealtimeProcessing}
              />
              
            </motion.div>

            {/* Record button */}
            <motion.div
              variants={scaleIn}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center space-y-4"
            >
              <RecordButton
                state={recordButtonState}
                onClick={handleRecordButtonClick}
                disabled={!permissionGranted}
              />
              
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
                버튼을 누르면 안내창이 나타납니다. 자기소개를 말한 후 다시 버튼을 눌러주세요.
              </p>
            </motion.div>

            {/* 음성인식 완료 후 버튼들 */}
            {recognizedText && !isRealtimeProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mx-2 sm:mx-4"
              >
                <div className="glass-card p-4 sm:p-6 rounded-2xl text-center">
                  <div className="flex items-center justify-center space-x-2 text-green-600 mb-4">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <h3 className="text-lg font-semibold">음성인식 완료!</h3>
                  </div>
                  
                  <div className="bg-white/10 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>인식된 텍스트:</strong>
                    </p>
                    <p className="text-base font-medium text-gray-800 dark:text-gray-200 mt-1">
                      "{recognizedText}"
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRetry}
                      className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-gray-700 dark:text-gray-300 font-semibold transition-all duration-300 border border-white/20"
                    >
                      🔄 다시 테스트
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleContinue}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition-all duration-300 shadow-lg"
                    >
                      ✅ 다음 단계
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Transcription error */}
            {transcriptionError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card bg-red-50/80 border-red-200 p-3 sm:p-4 md:p-6 rounded-2xl w-full mx-2 sm:mx-4"
              >
                <div className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">인식 실패</h3>
                    <p className="text-red-800 mb-4">{transcriptionError}</p>
                    <button
                      onClick={handleRetry}
                      className="glass-button text-gray-700 px-6 py-2 rounded-lg"
                    >
                      다시 시도
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </>
        )}

        {/* Introduction Guide Popup */}
        <IntroductionGuide
          isOpen={showIntroductionGuide}
          onClose={() => setShowIntroductionGuide(false)}
          onStartRecording={handleStartRecordingFromGuide}
        />

        {/* Helper text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-gray-500 dark:text-gray-400 space-y-2"
        >
          <p>💡 팁: 조용한 환경에서 테스트하면 더 정확합니다.</p>
          <p>🔒 녹음된 음성은 분석 후 즉시 삭제됩니다.</p>
        </motion.div>

      </div>
    </div>
  );
}

