/**
 * Audio Recorder Utilities
 * 
 * MediaRecorder API utilities for:
 * - Recording audio from MediaStream
 * - Managing recording state
 * - Converting recorded data to Blob
 * - Time limit enforcement
 */

export type RecordingState = 'idle' | 'recording' | 'stopped';

export interface AudioRecorderOptions {
  maxDuration?: number; // Maximum recording duration in milliseconds (default: 60000 = 60s)
  mimeType?: string; // Preferred MIME type (will auto-detect if not supported)
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;
  private maxDuration: number;
  private durationTimer: NodeJS.Timeout | null = null;
  
  public state: RecordingState = 'idle';
  public onStateChange?: (state: RecordingState) => void;
  public onMaxDurationReached?: () => void;

  constructor(options: AudioRecorderOptions = {}) {
    this.maxDuration = options.maxDuration || 60000; // Default: 60 seconds
  }

  /**
   * Start recording from media stream
   * @param stream MediaStream from getUserMedia
   */
  public startRecording(stream: MediaStream): void {
    try {
      console.log('🔴 [Recorder] Starting recording...');

      if (this.state === 'recording') {
        console.warn('⚠️ [Recorder] Already recording');
        return;
      }

      this.stream = stream;
      this.audioChunks = [];
      this.startTime = Date.now();

      // Get supported MIME type
      const mimeType = this.getSupportedMimeType();
      console.log(`🎵 [Recorder] Using MIME type: ${mimeType}`);

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
      });

      // Handle data available event
      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          console.log(`📦 [Recorder] Chunk received: ${(event.data.size / 1024).toFixed(2)} KB`);
        }
      };

      // Handle recording stop
      this.mediaRecorder.onstop = () => {
        const duration = Date.now() - this.startTime;
        console.log(`✅ [Recorder] Recording stopped after ${(duration / 1000).toFixed(2)}s`);
        this.setState('stopped');
        
        // Clear duration timer
        if (this.durationTimer) {
          clearTimeout(this.durationTimer);
          this.durationTimer = null;
        }
      };

      // Handle errors
      this.mediaRecorder.onerror = (event: Event) => {
        console.error('❌ [Recorder] Recording error:', event);
        this.stopRecording();
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every 1 second
      this.setState('recording');

      // Set max duration timer
      this.durationTimer = setTimeout(() => {
        console.warn(`⏰ [Recorder] Max duration reached (${this.maxDuration}ms)`);
        this.stopRecording();
        if (this.onMaxDurationReached) {
          this.onMaxDurationReached();
        }
      }, this.maxDuration);

      console.log('✅ [Recorder] Recording started');

    } catch (error: any) {
      console.error('❌ [Recorder] Failed to start recording:', error);
      throw new Error(`Failed to start recording: ${error.message}`);
    }
  }

  /**
   * Stop recording and prepare data
   */
  public stopRecording(): void {
    try {
      console.log('🛑 [Recorder] Stopping recording...');

      if (!this.mediaRecorder || this.state !== 'recording') {
        console.warn('⚠️ [Recorder] Not recording');
        return;
      }

      // Stop MediaRecorder
      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }

      // Clear duration timer
      if (this.durationTimer) {
        clearTimeout(this.durationTimer);
        this.durationTimer = null;
      }

    } catch (error: any) {
      console.error('❌ [Recorder] Error stopping recording:', error);
    }
  }

  /**
   * Get recorded audio as Blob
   * @returns Blob containing recorded audio
   */
  public getRecordedBlob(): Blob | null {
    try {
      if (this.audioChunks.length === 0) {
        console.warn('⚠️ [Recorder] No audio chunks available');
        return null;
      }

      const mimeType = this.getSupportedMimeType();
      const blob = new Blob(this.audioChunks, { type: mimeType });
      
      console.log('📦 [Recorder] Created audio blob:', {
        size: `${(blob.size / 1024).toFixed(2)} KB`,
        type: blob.type,
        chunks: this.audioChunks.length,
      });

      return blob;

    } catch (error: any) {
      console.error('❌ [Recorder] Error creating blob:', error);
      return null;
    }
  }

  /**
   * Get recorded audio as File (for API upload)
   * @param filename Filename for the file
   * @returns File object
   */
  public getRecordedFile(filename: string = 'recording.webm'): File | null {
    const blob = this.getRecordedBlob();
    if (!blob) return null;

    const extension = this.getFileExtension();
    const finalFilename = filename.replace(/\.[^/.]+$/, '') + extension;
    
    const file = new File([blob], finalFilename, { 
      type: blob.type,
      lastModified: Date.now(),
    });

    console.log(`📄 [Recorder] Created file: ${file.name}`);
    return file;
  }

  /**
   * Get recording duration in milliseconds
   * @returns Duration in ms, or 0 if not recording/recorded
   */
  public getDuration(): number {
    if (this.state === 'idle' || this.startTime === 0) {
      return 0;
    }
    return Date.now() - this.startTime;
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    console.log('🧹 [Recorder] Cleaning up...');

    if (this.durationTimer) {
      clearTimeout(this.durationTimer);
      this.durationTimer = null;
    }

    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.startTime = 0;
    this.setState('idle');

    console.log('✅ [Recorder] Cleanup complete');
  }

  /**
   * Get supported MIME type for recording
   * Tries multiple formats and returns the first supported one
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus', // Best quality, widely supported
      'audio/webm', // WebM fallback
      'audio/ogg;codecs=opus', // OGG Opus
      'audio/mp4', // MP4 (Safari)
      'audio/wav', // WAV fallback
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    console.warn('⚠️ [Recorder] No preferred MIME type supported, using default');
    return '';
  }

  /**
   * Get file extension based on MIME type
   */
  private getFileExtension(): string {
    const mimeType = this.getSupportedMimeType();
    
    if (mimeType.includes('webm')) return '.webm';
    if (mimeType.includes('ogg')) return '.ogg';
    if (mimeType.includes('mp4')) return '.mp4';
    if (mimeType.includes('wav')) return '.wav';
    
    return '.webm'; // Default
  }

  /**
   * Update state and trigger callback
   */
  private setState(newState: RecordingState): void {
    this.state = newState;
    console.log(`📊 [Recorder] State changed: ${newState}`);
    
    if (this.onStateChange) {
      this.onStateChange(newState);
    }
  }

  /**
   * Check if MediaRecorder is supported
   */
  public static isSupported(): boolean {
    return typeof MediaRecorder !== 'undefined';
  }

  /**
   * Get list of supported MIME types
   */
  public static getSupportedTypes(): string[] {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/wav',
    ];

    return types.filter(type => MediaRecorder.isTypeSupported(type));
  }
}

/**
 * Create a new AudioRecorder instance
 * @param options AudioRecorderOptions
 * @returns AudioRecorder instance
 */
export function createAudioRecorder(options?: AudioRecorderOptions): AudioRecorder {
  return new AudioRecorder(options);
}

