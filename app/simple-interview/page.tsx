'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// Simple Interview API를 사용하는 새로운 면접 페이지
export default function SimpleInterviewPage() {
  const router = useRouter();

  // 상태 관리
  const [interviewState, setInterviewState] = useState<'starting' | 'active' | 'completed' | 'error'>('starting');
  const [sessionId, setSessionId] = useState<string>('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [summary, setSummary] = useState<string>('');

  useEffect(() => {
    initializeInterview();
  }, []);

  /**
   * 면접 초기화
   */
  const initializeInterview = async () => {
    try {
      console.log('[SimpleInterview] 면접 초기화 시작...');
      
      // 전화번호 가져오기
      const phoneNumber = localStorage.getItem('phoneNumber') || '010-0000-0000';
      console.log('[SimpleInterview] 전화번호:', phoneNumber);
      
      console.log('[SimpleInterview] Simple Interview API 호출...');
      
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
        const errorText = await response.text();
        console.error('[SimpleInterview] API 응답 오류:', response.status, errorText);
        throw new Error(`면접 시작 API 호출 실패 (${response.status}): ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '면접 시작에 실패했습니다.');
      }

      // 세션 정보 설정
      setSessionId(result.sessionId);
      setQuestions([result.firstQuestion]);
      setInterviewState('active');

      console.log('[SimpleInterview] 면접 초기화 완료!');

    } catch (error: any) {
      console.error('[SimpleInterview] 면접 초기화 실패:', error);
      setError(error.message || '면접 시작에 실패했습니다.');
      setInterviewState('error');
    }
  };

  /**
   * 답변 제출
   */
  const submitAnswer = async () => {
    if (!currentAnswer.trim()) return;

    setIsLoading(true);

    try {
      console.log('[SimpleInterview] 답변 제출 중...');
      
      const response = await fetch('/api/simple-interview/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          answer: currentAnswer,
          currentQuestionIndex,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`답변 제출 실패 (${response.status}): ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '답변 제출에 실패했습니다.');
      }

      // 답변 저장
      const newAnswers = [...answers, currentAnswer];
      setAnswers(newAnswers);
      setCurrentAnswer('');
      setCurrentQuestionIndex(currentQuestionIndex + 1);

      // 다음 질문이 있으면 추가
      if (result.nextQuestion) {
        setQuestions([...questions, result.nextQuestion]);
      }

      // 면접 완료 확인
      if (result.isComplete) {
        await generateSummary(newAnswers);
      }

    } catch (error: any) {
      console.error('[SimpleInterview] 답변 제출 실패:', error);
      setError(error.message || '답변 제출에 실패했습니다.');
      setInterviewState('error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 면접 요약 생성
   */
  const generateSummary = async (finalAnswers: string[]) => {
    try {
      console.log('[SimpleInterview] 면접 요약 생성 중...');
      
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
        const errorText = await response.text();
        throw new Error(`요약 생성 실패 (${response.status}): ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '요약 생성에 실패했습니다.');
      }

      setSummary(result.summary);
      setInterviewState('completed');

    } catch (error: any) {
      console.error('[SimpleInterview] 요약 생성 실패:', error);
      setError(error.message || '요약 생성에 실패했습니다.');
      setInterviewState('error');
    }
  };

  /**
   * 처음으로 돌아가기
   */
  const goHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-100 to-purple-100 flex items-center justify-center p-4">
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
              <h1 className="text-2xl font-bold text-gray-800">면접 준비 중...</h1>
            </div>
            <p className="text-gray-600">AI 면접관이 준비되고 있습니다. 잠시만 기다려주세요.</p>
          </motion.div>
        )}

        {/* 면접 진행 중 */}
        {interviewState === 'active' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* 진행 상황 */}
            <div className="glass-card p-4 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  질문 {currentQuestionIndex + 1}/5
                </span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* 현재 질문 */}
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
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    질문 {currentQuestionIndex + 1}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {questions[currentQuestionIndex]}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* 답변 입력 */}
            <div className="glass-card p-6 rounded-2xl">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">답변을 입력해주세요</h4>
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="여기에 답변을 입력하세요..."
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isLoading}
              />
              <div className="mt-4 flex justify-end">
                <motion.button
                  onClick={submitAnswer}
                  disabled={!currentAnswer.trim() || isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    currentAnswer.trim() && !isLoading
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? '처리 중...' : '답변 제출'}
                </motion.button>
              </div>
            </div>
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
            <h1 className="text-3xl font-bold text-gray-800 mb-4">면접 완료!</h1>
            <p className="text-gray-600 mb-8">수고하셨습니다. 면접 결과를 확인해보세요.</p>
            
            {summary && (
              <div className="text-left bg-white/10 p-6 rounded-xl mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">면접 피드백</h3>
                <div className="text-gray-700 whitespace-pre-line leading-relaxed">
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
            <h1 className="text-3xl font-bold text-gray-800 mb-4">오류가 발생했습니다</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            
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
    </div>
  );
}
