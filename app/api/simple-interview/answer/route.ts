import { NextRequest, NextResponse } from 'next/server';
import { submitAnswerAndGetNextQuestion } from '@/utils/simpleInterviewAPI';

export async function POST(request: NextRequest) {
  try {
    console.log('[SimpleInterview API] 답변 제출 요청 받음');

    const body = await request.json();
    const { sessionId, answer, currentQuestionIndex } = body;

    if (!sessionId || answer === undefined || currentQuestionIndex === undefined) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'API 설정에 문제가 있습니다.' },
        { status: 500 }
      );
    }

    console.log('[SimpleInterview API] 답변 처리 중...');
    
    const result = await submitAnswerAndGetNextQuestion(
      sessionId, 
      answer, 
      currentQuestionIndex
    );
    
    console.log('[SimpleInterview API] 답변 처리 성공:', result);

    return NextResponse.json({
      success: true,
      nextQuestion: result.nextQuestion,
      isComplete: result.isComplete,
    });

  } catch (error: any) {
    console.error('[SimpleInterview API] 답변 처리 실패:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || '답변 처리에 실패했습니다.' 
      },
      { status: 500 }
    );
  }
}
