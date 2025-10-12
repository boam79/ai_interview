/**
 * 면접 요약 API
 * POST /api/interview/summary
 * 
 * 면접 종료 후 AI 요약 및 피드백 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { requestInterviewSummary } from '@/utils/assistantAPI';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('[API] 면접 요약 요청 받음');
    
    // Request body 파싱
    const body = await request.json();
    const { threadId, assistantId } = body;
    
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
    
    console.log(`[API] Thread ID: ${threadId}`);
    console.log(`[API] Assistant ID: ${assistantId}`);
    
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
    
    // 면접 요약 요청 (60초 타임아웃)
    const summary = await requestInterviewSummary(threadId, assistantId);
    
    const responseTime = Date.now() - startTime;
    console.log(`[API] 요약 생성 완료 - 응답 시간: ${responseTime}ms`);
    console.log(`[API] 요약 길이: ${summary?.length || 0}자`);
    
    // 요약에서 강점과 개선점 분리 (옵션)
    // 간단한 키워드 기반 분리
    let feedback = '';
    let strengths = '';
    let improvements = '';
    
    if (summary) {
      // 전체 요약을 feedback으로 사용
      feedback = summary;
      
      // 강점 추출 시도
      const strengthsMatch = summary.match(/강점|잘한 점|우수|긍정적|장점[\s\S]*?(?=개선|부족|약점|제안|\n\n|$)/i);
      if (strengthsMatch) {
        strengths = strengthsMatch[0].trim();
      }
      
      // 개선점 추출 시도
      const improvementsMatch = summary.match(/개선|부족|약점|제안|발전[\s\S]*?(?=\n\n|$)/i);
      if (improvementsMatch) {
        improvements = improvementsMatch[0].trim();
      }
    }
    
    // 성공 응답
    return NextResponse.json({
      success: true,
      summary,
      feedback,
      strengths,
      improvements,
      responseTime,
    });
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error('[API] 요약 생성 실패:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || '요약 생성 중 오류가 발생했습니다.',
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

