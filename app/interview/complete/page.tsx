'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import SummaryCard from '@/components/interview/SummaryCard';
import {
  loadInterviewSession,
  clearInterviewSession,
  calculateDuration,
  convertToWebhookPayload,
  downloadSessionAsJSON,
  formatSessionAsText,
} from '@/utils/interviewStorage';

// Assistant ID
const ASSISTANT_ID = process.env.NEXT_PUBLIC_ASSISTANT_ID || 'asst_OlLKyHNaaV2advhMrngOvxah';
// Webhook URL
const WEBHOOK_URL = 'https://hook.us2.make.com/97ph54bk97cl3o9y69curj5zfmmhfsli';

export default function InterviewCompletePage() {
  const router = useRouter();
  
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [summary, setSummary] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [isWebhookSent, setIsWebhookSent] = useState(false);

  useEffect(() => {
    loadSummaryAndSendWebhook();
  }, []);

  /**
   * 요약 로드 및 Webhook 전송
   */
  const loadSummaryAndSendWebhook = async () => {
    try {
      console.log('[Complete] 면접 세션 로드...');
      
      // 세션 로드
      const session = loadInterviewSession();
      if (!session) {
        throw new Error('면접 세션을 찾을 수 없습니다.');
      }

      console.log('[Complete] 세션 로드 완료:', session.id);
      
      // 소요 시간 및 질문 수 계산
      const calculatedDuration = calculateDuration(session);
      setDuration(calculatedDuration);
      setQuestionCount(session.questions.length);

      // AI 요약 생성
      console.log('[Complete] AI 요약 생성 요청...');
      const summaryResponse = await fetch('/api/interview/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: session.threadId,
          assistantId: ASSISTANT_ID,
        }),
      });

      if (!summaryResponse.ok) {
        console.warn('[Complete] 요약 생성 실패, 기본 요약 사용');
        setSummary('면접이 완료되었습니다. 수고하셨습니다!');
        setFeedback('AI 요약 생성 중 오류가 발생했습니다.');
      } else {
        const summaryData = await summaryResponse.json();
        if (summaryData.success && summaryData.summary) {
          console.log('[Complete] AI 요약 생성 완료');
          setSummary(summaryData.summary);
          setFeedback(summaryData.feedback || summaryData.summary);
        } else {
          setSummary('면접이 완료되었습니다. 수고하셨습니다!');
          setFeedback(summaryData.error || '요약을 생성할 수 없습니다.');
        }
      }

      // Webhook 전송
      console.log('[Complete] Webhook 전송...');
      const webhookPayload = convertToWebhookPayload(session);
      
      try {
        const webhookResponse = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload),
        });

        if (webhookResponse.ok) {
          console.log('[Complete] Webhook 전송 성공');
          setIsWebhookSent(true);
        } else {
          console.warn('[Complete] Webhook 전송 실패:', webhookResponse.status);
        }
      } catch (webhookError) {
        console.error('[Complete] Webhook 전송 오류:', webhookError);
      }

      setIsLoadingSummary(false);

    } catch (error: any) {
      console.error('[Complete] 요약 로드 실패:', error);
      setError(error.message || '면접 결과를 불러올 수 없습니다.');
      setIsLoadingSummary(false);
    }
  };

  /**
   * 홈으로 돌아가기
   */
  const handleGoHome = () => {
    clearInterviewSession();
    router.push('/');
  };

  /**
   * JSON 다운로드
   */
  const handleDownloadJSON = () => {
    const session = loadInterviewSession();
    if (session) {
      downloadSessionAsJSON(session);
    }
  };

  /**
   * 텍스트 다운로드
   */
  const handleDownloadText = () => {
    const session = loadInterviewSession();
    if (!session) return;

    const text = formatSessionAsText(session);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `interview_${session.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 로딩 화면
  if (isLoadingSummary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4 sm:mb-6"
          />
          <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium">
            면접 결과를 분석하고 있습니다...
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            AI가 피드백을 생성하고 있습니다
          </p>
        </motion.div>
      </div>
    );
  }

  // 에러 화면
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/20 text-center"
        >
          <div className="text-5xl sm:text-6xl mb-4">❌</div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">
            오류가 발생했습니다
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            {error}
          </p>
          <button
            onClick={handleGoHome}
            className="px-6 py-3 rounded-2xl text-sm sm:text-base font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
          >
            처음으로 돌아가기
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-xs sm:max-w-xl md:max-w-3xl lg:max-w-5xl mx-auto">

        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 sm:mb-8 md:mb-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="inline-block text-5xl sm:text-6xl md:text-7xl mb-3 sm:mb-4"
          >
            🎉
          </motion.div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            면접 완료!
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600">
            수고하셨습니다. AI 피드백을 확인해보세요.
          </p>
        </motion.div>

        {/* 통계 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8"
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 sm:p-4 md:p-6 border border-white/20 text-center">
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">⏱️</div>
            <div className="text-xs sm:text-sm text-white/60 mb-1">소요 시간</div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
              {Math.floor(duration / 60)}분 {duration % 60}초
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 sm:p-4 md:p-6 border border-white/20 text-center">
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">💬</div>
            <div className="text-xs sm:text-sm text-white/60 mb-1">질문 수</div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
              {questionCount}개
            </div>
          </div>
        </motion.div>

        {/* AI 요약 */}
        <div className="space-y-3 sm:space-y-4 md:space-y-6 mb-6 sm:mb-8">
          <SummaryCard
            title="AI 종합 평가"
            content={summary || '평가를 생성하는 중입니다...'}
            icon="📊"
            delay={0.3}
          />
        </div>

        {/* 버튼 그룹 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="space-y-2 sm:space-y-3 md:space-y-4"
        >
          
          {/* 다운로드 버튼 */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleDownloadJSON}
              className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <span>📄</span>
              <span>JSON 다운로드</span>
            </button>
            
            <button
              onClick={handleDownloadText}
              className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <span>📝</span>
              <span>텍스트 다운로드</span>
            </button>
          </div>

          {/* 홈으로 버튼 */}
          <button
            onClick={handleGoHome}
            className="w-full px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg"
          >
            처음으로 돌아가기
          </button>
        </motion.div>

        {/* Webhook 전송 상태 */}
        {isWebhookSent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-green-500/20 backdrop-blur-xl border border-green-500/30 text-center"
          >
            <p className="text-xs sm:text-sm text-green-200">
              ✅ 면접 결과가 성공적으로 전송되었습니다
            </p>
          </motion.div>
        )}

      </div>
    </div>
  );
}

