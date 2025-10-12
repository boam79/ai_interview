import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * POST /api/voice-to-text
 * 
 * Transcribes audio to text using OpenAI Whisper API
 * 
 * Request: FormData with 'audio' file
 * Response: { success: boolean, text?: string, error?: string }
 */

// Initialize OpenAI client with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🎤 [Voice-to-Text] Received transcription request');

    // Parse FormData from request
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      console.error('❌ [Voice-to-Text] No audio file provided');
      return NextResponse.json(
        { success: false, error: 'No audio file provided' },
        { status: 400 }
      );
    }

    console.log(`📁 [Voice-to-Text] Audio file received:`, {
      name: audioFile.name,
      type: audioFile.type,
      size: `${(audioFile.size / 1024).toFixed(2)} KB`,
      lastModified: new Date(audioFile.lastModified).toISOString(),
    });

    // Check file size (25MB limit)
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes
    if (audioFile.size > maxSize) {
      console.error('❌ [Voice-to-Text] File too large:', audioFile.size);
      return NextResponse.json(
        { success: false, error: 'File size exceeds 25MB limit' },
        { status: 413 }
      );
    }

    // Validate file type
    const supportedFormats = ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'];
    const fileExtension = audioFile.name.split('.').pop()?.toLowerCase() || '';
    
    if (!supportedFormats.includes(fileExtension)) {
      console.error('❌ [Voice-to-Text] Unsupported format:', fileExtension);
      return NextResponse.json(
        { 
          success: false, 
          error: `Unsupported file format. Supported formats: ${supportedFormats.join(', ')}` 
        },
        { status: 415 }
      );
    }

    // Call OpenAI Whisper API
    console.log('🔄 [Voice-to-Text] Calling Whisper API...');
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1', // Using whisper-1 for Korean support
      language: 'ko', // Specify Korean language
      response_format: 'json',
      // prompt 제거 - 실제 음성 내용을 인식하도록 함
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('✅ [Voice-to-Text] Transcription successful!');
    console.log(`📝 [Voice-to-Text] Result: "${transcription.text}"`);
    console.log(`⏱️ [Voice-to-Text] Duration: ${duration}ms`);

    return NextResponse.json({
      success: true,
      text: transcription.text,
      duration,
    });

  } catch (error: unknown) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error('❌ [Voice-to-Text] Error:', error);
    console.error(`⏱️ [Voice-to-Text] Failed after ${duration}ms`);

    // Handle specific OpenAI errors
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as { status: number; message: string };
      return NextResponse.json(
        { 
          success: false, 
          error: `OpenAI API Error (${apiError.status}): ${apiError.message}` 
        },
        { status: apiError.status }
      );
    }

    // Generic error
    const errorMessage = error instanceof Error ? error.message : 'Failed to transcribe audio';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}

