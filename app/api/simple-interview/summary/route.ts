import { NextRequest, NextResponse } from 'next/server';
import { generateInterviewSummary } from '@/utils/simpleInterviewAPI';

export async function POST(request: NextRequest) {
  try {
    console.log('[SimpleInterview API] 면접 요약 요청 받음');

    const body = await request.json();
    const { sessionId, questions, answers } = body;

    if (!sessionId || !questions || !answers) {
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

    console.log('[SimpleInterview API] 면접 요약 생성 중...');
    
    const summary = await generateInterviewSummary(sessionId, questions, answers);
    
    console.log('[SimpleInterview API] 면접 요약 생성 성공');

    return NextResponse.json({
      success: true,
      summary: summary,
    });

  } catch (error: any) {
    console.error('[SimpleInterview API] 면접 요약 생성 실패:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || '면접 요약 생성에 실패했습니다.' 
      },
      { status: 500 }
    );
  }
}
