/**
 * Realtime Transcription Utilities
 * 
 * 실시간 음성 변환을 위한 유틸리티 함수들
 * - 스트리밍 API 호출
 * - 실시간 텍스트 업데이트
 * - 에러 처리
 */

export interface TranscriptionEvent {
  type: 'delta' | 'done' | 'error';
  text?: string;
  fullText?: string;
  error?: string;
  duration?: number;
}

export interface RealtimeTranscriptionOptions {
  onTextUpdate?: (text: string, fullText: string) => void;
  onComplete?: (fullText: string, duration: number) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

/**
 * 실시간 음성 변환 시작
 * @param audioFile 녹음된 오디오 파일
 * @param options 콜백 옵션들
 * @returns AbortController (취소용)
 */
export async function startRealtimeTranscription(
  audioFile: File,
  options: RealtimeTranscriptionOptions = {}
): Promise<AbortController> {
  const abortController = new AbortController();
  
  try {
    console.log('🎤 [Realtime] Starting realtime transcription...');

    // Create FormData
    const formData = new FormData();
    formData.append('audio', audioFile);

    // Start streaming request
    const response = await fetch('/api/voice-to-text-stream', {
      method: 'POST',
      body: formData,
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body received');
    }

    // Process streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    console.log('📡 [Realtime] Processing stream...');

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('✅ [Realtime] Stream completed');
        break;
      }

      // Decode chunk
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          try {
            const event: TranscriptionEvent = JSON.parse(line);
            await handleTranscriptionEvent(event, options);
          } catch (parseError) {
            console.warn('⚠️ [Realtime] Failed to parse event:', line);
          }
        }
      }
    }

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('🛑 [Realtime] Transcription cancelled');
    } else {
      console.error('❌ [Realtime] Transcription error:', error);
      if (options.onError) {
        options.onError(error.message || 'Realtime transcription failed');
      }
    }
  }

  return abortController;
}

/**
 * Handle individual transcription events
 */
async function handleTranscriptionEvent(
  event: TranscriptionEvent,
  options: RealtimeTranscriptionOptions
): Promise<void> {
  switch (event.type) {
    case 'delta':
      if (event.text && event.fullText) {
        console.log('📝 [Realtime] Delta:', event.text);
        if (options.onTextUpdate) {
          options.onTextUpdate(event.text, event.fullText);
        }
      }
      break;

    case 'done':
      if (event.fullText !== undefined && event.duration !== undefined) {
        console.log('✅ [Realtime] Complete:', event.fullText);
        if (options.onComplete) {
          options.onComplete(event.fullText, event.duration);
        }
      }
      break;

    case 'error':
      console.error('❌ [Realtime] Error:', event.error);
      if (options.onError) {
        options.onError(event.error || 'Unknown transcription error');
      }
      break;

    default:
      console.warn('⚠️ [Realtime] Unknown event type:', event.type);
  }
}

/**
 * Simulate realtime transcription for demo purposes
 * This creates a typing effect for the final transcribed text
 */
export function simulateRealtimeTranscription(
  finalText: string,
  options: RealtimeTranscriptionOptions = {},
  speed: number = 50 // ms per character
): AbortController {
  const abortController = new AbortController();
  let currentText = '';
  let index = 0;

  const typeNextCharacter = () => {
    if (abortController.signal.aborted) {
      return;
    }

    if (index < finalText.length) {
      currentText += finalText[index];
      
      if (options.onTextUpdate) {
        options.onTextUpdate(finalText[index], currentText);
      }
      
      index++;
      setTimeout(typeNextCharacter, speed);
    } else {
      // Complete
      console.log('✅ Typing effect finished for text:', currentText);
      if (options.onComplete) {
        options.onComplete(currentText, index * speed);
      }
    }
  };

  // Start typing effect
  setTimeout(typeNextCharacter, 100);

  return abortController;
}

/**
 * Format transcription text for better display
 */
export function formatTranscriptionText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/([.!?])\s*/g, '$1 ') // Add space after punctuation
    .replace(/\s+([,.;:])/g, '$1'); // Remove space before punctuation
}

/**
 * Check if streaming transcription is supported
 */
export function isStreamingSupported(): boolean {
  return typeof ReadableStream !== 'undefined' && 
         typeof fetch !== 'undefined' &&
         'getReader' in ReadableStream.prototype;
}
