'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { fadeInUp, scaleIn } from '@/utils/animations';
import RecordButton, { RecordButtonState } from '@/components/voice-test/RecordButton';
import { requestMicrophoneAccess, startAudioStream, stopAudioStream, AudioCaptureState } from '@/utils/audioCapture';
import { createAudioRecorder } from '@/utils/audioRecorder';
import { startRealtimeTranscription } from '@/utils/realtimeTranscription';

// 간단한 음성 테스트 페이지
export default function VoiceTestSimplePage() {
  const router = useRouter();

  // 오디오 관련 상태
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [audioCaptureState, setAudioCaptureState] = useState<AudioCaptureState | null>(null);
  const [recordButtonState, setRecordButtonState] = useState<RecordButtonState>('idle');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 오디오 레코더
  const audioRecorderRef = useRef(createAudioRecorder({ maxDuration: 30000 })); // 30초로 단축
  const realtimeControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    initializeMicrophone();
  }, []);

  useEffect(() => {
    return () => {
      if (audioCaptureState) {
        stopAudioStream(audioCaptureState);
      }
      audioRecorderRef.current.cleanup();
      
      if (realtimeControllerRef.current) {
        realtimeControllerRef.current.abort();
      }
    };
  }, [audioCaptureState]);

  /**
   * 마이크 초기화
   */
  const initializeMicrophone = async () => {
    try {
      console.log('🎤 마이크 권한 요청 중...');
      const { stream } = await requestMicrophoneAccess();
      const captureState = startAudioStream(stream);
      setAudioCaptureState(captureState);
      setPermissionGranted(true);
      console.log('✅ 마이크 권한 획득 완료');
    } catch (error: unknown) {
      console.error('❌ 마이크 권한 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '마이크 권한 오류가 발생했습니다.';
      setError(`마이크 권한 오류: ${errorMessage}`);
    }
  };

  /**
   * 녹음 시작
   */
  const startRecording = () => {
    try {
      if (!audioCaptureState || !audioCaptureState.stream) {
        throw new Error('오디오 스트림을 사용할 수 없습니다.');
      }

      console.log('🔴 녹음 시작...');
      setRecognizedText('');
      setError(null);

      audioRecorderRef.current.startRecording(audioCaptureState.stream);
      setIsRecording(true);
      setRecordButtonState('recording');

    } catch (error: unknown) {
      console.error('❌ 녹음 시작 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '녹음 시작 오류가 발생했습니다.';
      setError(`녹음 시작 오류: ${errorMessage}`);
    }
  };

  /**
   * 녹음 중지 및 전사
   */
  const stopRecording = async () => {
    try {
      console.log('🛑 녹음 중지...');

      audioRecorderRef.current.stopRecording();
      setIsRecording(false);
      setRecordButtonState('processing');
      setIsTranscribing(true);

      const audioFile = audioRecorderRef.current.getRecordedFile('voice-test.webm');
      if (!audioFile) {
        throw new Error('녹음된 오디오를 가져올 수 없습니다.');
      }

      // 음성 전사
      realtimeControllerRef.current = await startRealtimeTranscription(audioFile, {
        onTextUpdate: (deltaText, fullText) => {
          setRecognizedText(fullText);
        },
        onComplete: (finalText) => {
          console.log('✅ 전사 완료:', finalText);
          setRecognizedText(finalText);
          setIsTranscribing(false);
          setRecordButtonState('idle');
          audioRecorderRef.current.cleanup();
        },
        onError: (error) => {
          console.error('❌ 전사 오류:', error);
          setError(error);
          setIsTranscribing(false);
          setRecordButtonState('idle');
          audioRecorderRef.current.cleanup();
        }
      });

    } catch (error: unknown) {
      console.error('❌ 녹음 중지 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '녹음 중지 오류가 발생했습니다.';
      setError(`녹음 중지 오류: ${errorMessage}`);
      setRecordButtonState('idle');
      audioRecorderRef.current.cleanup();
    }
  };

  /**
   * 다시 테스트
   */
  const handleRetry = () => {
    setRecognizedText('');
    setError(null);
    setIsTranscribing(false);
    setRecordButtonState('idle');
    
    if (realtimeControllerRef.current) {
      realtimeControllerRef.current.abort();
      realtimeControllerRef.current = null;
    }
    
    audioRecorderRef.current.cleanup();
  };

  /**
   * 다음 단계로 진행
   */
  const handleContinue = () => {
    // 음성 테스트 결과 저장
    if (typeof window !== 'undefined') {
      localStorage.setItem('voiceTestPassed', 'true');
      localStorage.setItem('voiceTestText', recognizedText);
    }
    
    // 음성 면접으로 이동
    router.push('/voice-interview');
  };

  /**
   * 이전 단계로 돌아가기
   */
  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-100 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        
        {/* 헤더 */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="text-center mb-8"
        >
          <motion.button
            onClick={handleBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mb-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">음성 테스트</h1>
          <p className="text-gray-600">마이크가 정상적으로 작동하는지 확인합니다</p>
        </motion.div>

        {/* 마이크 권한 오류 */}
        {error && (
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            className="glass-card bg-red-50 border-red-200 p-6 rounded-2xl mb-6"
          >
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">오류 발생</h3>
                <p className="text-red-800 mb-4">{error}</p>
                <button
                  onClick={initializeMicrophone}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  다시 시도
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* 메인 콘텐츠 */}
        {permissionGranted && (
          <>
            {/* 테스트 안내 */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.1 }}
              className="glass-card p-6 rounded-2xl text-center mb-6"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                간단한 자기소개를 해주세요
              </h2>
              <p className="text-gray-600 mb-4">
                이름, 나이, 직업 또는 전공을 간단히 말씀해주세요
              </p>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium mb-2">💡 예시:</p>
                <p className="text-sm text-gray-700 italic">
                  &ldquo;안녕하세요. 저는 김철수입니다. 올해 25살이고, 컴퓨터공학을 전공하고 있습니다.&rdquo;
                </p>
              </div>
            </motion.div>

            {/* 녹음 영역 */}
            <motion.div
              variants={scaleIn}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.2 }}
              className="glass-card p-8 rounded-2xl text-center"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-6">
                음성으로 답변해주세요
              </h3>
              
              <div className="mb-6">
                <RecordButton
                  state={recordButtonState}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={!permissionGranted}
                />
              </div>

              {isRecording && (
                <div className="mb-4">
                  <p className="text-red-600 font-medium animate-pulse">
                    🎤 녹음 중... 말씀을 마치시면 버튼을 다시 눌러주세요
                  </p>
                </div>
              )}

              {isTranscribing && (
                <div className="mb-4">
                  <div className="flex items-center justify-center space-x-2 text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-medium">음성을 텍스트로 변환 중...</span>
                  </div>
                </div>
              )}

              {recognizedText && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">인식된 텍스트:</h4>
                  <p className="text-gray-800">&ldquo;{recognizedText}&rdquo;</p>
                </div>
              )}

              {/* 액션 버튼들 */}
              {recognizedText && !isTranscribing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 mt-6 justify-center"
                >
                  <motion.button
                    onClick={handleRetry}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                  >
                    다시 테스트
                  </motion.button>
                  
                  <motion.button
                    onClick={handleContinue}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                  >
                    음성 면접 시작
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
