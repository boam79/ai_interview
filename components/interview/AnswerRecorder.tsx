'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WaveformVisualizer from '@/components/voice-test/WaveformVisualizer';
import RealtimeTranscription from '@/components/voice-test/RealtimeTranscription';
import { AudioRecorder } from '@/utils/audioRecorder';
import { requestMicrophoneAccess } from '@/utils/audioCapture';

type RecorderState = 'idle' | 'recording' | 'processing' | 'completed' | 'error';

interface AnswerRecorderProps {
  onAnswerSubmit: (answer: string) => void;
  isDisabled?: boolean;
  questionNumber: number;
}

export default function AnswerRecorder({ 
  onAnswerSubmit, 
  isDisabled = false,
  questionNumber 
}: AnswerRecorderProps) {
  const [recorderState, setRecorderState] = useState<RecorderState>('idle');
  const [transcribedText, setTranscribedText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  // const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // 컴포넌트 마운트 시 AudioRecorder 초기화
  useEffect(() => {
    audioRecorderRef.current = new AudioRecorder();
    
    return () => {
      if (audioRecorderRef.current) {
        audioRecorderRef.current.cleanup();
      }
    };
  }, []);

  // 질문이 바뀔 때마다 초기화
  useEffect(() => {
    setRecorderState('idle');
    setTranscribedText('');
    setErrorMessage('');
  }, [questionNumber]);

  // 녹음 시작
  const handleStartRecording = async () => {
    try {
      setErrorMessage('');
      setTranscribedText('');
      setRecorderState('recording');

      // 마이크 권한 요청 및 녹음 시작 (블루투스 마이크 지원)
      const { stream } = await requestMicrophoneAccess();
      
      if (!audioRecorderRef.current) {
        throw new Error('AudioRecorder가 초기화되지 않았습니다.');
      }

      await audioRecorderRef.current.startRecording(stream);

      // 파형 시각화를 위한 AnalyserNode 생성
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      // dataArray 생성
      const bufferLength = analyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      console.log('✅ 녹음 시작됨');
    } catch (error: unknown) {
      console.error('❌ 녹음 시작 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '녹음을 시작할 수 없습니다.';
      setErrorMessage(errorMessage);
      setRecorderState('error');
    }
  };

  // 녹음 중지 및 음성 인식
  const handleStopRecording = async () => {
    try {
      setRecorderState('processing');
      // setIsAnalyzing(true);

      if (!audioRecorderRef.current) {
        throw new Error('AudioRecorder가 초기화되지 않았습니다.');
      }

      // 녹음 중지
      audioRecorderRef.current.stopRecording();

      // 녹음된 파일 가져오기
      const audioFile = audioRecorderRef.current.getRecordedFile('interview-answer.webm');
      if (!audioFile) {
        throw new Error('녹음된 오디오를 가져올 수 없습니다.');
      }

      console.log('📤 Whisper API로 전송 중...');

      // Whisper API 호출
      const formData = new FormData();
      formData.append('audio', audioFile);

      const response = await fetch('/api/voice-to-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('음성 인식 API 호출 실패');
      }

      const data = await response.json();

      if (!data.success || !data.text) {
        throw new Error(data.error || '음성을 인식할 수 없습니다.');
      }

      console.log('✅ 음성 인식 완료:', data.text);
      
      // 타이핑 효과로 텍스트 표시
      await typeText(data.text);
      
      setRecorderState('completed');
      // setIsAnalyzing(false);

    } catch (error: unknown) {
      console.error('❌ 음성 인식 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '음성 인식 중 오류가 발생했습니다.';
      setErrorMessage(errorMessage);
      setRecorderState('error');
      // setIsAnalyzing(false);
      
      if (audioRecorderRef.current) {
        audioRecorderRef.current.cleanup();
      }
    }
  };

  // 타이핑 효과
  const typeText = async (text: string) => {
    setTranscribedText('');
    const words = text.split('');
    
    for (let i = 0; i < words.length; i++) {
      setTranscribedText(text.substring(0, i + 1));
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  };

  // 답변 제출
  const handleSubmitAnswer = () => {
    if (transcribedText.trim()) {
      console.log('✅ 답변 제출:', transcribedText);
      onAnswerSubmit(transcribedText);
    }
  };

  // 다시 녹음
  const handleRetry = () => {
    setRecorderState('idle');
    setTranscribedText('');
    setErrorMessage('');
    // setIsAnalyzing(false);
    
    if (audioRecorderRef.current) {
      audioRecorderRef.current.cleanup();
    }
  };

  return (
    <div className="w-full space-y-3 sm:space-y-4 md:space-y-6">
      
      {/* 파형 시각화 */}
      {(recorderState === 'recording' || recorderState === 'processing') && analyserRef.current && dataArrayRef.current && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <WaveformVisualizer
            analyser={analyserRef.current}
            dataArray={dataArrayRef.current}
            isRecording={recorderState === 'recording'}
          />
        </motion.div>
      )}

      {/* 실시간 변환 텍스트 */}
      {(recorderState === 'processing' || recorderState === 'completed') && transcribedText && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <RealtimeTranscription
            isRecording={false}
            currentText={transcribedText}
            isProcessing={recorderState === 'processing'}
          />
        </motion.div>
      )}

      {/* 에러 메시지 */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-red-500/20 backdrop-blur-xl border border-red-500/30"
        >
          <p className="text-xs sm:text-sm text-red-200 text-center">
            ⚠️ {errorMessage}
          </p>
        </motion.div>
      )}

      {/* 버튼 영역 */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 md:gap-4">
        
        {/* Idle: 녹음 시작 버튼 */}
        {recorderState === 'idle' && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartRecording}
            disabled={isDisabled}
            className={`
              px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-2xl sm:rounded-3xl
              text-sm sm:text-base font-bold text-white
              ${isDisabled
                ? 'bg-gray-400 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
              }
              backdrop-blur-xl shadow-lg
              transition-all duration-300
              flex items-center space-x-2
            `}
          >
            <span className="text-lg sm:text-xl">🎤</span>
            <span>녹음 시작</span>
          </motion.button>
        )}

        {/* Recording: 중지 버튼 */}
        {recorderState === 'recording' && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStopRecording}
            className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-2xl sm:rounded-3xl text-sm sm:text-base font-bold text-white bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 backdrop-blur-xl shadow-lg transition-all duration-300 flex items-center space-x-2"
          >
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-lg sm:text-xl"
            >
              ⏸️
            </motion.span>
            <span>녹음 중지</span>
          </motion.button>
        )}

        {/* Processing: 로딩 */}
        {recorderState === 'processing' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-2xl sm:rounded-3xl text-sm sm:text-base font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 backdrop-blur-xl shadow-lg flex items-center space-x-3"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
            <span>음성 분석 중...</span>
          </motion.div>
        )}

        {/* Completed: 제출 & 재녹음 버튼 */}
        {recorderState === 'completed' && (
          <>
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmitAnswer}
              className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-2xl sm:rounded-3xl text-sm sm:text-base font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 backdrop-blur-xl shadow-lg transition-all duration-300 flex items-center space-x-2"
            >
              <span className="text-lg sm:text-xl">✅</span>
              <span>답변 제출</span>
            </motion.button>

            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRetry}
              className="px-4 sm:px-6 py-3 sm:py-4 rounded-2xl sm:rounded-3xl text-sm sm:text-base font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 transition-all duration-300 flex items-center space-x-2"
            >
              <span className="text-lg sm:text-xl">🔄</span>
              <span>다시 녹음</span>
            </motion.button>
          </>
        )}

        {/* Error: 재시도 버튼 */}
        {recorderState === 'error' && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRetry}
            className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-2xl sm:rounded-3xl text-sm sm:text-base font-bold text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 backdrop-blur-xl shadow-lg transition-all duration-300 flex items-center space-x-2"
          >
            <span className="text-lg sm:text-xl">🔄</span>
            <span>재시도</span>
          </motion.button>
        )}
      </div>

      {/* 녹음 상태 안내 */}
      <AnimatePresence>
        {recorderState === 'idle' && !isDisabled && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs sm:text-sm text-center text-white/60"
          >
            💡 버튼을 눌러 답변을 녹음해주세요
          </motion.p>
        )}
        
        {recorderState === 'recording' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs sm:text-sm text-center text-white/60"
          >
            🎙️ 녹음 중... 답변을 마치면 중지 버튼을 눌러주세요
          </motion.p>
        )}
      </AnimatePresence>

    </div>
  );
}

