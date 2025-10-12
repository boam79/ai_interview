import { NextRequest, NextResponse } from 'next/server';
import { startSimpleInterview } from '@/utils/simpleInterviewAPI';

export async function POST(request: NextRequest) {
  try {
    console.log('[SimpleInterview API] 면접 시작 요청 받음');

    const body = await request.json();
    const { phoneNumber, initialMessage } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: '전화번호가 필요합니다.' },
        { status: 400 }
      );
    }

    // API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      console.error('[SimpleInterview API] OPENAI_API_KEY가 설정되지 않음');
      return NextResponse.json(
        { success: false, error: 'API 설정에 문제가 있습니다.' },
        { status: 500 }
      );
    }

    console.log('[SimpleInterview API] 면접 시작 처리 중...');
    
    const result = await startSimpleInterview(phoneNumber, initialMessage);
    
    console.log('[SimpleInterview API] 면접 시작 성공:', result);

    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      firstQuestion: result.firstQuestion,
    });

  } catch (error: unknown) {
    console.error('[SimpleInterview API] 면접 시작 실패:', error);
    
    const errorMessage = error instanceof Error ? error.message : '면접 시작에 실패했습니다.';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
