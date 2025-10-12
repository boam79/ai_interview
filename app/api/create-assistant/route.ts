/**
 * Assistant 생성 API
 * POST /api/create-assistant
 * 
 * 새로운 면접용 Assistant를 생성합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createInterviewAssistant, listAssistants } from '@/utils/createAssistant';

export async function POST() {
  const startTime = Date.now();
  
  try {
    console.log('[API] Assistant 생성 요청 받음');
    
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
    
    // 새로운 Assistant 생성
    const assistantId = await createInterviewAssistant();
    
    const responseTime = Date.now() - startTime;
    console.log(`[API] Assistant 생성 완료 - 응답 시간: ${responseTime}ms`);
    console.log(`[API] 생성된 Assistant ID: ${assistantId}`);
    
    // 성공 응답
    return NextResponse.json({
      success: true,
      assistantId,
      responseTime,
    });
    
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime;
    console.error('[API] Assistant 생성 실패:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Assistant 생성 중 오류가 발생했습니다.';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        responseTime,
      },
      { status: 500 }
    );
  }
}

/**
 * 기존 Assistant 목록 조회
 * GET /api/create-assistant
 */
export async function GET() {
  try {
    console.log('[API] Assistant 목록 조회 요청 받음');
    
    // OpenAI API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'OpenAI API 키가 설정되지 않았습니다.' 
        },
        { status: 500 }
      );
    }
    
    // Assistant 목록 조회
    const assistants = await listAssistants();
    
    console.log(`[API] ${assistants.length}개의 Assistant 조회됨`);
    
    return NextResponse.json({
      success: true,
      assistants: assistants.map(assistant => ({
        id: assistant.id,
        name: assistant.name,
        created_at: assistant.created_at,
      })),
    });
    
  } catch (error: unknown) {
    console.error('[API] Assistant 목록 조회 실패:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Assistant 목록 조회 중 오류가 발생했습니다.';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
