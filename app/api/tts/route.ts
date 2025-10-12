import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    console.log('[TTS API] Text-to-Speech 요청 받음');

    const body = await request.json();
    const { text, voice = 'alloy' } = body;

    console.log('[TTS API] 요청 파라미터:', { 
      textLength: text?.length || 0, 
      voice,
      hasApiKey: !!process.env.OPENAI_API_KEY 
    });

    if (!text) {
      console.error('[TTS API] 텍스트가 제공되지 않음');
      return NextResponse.json(
        { success: false, error: '텍스트가 필요합니다.' },
        { status: 400 }
      );
    }

    // API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      console.error('[TTS API] OPENAI_API_KEY가 설정되지 않음');
      return NextResponse.json(
        { success: false, error: 'API 설정에 문제가 있습니다.' },
        { status: 500 }
      );
    }

    console.log('[TTS API] TTS 생성 중...', { text: text.substring(0, 50) + '...' });
    
    // OpenAI TTS API 호출
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: text,
      response_format: 'mp3',
    }).catch((apiError) => {
      console.error('[TTS API] OpenAI API 호출 실패:', {
        error: apiError.message,
        status: apiError.status,
        type: apiError.type,
        code: apiError.code
      });
      throw apiError;
    });

    // MP3 데이터를 Buffer로 변환
    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    console.log('[TTS API] TTS 생성 완료, 크기:', buffer.length, 'bytes');

    // MP3 파일로 응답
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600', // 1시간 캐시
      },
    });

  } catch (error: unknown) {
    console.error('[TTS API] TTS 생성 실패:', error);
    
    const errorMessage = error instanceof Error ? error.message : '음성 변환에 실패했습니다.';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
