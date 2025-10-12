'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
// import { fadeInUp, scaleIn } from '@/utils/animations';
// import RecordButton, { RecordButtonState } from '@/components/voice-test/RecordButton';
import { requestMicrophoneAccess, startAudioStream, stopAudioStream, AudioCaptureState } from '@/utils/audioCapture';
import { createAudioRecorder } from '@/utils/audioRecorder';
import { startRealtimeTranscription } from '@/utils/realtimeTranscription';

// 음성 면접 페이지
export default function VoiceInterviewPage() {
  const router = useRouter();

  // 상태 관리
  const [interviewState, setInterviewState] = useState<'starting' | 'question' | 'answer' | 'processing' | 'completed' | 'error'>('starting');
  const [sessionId, setSessionId] = useState<string>('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestionText, setCurrentQuestionText] = useState('');
  const [error, setError] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  
  // 오디오 관련 상태
  const [audioCaptureState, setAudioCaptureState] = useState<AudioCaptureState | null>(null);
  const [isRecordingAnswer, setIsRecordingAnswer] = useState<boolean>(false);
  const [answerTranscription, setAnswerTranscription] = useState<string>('');
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  
  // 오디오 레코더
  const audioRecorderRef = useRef(createAudioRecorder({ maxDuration: 60000 }));
  const realtimeControllerRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      initializeInterview();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
   * 면접 초기화
   */
  const initializeInterview = async () => {
    setIsInitializing(true);
    try {
      console.log('[VoiceInterview] 면접 초기화 시작...');
      
      // 마이크 권한 요청
      const { stream } = await requestMicrophoneAccess();
      const captureState = startAudioStream(stream);
      setAudioCaptureState(captureState);
      
      // 전화번호 가져오기
      const phoneNumber = localStorage.getItem('phoneNumber') || '010-0000-0000';
      
      // Simple Interview API로 첫 질문 생성
      const response = await fetch('/api/simple-interview/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
        }),
      });

      if (!response.ok) {
        throw new Error('면접 시작에 실패했습니다.');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '면접 시작에 실패했습니다.');
      }

      // 세션 정보 설정
      setSessionId(result.sessionId);
      setQuestions([result.firstQuestion]);
      setCurrentQuestionText(result.firstQuestion);
      setInterviewState('question');

      console.log('[VoiceInterview] 면접 초기화 완료!', {
        sessionId: result.sessionId,
        firstQuestion: result.firstQuestion,
        questionLength: result.firstQuestion?.length || 0
      });
      
      // 첫 질문 자동 재생
      setAnswerTranscription(''); // 새 질문 시작 시 전사 초기화
      setTimeout(() => {
        playQuestionTTS(result.firstQuestion);
      }, 500);

    } catch (error: unknown) {
      console.error('[VoiceInterview] 면접 초기화 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '면접 시작에 실패했습니다.';
      setError(errorMessage);
      setInterviewState('error');
    } finally {
      setIsInitializing(false);
    }
  };

  /**
   * 질문 TTS로 읽기
   */
  const playQuestionTTS = async (text?: string) => {
    if (isPlayingQuestion) {
      console.log('[VoiceInterview] 이미 TTS 재생 중이므로 건너뛰기');
      return;
    }
    
    try {
      setIsPlayingQuestion(true);
      
      // text 파라미터가 문자열이 아닌 경우 currentQuestionText 사용
      const questionText = (typeof text === 'string' ? text : currentQuestionText);
      
      console.log('[VoiceInterview] 질문 TTS 생성 중...', {
        currentQuestionText,
        passedText: text,
        passedTextType: typeof text,
        finalText: questionText,
        textLength: questionText?.length || 0,
        isEmpty: !questionText,
        currentQuestionIndex,
        questionsLength: questions.length
      });
      
      // 텍스트가 없거나 문자열이 아니면 TTS 건너뛰기
      if (!questionText || typeof questionText !== 'string' || questionText.trim().length === 0) {
        console.warn('[VoiceInterview] 질문 텍스트가 비어있음, TTS 건너뛰기');
        setIsPlayingQuestion(false);
        setInterviewState('answer');
        setRecordButtonState('idle');
        return;
      }
      
      // TTS API 호출
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: questionText,
          voice: 'alloy', // OpenAI TTS 음성 선택
        }),
      });

      if (!response.ok) {
        // 더 자세한 오류 정보 가져오기
        let errorMessage = 'TTS 생성에 실패했습니다.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        console.error('[VoiceInterview] TTS API 오류:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage
        });
        throw new Error(errorMessage);
      }

      // 오디오 데이터를 Blob으로 변환
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // 오디오 재생
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        console.log('[VoiceInterview] 질문 TTS 재생 완료');
        setIsPlayingQuestion(false);
        // 질문 상태 유지 - 자동으로 답변 화면으로 전환하지 않음
        URL.revokeObjectURL(audioUrl); // 메모리 정리
      };
      
      audio.onerror = (error) => {
        console.error('[VoiceInterview] TTS 재생 오류:', error);
        setIsPlayingQuestion(false);
        setError('음성 재생에 실패했습니다.');
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
      console.log('[VoiceInterview] 질문 TTS 재생 시작');
      
    } catch (error: unknown) {
      console.error('[VoiceInterview] TTS 오류:', error);
      setIsPlayingQuestion(false);
      
      // TTS 실패 시에도 질문 상태 유지
      console.warn('[VoiceInterview] TTS 실패, 질문 화면에서 계속 진행');
      
      // 사용자에게 알림 (선택적)
      // setError(`음성 변환 오류: ${error.message}. 텍스트로 진행합니다.`);
    }
  };

  /**
   * 답변 녹음 시작
   */
  const startRecordingAnswer = async () => {
    try {
      if (!audioCaptureState || !audioCaptureState.stream) {
        throw new Error('오디오 스트림을 사용할 수 없습니다.');
      }

      console.log('🔴 답변 녹음 시작...');

      // 이전 결과 초기화
      setAnswerTranscription('');

      // 녹음 시작
      audioRecorderRef.current.startRecording(audioCaptureState.stream);
      setIsRecordingAnswer(true);

    } catch (error: unknown) {
      console.error('❌ 녹음 시작 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '녹음 시작 오류가 발생했습니다.';
      setError(`녹음 시작 오류: ${errorMessage}`);
    }
  };

  /**
   * 답변 녹음 중지 및 전사
   */
  const stopRecordingAnswer = async () => {
    try {
      console.log('🛑 답변 녹음 중지...');

      // 녹음 중지
      audioRecorderRef.current.stopRecording();
      setIsRecordingAnswer(false);

      // 녹음된 파일 가져오기
      const audioFile = audioRecorderRef.current.getRecordedFile('answer.webm');
      if (!audioFile) {
        throw new Error('녹음된 오디오를 가져올 수 없습니다.');
      }

      // 음성 전사
      realtimeControllerRef.current = await startRealtimeTranscription(audioFile, {
        onTextUpdate: () => {
          // 실시간 텍스트 업데이트는 필요시 사용
        },
        onComplete: async (finalText) => {
          console.log('✅ 답변 전사 완료:', finalText);
          setAnswerTranscription(finalText);
          audioRecorderRef.current.cleanup();
          
          // 5번째 질문인 경우 자동으로 면접 요약 시작
          if (currentQuestionIndex >= 4) {
            console.log('[VoiceInterview] 5번째 질문 답변 완료 - 자동 요약 시작');
            setIsGeneratingSummary(true);
            
            try {
              // 답변을 제출하고 요약 생성
              await submitAnswer(finalText);
              
              // 요약 생성 완료 후 피드백 모달 표시
              setShowFeedbackModal(true);
            } catch (error: unknown) {
              console.error('[VoiceInterview] 자동 요약 생성 실패:', error);
              const errorMessage = error instanceof Error ? error.message : '요약 생성에 실패했습니다.';
              setError(errorMessage);
            } finally {
              setIsGeneratingSummary(false);
            }
          } else {
            // 1-4번째 질문: 3초 후 자동으로 다음 질문으로 진행
            console.log('[VoiceInterview] 답변 완료 - 3초 후 자동 진행');
            setTimeout(async () => {
              try {
                await submitAnswer(finalText);
                // submitAnswer에서 자동으로 다음 질문으로 진행됨
              } catch (error: unknown) {
                console.error('[VoiceInterview] 자동 진행 실패:', error);
                const errorMessage = error instanceof Error ? error.message : '다음 질문 진행에 실패했습니다.';
                setError(errorMessage);
              }
            }, 3000);
          }
        },
        onError: (error) => {
          console.error('❌ 전사 오류:', error);
          setError(error);
          audioRecorderRef.current.cleanup();
        }
      });

    } catch (error: unknown) {
      console.error('❌ 녹음 중지 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '녹음 중지 오류가 발생했습니다.';
      setError(`녹음 중지 오류: ${errorMessage}`);
      audioRecorderRef.current.cleanup();
    }
  };

  /**
   * 답변 제출
   */
  const submitAnswer = async (answerText: string) => {

    try {
      console.log('[VoiceInterview] 답변 제출 중...', {
        answerText,
        currentQuestionIndex,
        isLastQuestion: currentQuestionIndex >= 4
      });
      
          // 5번째 질문 (인덱스 4) 이상이면 바로 면접 완료
          if (currentQuestionIndex >= 4) {
            console.log('[VoiceInterview] 5번째 질문 완료 - 면접 종료');
            const newAnswers = [...answers, answerText];
            setAnswers(newAnswers);
            await generateSummary(newAnswers);
            return;
          }
      
      const response = await fetch('/api/simple-interview/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          answer: answerText,
          currentQuestionIndex,
        }),
      });

      if (!response.ok) {
        throw new Error(`답변 제출 실패 (${response.status})`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '답변 제출에 실패했습니다.');
      }

          // 답변 저장
          const newAnswers = [...answers, answerText];
          setAnswers(newAnswers);
          setCurrentQuestionIndex(currentQuestionIndex + 1);

          // 다음 질문이 있으면 추가하고 자동으로 다음 질문으로 진행
          if (result.nextQuestion) {
            setQuestions([...questions, result.nextQuestion]);
            setCurrentQuestionText(result.nextQuestion);
            
            // 다음 질문으로 넘어갈 때 답변 내용 초기화
            setAnswerTranscription('');
            
            // 다음 질문을 바로 TTS로 재생
            console.log('[VoiceInterview] 다음 질문 자동 재생:', {
              nextQuestion: result.nextQuestion,
              currentQuestionIndex: currentQuestionIndex + 1,
              questionsLength: questions.length + 1
            });
            setTimeout(() => {
              playQuestionTTS(result.nextQuestion);
            }, 500);
          } else {
            // 면접 완료
            await generateSummary(newAnswers);
          }

    } catch (error: unknown) {
      console.error('[VoiceInterview] 답변 제출 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '답변 제출에 실패했습니다.';
      setError(errorMessage);
      setInterviewState('error');
    }
  };

  // goToNextQuestion 함수는 자동 진행으로 인해 더 이상 사용되지 않음

  /**
   * 면접 요약 생성
   */
  const generateSummary = async (finalAnswers: string[]) => {
    try {
      console.log('[VoiceInterview] 면접 요약 생성 중...');
      
      const response = await fetch('/api/simple-interview/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          questions,
          answers: finalAnswers,
        }),
      });

      if (!response.ok) {
        throw new Error(`요약 생성 실패 (${response.status})`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '요약 생성에 실패했습니다.');
      }

      setSummary(result.summary);
      // interviewState는 피드백 모달에서 사용자가 확인할 때까지 유지

    } catch (error: unknown) {
      console.error('[VoiceInterview] 요약 생성 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '요약 생성에 실패했습니다.';
      setError(errorMessage);
      setInterviewState('error');
    }
  };

  /**
   * 피드백 보기 확인
   */
  const showFeedback = () => {
    setShowFeedbackModal(false);
    setInterviewState('completed');
  };

  /**
   * 처음으로 돌아가기
   */
  const goHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-100 to-purple-100 dark:from-slate-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        
        {/* 면접 시작 중 */}
        {interviewState === 'starting' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 rounded-2xl text-center"
          >
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">음성 면접 준비 중...</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">AI 면접관이 준비되고 있습니다. 잠시만 기다려주세요.</p>
          </motion.div>
        )}

        {/* 질문 단계 */}
        {interviewState === 'question' && !isGeneratingSummary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* 진행 상황 */}
            <div className="glass-card p-4 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  질문 {currentQuestionIndex + 1}/5
                </span>
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(((currentQuestionIndex + 1) / 5) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* 질문 카드 */}
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6 rounded-2xl"
            >
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                  Q
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    질문 {currentQuestionIndex + 1}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                    {currentQuestionText}
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
                      🔊 AI 면접관이 질문을 음성으로 읽어드립니다
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300">
                      질문을 잘 들으신 후 답변해주세요
                    </p>
                  </div>
                  
                  {/* 답변 전사 표시 */}
                  {answerTranscription && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">답변 내용:</h4>
                      <p className="text-gray-800 dark:text-gray-200">&ldquo;{answerTranscription}&rdquo;</p>
                      {currentQuestionIndex < 4 && (
                        <div className="mt-3 flex items-center justify-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                          <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <span>3초 후 자동으로 다음 질문으로 진행됩니다...</span>
                        </div>
                      )}
                    </motion.div>
                  )}

                  <div className="mt-6 text-center space-y-4">
                    <motion.button
                      onClick={() => playQuestionTTS()}
                      disabled={isPlayingQuestion}
                      whileHover={{ scale: isPlayingQuestion ? 1 : 1.05 }}
                      whileTap={{ scale: isPlayingQuestion ? 1 : 0.95 }}
                      className={`w-full py-4 px-8 rounded-xl font-semibold transition-all duration-200 ${
                        isPlayingQuestion
                          ? 'bg-blue-400 text-white cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {isPlayingQuestion ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>질문 읽는 중...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                          <span>질문 다시 듣기</span>
                        </div>
                      )}
                    </motion.button>
                    
                    {/* 버튼 그룹 */}
                    <div className="flex gap-3">
                      <motion.button
                        onClick={isRecordingAnswer ? stopRecordingAnswer : startRecordingAnswer}
                        disabled={isPlayingQuestion}
                        whileHover={{ scale: isPlayingQuestion ? 1 : 1.05 }}
                        whileTap={{ scale: isPlayingQuestion ? 1 : 0.95 }}
                        className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-200 ${
                          isRecordingAnswer
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-purple-500 text-white hover:bg-purple-600'
                        } ${isPlayingQuestion ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isRecordingAnswer ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                            <span>녹음 중단</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            <span>답변 녹음</span>
                          </div>
                        )}
                      </motion.button>
                      
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* 요약 생성 중 */}
        {isGeneratingSummary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 rounded-2xl text-center"
          >
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">면접 요약 생성 중...</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">AI가 면접 내용을 분석하고 피드백을 준비하고 있습니다.</p>
            <div className="mt-4">
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 처리 중 */}
        {interviewState === 'processing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 rounded-2xl text-center"
          >
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">답변 처리 중...</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">AI가 다음 질문을 준비하고 있습니다.</p>
          </motion.div>
        )}

        {/* 면접 완료 */}
        {interviewState === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 rounded-2xl text-center"
          >
            <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">음성 면접 완료!</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">수고하셨습니다. 면접 결과를 확인해보세요.</p>
            
            {summary && (
              <div className="text-left bg-white/10 dark:bg-gray-800/50 p-6 rounded-xl mb-8">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">면접 피드백</h3>
                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                  {summary}
                </div>
              </div>
            )}

            <motion.button
              onClick={goHome}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              처음으로 돌아가기
            </motion.button>
          </motion.div>
        )}

        {/* 오류 상태 */}
        {interviewState === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 rounded-2xl text-center"
          >
            <div className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">오류가 발생했습니다</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
            
            <motion.button
              onClick={goHome}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-purple-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-600 transition-colors"
            >
              처음으로 돌아가기
            </motion.button>
          </motion.div>
        )}

      </div>

      {/* 피드백 모달 */}
      <AnimatePresence>
        {showFeedbackModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowFeedbackModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="glass-card p-8 rounded-2xl max-w-md w-full text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              면접이 완료되었습니다!
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              AI가 면접 내용을 분석하여 피드백을 준비했습니다.<br />
              피드백을 확인하시겠습니까?
            </p>
            
            <div className="flex space-x-4">
              <motion.button
                onClick={() => setShowFeedbackModal(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-400 transition-colors"
              >
                나중에 보기
              </motion.button>
              
              <motion.button
                onClick={showFeedback}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 bg-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-600 transition-colors"
              >
                피드백 보기
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
