/**
 * 면접 세션 데이터 관리 유틸리티
 * localStorage를 활용한 면접 데이터 저장/불러오기
 */

// 면접 상태 타입
export type InterviewState = 
  | 'preparing'       // 준비 중 (체크리스트)
  | 'starting'        // 시작 중 (Thread 생성)
  | 'ai_asking'       // AI 질문 중
  | 'user_answering'  // 사용자 답변 중
  | 'processing'      // AI 응답 처리 중
  | 'completed'       // 면접 완료
  | 'error';          // 에러 발생

// 질문-답변 쌍 타입
export interface QuestionAnswer {
  question: string;
  answer: string;
  timestamp: string;
}

// 면접 세션 데이터 구조
export interface InterviewSession {
  id: string;
  threadId: string;
  phoneNumber: string;
  startTime: string;
  endTime?: string;
  status: InterviewState;
  currentQuestionNumber: number;
  totalQuestions: number;
  questions: QuestionAnswer[];
  summary?: string;
  feedback?: string;
}

// localStorage 키
const STORAGE_KEY = 'interview_session';

/**
 * 새로운 면접 세션 생성
 * @param threadId - Thread ID
 * @param phoneNumber - 전화번호
 * @param totalQuestions - 총 질문 수 (기본: 5)
 * @returns 면접 세션
 */
export function createInterviewSession(
  threadId: string,
  phoneNumber: string,
  totalQuestions: number = 5
): InterviewSession {
  const session: InterviewSession = {
    id: `interview_${Date.now()}`,
    threadId,
    phoneNumber,
    startTime: new Date().toISOString(),
    status: 'starting',
    currentQuestionNumber: 0,
    totalQuestions,
    questions: [],
  };
  
  console.log('[InterviewStorage] 새 세션 생성:', session.id);
  return session;
}

/**
 * 면접 세션 저장
 * @param session - 면접 세션
 */
export function saveInterviewSession(session: InterviewSession): void {
  try {
    const serialized = JSON.stringify(session);
    localStorage.setItem(STORAGE_KEY, serialized);
    console.log('[InterviewStorage] 세션 저장 완료:', session.id);
  } catch (error) {
    console.error('[InterviewStorage] 세션 저장 실패:', error);
    throw new Error('면접 세션 저장에 실패했습니다.');
  }
}

/**
 * 면접 세션 불러오기
 * @returns 면접 세션 또는 null
 */
export function loadInterviewSession(): InterviewSession | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    
    if (!serialized) {
      console.log('[InterviewStorage] 저장된 세션이 없습니다.');
      return null;
    }
    
    const session: InterviewSession = JSON.parse(serialized);
    console.log('[InterviewStorage] 세션 불러오기 완료:', session.id);
    return session;
    
  } catch (error) {
    console.error('[InterviewStorage] 세션 불러오기 실패:', error);
    return null;
  }
}

/**
 * 면접 세션 삭제
 */
export function clearInterviewSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[InterviewStorage] 세션 삭제 완료');
  } catch (error) {
    console.error('[InterviewStorage] 세션 삭제 실패:', error);
  }
}

/**
 * 질문-답변 추가
 * @param session - 면접 세션
 * @param question - 질문
 * @param answer - 답변
 * @returns 업데이트된 세션
 */
export function addQuestionAnswer(
  session: InterviewSession,
  question: string,
  answer: string
): InterviewSession {
  const qa: QuestionAnswer = {
    question,
    answer,
    timestamp: new Date().toISOString(),
  };
  
  const updatedSession: InterviewSession = {
    ...session,
    questions: [...session.questions, qa],
    currentQuestionNumber: session.currentQuestionNumber + 1,
  };
  
  console.log('[InterviewStorage] Q&A 추가:', {
    questionNumber: updatedSession.currentQuestionNumber,
    total: updatedSession.totalQuestions,
  });
  
  return updatedSession;
}

/**
 * 면접 상태 업데이트
 * @param session - 면접 세션
 * @param status - 새로운 상태
 * @returns 업데이트된 세션
 */
export function updateInterviewStatus(
  session: InterviewSession,
  status: InterviewState
): InterviewSession {
  const updatedSession: InterviewSession = {
    ...session,
    status,
  };
  
  // 완료 상태일 경우 종료 시간 기록
  if (status === 'completed') {
    updatedSession.endTime = new Date().toISOString();
  }
  
  console.log('[InterviewStorage] 상태 업데이트:', status);
  return updatedSession;
}

/**
 * 면접 요약 및 피드백 추가
 * @param session - 면접 세션
 * @param summary - 요약
 * @param feedback - 피드백 (옵션)
 * @returns 업데이트된 세션
 */
export function addSummaryAndFeedback(
  session: InterviewSession,
  summary: string,
  feedback?: string
): InterviewSession {
  const updatedSession: InterviewSession = {
    ...session,
    summary,
    feedback,
    status: 'completed',
    endTime: new Date().toISOString(),
  };
  
  console.log('[InterviewStorage] 요약 및 피드백 추가');
  return updatedSession;
}

/**
 * 면접 소요 시간 계산 (초)
 * @param session - 면접 세션
 * @returns 소요 시간 (초)
 */
export function calculateDuration(session: InterviewSession): number {
  const startTime = new Date(session.startTime).getTime();
  const endTime = session.endTime 
    ? new Date(session.endTime).getTime()
    : Date.now();
  
  const durationMs = endTime - startTime;
  const durationSeconds = Math.floor(durationMs / 1000);
  
  return durationSeconds;
}

/**
 * 면접 진행률 계산 (%)
 * @param session - 면접 세션
 * @returns 진행률 (0-100)
 */
export function calculateProgress(session: InterviewSession): number {
  if (session.totalQuestions === 0) return 0;
  
  const progress = (session.currentQuestionNumber / session.totalQuestions) * 100;
  return Math.min(100, Math.round(progress));
}

/**
 * 면접 세션을 Webhook 전송 형식으로 변환
 * @param session - 면접 세션
 * @returns Webhook 페이로드
 */
export function convertToWebhookPayload(session: InterviewSession) {
  return {
    sessionId: session.id,
    phoneNumber: session.phoneNumber,
    interviewDate: session.startTime,
    duration: calculateDuration(session),
    questionCount: session.questions.length,
    totalQuestions: session.totalQuestions,
    questions: session.questions.map((qa, index) => ({
      number: index + 1,
      question: qa.question,
      answer: qa.answer,
      timestamp: qa.timestamp,
    })),
    summary: session.summary || '',
    feedback: session.feedback || '',
    status: session.status,
    completedAt: session.endTime || new Date().toISOString(),
  };
}

/**
 * 면접 세션 데이터 유효성 검증
 * @param session - 면접 세션
 * @returns 유효 여부
 */
export function validateSession(session: InterviewSession): boolean {
  try {
    if (!session.id || !session.threadId || !session.phoneNumber) {
      console.error('[InterviewStorage] 필수 필드 누락');
      return false;
    }
    
    if (!session.startTime || isNaN(new Date(session.startTime).getTime())) {
      console.error('[InterviewStorage] 시작 시간 형식 오류');
      return false;
    }
    
    if (session.currentQuestionNumber < 0 || session.totalQuestions <= 0) {
      console.error('[InterviewStorage] 질문 번호 오류');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[InterviewStorage] 유효성 검증 오류:', error);
    return false;
  }
}

/**
 * 면접 세션을 JSON 파일로 다운로드
 * @param session - 면접 세션
 */
export function downloadSessionAsJSON(session: InterviewSession): void {
  try {
    const dataStr = JSON.stringify(session, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `interview_${session.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    console.log('[InterviewStorage] JSON 다운로드 완료');
  } catch (error) {
    console.error('[InterviewStorage] JSON 다운로드 실패:', error);
  }
}

/**
 * 면접 세션 포맷팅된 텍스트로 변환
 * @param session - 면접 세션
 * @returns 포맷팅된 텍스트
 */
export function formatSessionAsText(session: InterviewSession): string {
  const duration = calculateDuration(session);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  
  let text = `=== AI 면접 기록 ===\n\n`;
  text += `면접 ID: ${session.id}\n`;
  text += `전화번호: ${session.phoneNumber}\n`;
  text += `시작 시간: ${new Date(session.startTime).toLocaleString('ko-KR')}\n`;
  text += `소요 시간: ${minutes}분 ${seconds}초\n`;
  text += `질문 수: ${session.questions.length} / ${session.totalQuestions}\n`;
  text += `상태: ${session.status}\n\n`;
  
  text += `=== 질문 및 답변 ===\n\n`;
  session.questions.forEach((qa, index) => {
    text += `[질문 ${index + 1}]\n`;
    text += `${qa.question}\n\n`;
    text += `[답변]\n`;
    text += `${qa.answer}\n\n`;
    text += `---\n\n`;
  });
  
  if (session.summary) {
    text += `=== AI 요약 ===\n\n`;
    text += `${session.summary}\n\n`;
  }
  
  if (session.feedback) {
    text += `=== 피드백 ===\n\n`;
    text += `${session.feedback}\n\n`;
  }
  
  return text;
}

