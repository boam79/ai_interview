/**
 * Simple Interview API
 * 
 * OpenAI Assistant API 대신 Chat Completions API를 사용하여 더 안정적인 면접 시스템 구현
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface InterviewSession {
  sessionId: string;
  phoneNumber: string;
  questions: string[];
  answers: string[];
  currentQuestionIndex: number;
  status: 'active' | 'completed';
  createdAt: string;
}

/**
 * 면접 시작 - Chat Completions API 사용
 */
export async function startSimpleInterview(
  phoneNumber: string,
  initialMessage?: string
): Promise<{ sessionId: string; firstQuestion: string }> {
  try {
    console.log('[SimpleInterview] 면접 시작...');
    
    // 세션 ID 생성
    const sessionId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 첫 질문 생성
    const firstQuestion = await generateFirstQuestion(phoneNumber, initialMessage);
    
    console.log('[SimpleInterview] 면접 시작 완료:', { sessionId, firstQuestion });
    
    return { sessionId, firstQuestion };
    
  } catch (error: any) {
    console.error('[SimpleInterview] 면접 시작 실패:', error);
    throw new Error(`면접 시작 실패: ${error.message}`);
  }
}

/**
 * 첫 질문 생성
 */
async function generateFirstQuestion(
  phoneNumber: string,
  initialMessage?: string
): Promise<string> {
  try {
    const prompt = `당신은 AI 면접관입니다. 다음 정보를 바탕으로 첫 번째 면접 질문을 생성해주세요.

전화번호: ${phoneNumber}
${initialMessage ? `사용자 메시지: ${initialMessage}` : ''}

면접 규칙:
1. 한국어로 질문하세요
2. 간단하고 명확한 질문을 하세요
3. 지원자의 이름, 나이, 전공/경력 등 기본 정보를 묻는 질문으로 시작하세요
4. 질문은 1-2문장으로 구성하세요
5. 친근하고 전문적인 톤을 유지하세요

첫 번째 질문만 생성하고, 다른 설명이나 안내는 포함하지 마세요.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // 더 안정적인 모델 사용
      messages: [
        {
          role: 'system',
          content: '당신은 전문적인 AI 면접관입니다. 간단하고 명확한 면접 질문을 생성합니다.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const question = response.choices[0]?.message?.content?.trim();
    
    if (!question) {
      throw new Error('질문 생성에 실패했습니다.');
    }

    console.log('[SimpleInterview] 첫 질문 생성 완료:', question);
    return question;

  } catch (error: any) {
    console.error('[SimpleInterview] 첫 질문 생성 실패:', error);
    
    // 폴백 질문
    return '안녕하세요! 면접에 참여해주셔서 감사합니다. 먼저 간단히 자기소개를 해주시겠어요?';
  }
}

/**
 * 답변 제출 후 다음 질문 생성
 */
export async function submitAnswerAndGetNextQuestion(
  sessionId: string,
  answer: string,
  currentQuestionIndex: number
): Promise<{ nextQuestion: string | null; isComplete: boolean }> {
  try {
    console.log('[SimpleInterview] 답변 처리 중...', { sessionId, currentQuestionIndex });
    
    // 5번째 질문까지 완료했으면 면접 종료
    if (currentQuestionIndex >= 4) {
      return { nextQuestion: null, isComplete: true };
    }
    
    const nextQuestion = await generateNextQuestion(answer, currentQuestionIndex + 1);
    
    console.log('[SimpleInterview] 다음 질문 생성 완료:', nextQuestion);
    
    return { nextQuestion, isComplete: false };
    
  } catch (error: any) {
    console.error('[SimpleInterview] 답변 처리 실패:', error);
    throw new Error(`답변 처리 실패: ${error.message}`);
  }
}

/**
 * 다음 질문 생성
 */
async function generateNextQuestion(
  previousAnswer: string,
  questionNumber: number
): Promise<string> {
  try {
    const prompt = `당신은 AI 면접관입니다. 지원자의 답변을 바탕으로 다음 질문을 생성해주세요.

지원자 답변: ${previousAnswer}
질문 번호: ${questionNumber + 1}/5

면접 규칙:
1. 한국어로 질문하세요
2. 이전 답변과 연관된 심화 질문을 하세요
3. 경력, 기술, 문제해결능력, 협업능력, 목표 등 다양한 영역을 다루세요
4. 질문은 1-2문장으로 구성하세요
5. 친근하고 전문적인 톤을 유지하세요

다음 질문만 생성하고, 다른 설명이나 안내는 포함하지 마세요.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 전문적인 AI 면접관입니다. 지원자의 답변을 바탕으로 심화 질문을 생성합니다.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const question = response.choices[0]?.message?.content?.trim();
    
    if (!question) {
      throw new Error('다음 질문 생성에 실패했습니다.');
    }

    return question;

  } catch (error: any) {
    console.error('[SimpleInterview] 다음 질문 생성 실패:', error);
    
    // 폴백 질문들
    const fallbackQuestions = [
      '이전 경험에서 가장 도전적이었던 프로젝트는 무엇이었나요?',
      '팀워크가 중요하다고 생각하시나요? 관련 경험을 말씀해주세요.',
      '향후 5년 후 어떤 모습이 되고 싶으신가요?',
      '마지막으로 우리 회사에 대해 궁금한 점이 있으신가요?'
    ];
    
    const questionIndex = Math.min(questionNumber, fallbackQuestions.length - 1);
    return fallbackQuestions[questionIndex];
  }
}

/**
 * 면접 요약 생성
 */
export async function generateInterviewSummary(
  sessionId: string,
  questions: string[],
  answers: string[]
): Promise<string> {
  try {
    console.log('[SimpleInterview] 면접 요약 생성 중...');
    
    const conversationText = questions.map((q, i) => 
      `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i] || '답변 없음'}`
    ).join('\n\n');

    const prompt = `다음 면접 내용을 바탕으로 종합적인 피드백을 작성해주세요.

면접 내용:
${conversationText}

피드백 요구사항:
1. 한국어로 작성하세요
2. 지원자의 강점과 개선점을 균형있게 평가하세요
3. 구체적인 조언을 포함하세요
4. 격려의 메시지로 마무리하세요
5. 3-4문단으로 구성하세요

피드백:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 전문적인 면접관입니다. 지원자에게 건설적이고 도움이 되는 피드백을 제공합니다.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const summary = response.choices[0]?.message?.content?.trim();
    
    if (!summary) {
      throw new Error('면접 요약 생성에 실패했습니다.');
    }

    console.log('[SimpleInterview] 면접 요약 생성 완료');
    return summary;

  } catch (error: any) {
    console.error('[SimpleInterview] 면접 요약 생성 실패:', error);
    
    // 폴백 요약
    return `면접에 참여해주셔서 감사합니다. 

지원자님의 답변을 통해 기본적인 소통 능력과 의지를 확인할 수 있었습니다. 

앞으로 더 구체적인 경험과 예시를 포함하여 답변하시면 더욱 인상적인 면접이 될 것입니다.

지원자님의 성공을 응원합니다!`;
  }
}
