/**
 * 답변 제출 API
 * POST /api/interview/answer
 * 
 * 사용자 답변 전송 + 다음 질문 받기
 */

import { NextRequest, NextResponse } from 'next/server';
import { submitAnswerAndGetNextQuestion } from '@/utils/assistantAPI';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('[API] 답변 제출 요청 받음');
    
    // Request body 파싱
    const body = await request.json();
    const { threadId, assistantId, answer } = body;
    
    // 입력 검증
    if (!threadId || typeof threadId !== 'string') {
      console.error('[API] Thread ID가 제공되지 않음');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Thread ID가 필요합니다.' 
        },
        { status: 400 }
      );
    }
    
    if (!assistantId || typeof assistantId !== 'string') {
      console.error('[API] Assistant ID가 제공되지 않음');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Assistant ID가 필요합니다.' 
        },
        { status: 400 }
      );
    }
    
    if (!answer || typeof answer !== 'string') {
      console.error('[API] 답변이 제공되지 않음');
      return NextResponse.json(
        { 
          success: false, 
          error: '답변이 필요합니다.' 
        },
        { status: 400 }
      );
    }
    
    console.log(`[API] Thread ID: ${threadId}`);
    console.log(`[API] 답변 길이: ${answer.length}자`);
    
    // OpenAI API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      console.error('[API] OpenAI API 키가 설정되지 않음');
      return NextResponse.json(
        { 
          success: false, 
          error: 'OpenAI API 키가 설정되지 않았습니다.' 
        },
        { status: 500 }
      );
    }
    
    // 답변 제출 + 다음 질문 받기
    const nextQuestion = await submitAnswerAndGetNextQuestion(
      threadId,
      assistantId,
      answer
    );
    
    const responseTime = Date.now() - startTime;
    console.log(`[API] 답변 제출 완료 - 응답 시간: ${responseTime}ms`);
    console.log(`[API] 다음 질문: ${nextQuestion?.substring(0, 100)}...`);
    
    // 면접 종료 여부 확인
    // AI가 "면접을 종료", "감사합니다", "마지막" 등의 키워드를 포함하면 종료로 간주
    const isCompleted = nextQuestion 
      ? /종료|마지막|감사합니다|끝|완료/i.test(nextQuestion)
      : false;
    
    if (isCompleted) {
      console.log('[API] 면접 종료 감지됨');
    }
    
    // 성공 응답
    return NextResponse.json({
      success: true,
      nextQuestion,
      isCompleted,
      responseTime,
    });
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error('[API] 답변 제출 실패:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || '답변 제출 중 오류가 발생했습니다.',
        responseTime,
      },
      { status: 500 }
    );
  }
}

// OPTIONS 메서드 (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

