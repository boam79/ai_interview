/**
 * 면접 시작 API
 * POST /api/interview/start
 * 
 * Thread 생성 + 첫 질문 받기
 */

import { NextRequest, NextResponse } from 'next/server';
import { startInterview } from '@/utils/assistantAPI';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('[API] 면접 시작 요청 받음');
    
    // Request body 파싱
    const body = await request.json();
    const { assistantId } = body;
    
    // 입력 검증
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
    
    console.log(`[API] Assistant ID: ${assistantId}`);
    
    // OpenAI API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      console.error('[API] OpenAI API 키가 설정되지 않음');
      return NextResponse.json(
        { 
          success: false, 
          error: 'OpenAI API 키가 설정되지 않았습니다. .env.local 파일에 OPENAI_API_KEY를 설정해주세요.' 
        },
        { status: 500 }
      );
    }
    
    // 면접 시작 (Thread 생성 + 첫 질문)
    const { threadId, firstQuestion } = await startInterview(
      assistantId,
      '안녕하세요! 면접을 시작하겠습니다. 첫 번째 질문을 해주세요.'
    );
    
    const responseTime = Date.now() - startTime;
    console.log(`[API] 면접 시작 완료 - 응답 시간: ${responseTime}ms`);
    console.log(`[API] Thread ID: ${threadId}`);
    console.log(`[API] 첫 질문: ${firstQuestion?.substring(0, 100)}...`);
    
    // 성공 응답
    return NextResponse.json({
      success: true,
      threadId,
      firstQuestion,
      responseTime,
    });
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error('[API] 면접 시작 실패:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || '면접 시작 중 오류가 발생했습니다.',
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

