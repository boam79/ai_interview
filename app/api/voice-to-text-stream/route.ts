import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * POST /api/voice-to-text-stream
 * 
 * Streaming transcription using OpenAI Whisper API
 * Real-time audio to text conversion with streaming response
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🎤 [Streaming Voice-to-Text] Received streaming transcription request');

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      console.error('❌ [Streaming Voice-to-Text] No audio file provided');
      return NextResponse.json(
        { success: false, error: 'No audio file provided' },
        { status: 400 }
      );
    }

    console.log(`📁 [Streaming Voice-to-Text] Audio file received:`, {
      name: audioFile.name,
      type: audioFile.type,
      size: `${(audioFile.size / 1024).toFixed(2)} KB`,
    });

    // Check file size (25MB limit)
    const maxSize = 25 * 1024 * 1024;
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 25MB limit' },
        { status: 413 }
      );
    }

    // Create streaming transcription with simulation
    console.log('🔄 [Streaming Voice-to-Text] Starting streaming transcription...');
    
    // Use regular transcription but simulate streaming
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'ko',
      response_format: 'json',
      // prompt 제거 - 실제 음성 내용을 인식하도록 함
    });

    console.log('✅ [Streaming Voice-to-Text] Transcription result:', transcription.text);

    // Create ReadableStream for simulated streaming response
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const fullText = transcription.text;
          const words = fullText.split(' ');
          let currentText = '';
          
          // Simulate word-by-word streaming
          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const deltaText = i === 0 ? word : ' ' + word;
            currentText += deltaText;
            
            // Send delta text
            const data = JSON.stringify({
              type: 'delta',
              text: deltaText,
              fullText: currentText,
            }) + '\n';
            
            controller.enqueue(new TextEncoder().encode(data));
            
            // Wait between words for realistic streaming effect
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          // Send final result
          const data = JSON.stringify({
            type: 'done',
            text: fullText,
            fullText: fullText,
            duration: Date.now() - startTime,
          }) + '\n';
          
          controller.enqueue(new TextEncoder().encode(data));
          controller.close();
          
        } catch (error: any) {
          console.error('❌ [Streaming Voice-to-Text] Stream error:', error);
          
          const errorData = JSON.stringify({
            type: 'error',
            error: error.message || 'Streaming transcription failed',
          }) + '\n';
          
          controller.enqueue(new TextEncoder().encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error('❌ [Streaming Voice-to-Text] Error:', error);
    console.error(`⏱️ [Streaming Voice-to-Text] Failed after ${duration}ms`);

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to start streaming transcription',
        duration 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}
