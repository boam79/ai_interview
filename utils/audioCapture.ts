/**
 * Audio Capture Utilities
 * 
 * Web Audio API utilities for:
 * - Microphone access & permissions
 * - Real-time audio stream capture
 * - Audio analysis (frequency/amplitude data)
 * - Resource cleanup
 */

export interface AudioCaptureState {
  stream: MediaStream | null;
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  microphone: MediaStreamAudioSourceNode | null;
  dataArray: Uint8Array | null;
}

/**
 * Get the best available microphone with detailed info (prioritize Bluetooth)
 * @returns Best microphone device info
 */
export async function getBestMicrophoneInfo(): Promise<{
  deviceId: string;
  label: string;
  isBluetooth: boolean;
}> {
  try {
    console.log('🔍 [Audio] Finding best microphone...');

    // Request permission first to get device labels
    await navigator.mediaDevices.getUserMedia({ audio: true });

    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter(device => device.kind === 'audioinput');
    
    console.log('🎤 [Audio] Available microphones:', audioInputs.length);
    console.log('🎤 [Audio] Device details:', audioInputs.map(d => ({
      deviceId: d.deviceId,
      label: d.label,
      isBluetooth: isBluetoothDevice(d)
    })));

    // Prioritize Bluetooth devices
    const bluetoothDevices = audioInputs.filter(isBluetoothDevice);
    
    if (bluetoothDevices.length > 0) {
      const selectedDevice = bluetoothDevices[0];
      console.log('🎧 [Audio] Bluetooth device selected:', selectedDevice.label);
      return {
        deviceId: selectedDevice.deviceId,
        label: selectedDevice.label || 'Unknown Bluetooth Device',
        isBluetooth: true
      };
    }

    // If no Bluetooth, use first available device
    if (audioInputs.length > 0) {
      const selectedDevice = audioInputs[0];
      console.log('🎤 [Audio] Default device selected:', selectedDevice.label);
      return {
        deviceId: selectedDevice.deviceId,
        label: selectedDevice.label || 'Default Microphone',
        isBluetooth: false
      };
    }

    console.log('🎤 [Audio] No specific device found, using default');
    return {
      deviceId: 'default',
      label: 'Default Microphone',
      isBluetooth: false
    };

  } catch (error) {
    console.warn('⚠️ [Audio] Could not enumerate devices, using default:', error);
    return {
      deviceId: 'default',
      label: 'Default Microphone',
      isBluetooth: false
    };
  }
}

/**
 * Get the best available microphone (prioritize Bluetooth)
 * @returns Best microphone device ID or 'default'
 */
export async function getBestMicrophone(): Promise<string> {
  const info = await getBestMicrophoneInfo();
  return info.deviceId;
}

/**
 * Request microphone access from user (auto-select best microphone including Bluetooth)
 * @returns Object with MediaStream and microphone info
 */
export async function requestMicrophoneAccess(): Promise<{
  stream: MediaStream;
  microphoneInfo: {
    deviceId: string;
    label: string;
    isBluetooth: boolean;
  };
}> {
  try {
    console.log('🎤 [Audio] Requesting microphone access...');

    // Check if browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Your browser does not support microphone access');
    }

    // Get the best microphone automatically with detailed info
    const microphoneInfo = await getBestMicrophoneInfo();

    // Request microphone permission with Bluetooth-friendly settings
    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
        channelCount: 1, // Mono for better compatibility
        latency: 0.1, // Lower latency for better real-time experience
        // Use the best device we found
        ...(microphoneInfo.deviceId !== 'default' && { deviceId: { ideal: microphoneInfo.deviceId } }),
      },
    };

    console.log('🎧 [Audio] Using constraints:', constraints);
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Log the audio tracks for debugging
    const audioTracks = stream.getAudioTracks();
    audioTracks.forEach((track, index) => {
      console.log(`🎵 [Audio] Track ${index}:`, {
        label: track.label,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
        settings: track.getSettings()
      });
    });

    console.log('✅ [Audio] Microphone access granted');
    console.log('🎤 [Audio] Selected microphone:', microphoneInfo);
    
    return { stream, microphoneInfo };

  } catch (error: any) {
    console.error('❌ [Audio] Microphone access error:', error);

    // Handle specific error types
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      throw new Error('마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      throw new Error('마이크를 찾을 수 없습니다. 마이크나 블루투스 이어폰이 연결되어 있는지 확인해주세요.');
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      throw new Error('마이크가 다른 애플리케이션에서 사용 중입니다. 다른 앱을 종료하고 다시 시도해주세요.');
    } else if (error.name === 'OverconstrainedError') {
      throw new Error('마이크 설정에 문제가 있습니다. 블루투스 이어폰의 경우 페어링 상태를 확인해주세요.');
    } else {
      throw new Error(`마이크 오류: ${error.message}`);
    }
  }
}

/**
 * Start audio stream and set up real-time analysis
 * @param stream MediaStream from getUserMedia
 * @returns AudioCaptureState with all necessary objects
 */
export function startAudioStream(stream: MediaStream): AudioCaptureState {
  try {
    console.log('🔊 [Audio] Starting audio stream...');

    // Create AudioContext
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create AnalyserNode for real-time frequency/amplitude data
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048; // Higher = more detail, but slower
    analyser.smoothingTimeConstant = 0.8; // 0-1, higher = smoother

    // Create microphone source
    const microphone = audioContext.createMediaStreamSource(stream);
    
    // Connect microphone to analyser
    microphone.connect(analyser);

    // Create data array for frequency data
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    console.log('✅ [Audio] Audio stream started', {
      fftSize: analyser.fftSize,
      bufferLength,
      sampleRate: audioContext.sampleRate,
    });

    return {
      stream,
      audioContext,
      analyser,
      microphone,
      dataArray,
    };

  } catch (error: any) {
    console.error('❌ [Audio] Failed to start audio stream:', error);
    throw new Error(`Failed to start audio stream: ${error.message}`);
  }
}

/**
 * Stop audio stream and clean up all resources
 * @param state AudioCaptureState to clean up
 */
export function stopAudioStream(state: AudioCaptureState): void {
  try {
    console.log('🛑 [Audio] Stopping audio stream...');

    // Stop all tracks in the stream
    if (state.stream) {
      state.stream.getTracks().forEach(track => {
        track.stop();
        console.log('  🔇 [Audio] Track stopped:', track.kind);
      });
    }

    // Disconnect microphone
    if (state.microphone) {
      state.microphone.disconnect();
    }

    // Close audio context
    if (state.audioContext && state.audioContext.state !== 'closed') {
      state.audioContext.close();
    }

    console.log('✅ [Audio] Audio stream stopped and cleaned up');

  } catch (error: any) {
    console.error('❌ [Audio] Error stopping audio stream:', error);
  }
}

/**
 * Get real-time frequency data (for waveform visualization)
 * @param analyser AnalyserNode
 * @param dataArray Uint8Array buffer
 * @returns Updated dataArray with frequency data (0-255)
 */
export function getFrequencyData(
  analyser: AnalyserNode, 
  dataArray: Uint8Array
): Uint8Array {
  analyser.getByteFrequencyData(dataArray);
  return dataArray;
}

/**
 * Get real-time time domain data (for waveform visualization)
 * @param analyser AnalyserNode
 * @param dataArray Uint8Array buffer
 * @returns Updated dataArray with time domain data (0-255)
 */
export function getTimeDomainData(
  analyser: AnalyserNode,
  dataArray: Uint8Array
): Uint8Array {
  analyser.getByteTimeDomainData(dataArray);
  return dataArray;
}

/**
 * Calculate average amplitude from frequency data (for visual feedback)
 * @param dataArray Uint8Array with frequency data
 * @returns Average amplitude (0-255)
 */
export function getAverageAmplitude(dataArray: Uint8Array): number {
  const sum = dataArray.reduce((acc, value) => acc + value, 0);
  return sum / dataArray.length;
}

/**
 * Calculate normalized amplitude (0-1) for scaling effects
 * @param dataArray Uint8Array with frequency data
 * @returns Normalized amplitude (0-1)
 */
export function getNormalizedAmplitude(dataArray: Uint8Array): number {
  return getAverageAmplitude(dataArray) / 255;
}

/**
 * Check if browser supports Web Audio API
 * @returns true if supported, false otherwise
 */
export function isWebAudioSupported(): boolean {
  return !!(
    window.AudioContext || 
    (window as any).webkitAudioContext
  );
}

/**
 * Check if browser supports getUserMedia
 * @returns true if supported, false otherwise
 */
export function isMicrophoneSupported(): boolean {
  return !!(
    navigator.mediaDevices && 
    navigator.mediaDevices.getUserMedia
  );
}

/**
 * Request specific microphone device (including Bluetooth)
 * @param deviceId Specific device ID to use
 * @returns MediaStream if granted, throws error if denied
 */
export async function requestSpecificMicrophone(deviceId: string): Promise<MediaStream> {
  try {
    console.log('🎧 [Audio] Requesting specific microphone:', deviceId);

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: { exact: deviceId },
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
        channelCount: 1,
        latency: 0.1,
      },
    });

    console.log('✅ [Audio] Specific microphone access granted');
    return stream;

  } catch (error: any) {
    console.error('❌ [Audio] Specific microphone access error:', error);
    throw error;
  }
}

/**
 * Get list of available audio input devices
 * @returns Array of audio input devices
 */
export async function getAvailableMicrophones(): Promise<MediaDeviceInfo[]> {
  try {
    console.log('🔍 [Audio] Getting available microphones...');

    // Request permission first to get device labels
    await navigator.mediaDevices.getUserMedia({ audio: true });

    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter(device => device.kind === 'audioinput');

    console.log('🎤 [Audio] Available microphones:', audioInputs.length);
    return audioInputs;

  } catch (error: any) {
    console.error('❌ [Audio] Error getting microphones:', error);
    return [];
  }
}

/**
 * Check if device is likely a Bluetooth device
 * @param device MediaDeviceInfo
 * @returns true if likely Bluetooth
 */
export function isBluetoothDevice(device: MediaDeviceInfo): boolean {
  const label = device.label.toLowerCase();
  const bluetoothKeywords = [
    'bluetooth',
    'bt',
    'airpods',
    'airpods pro',
    'airpods max',
    'galaxy buds',
    'galaxy buds pro',
    'galaxy buds live',
    'galaxy buds2',
    'wh-1000xm',
    'wh-1000xm4',
    'wh-1000xm5',
    'wf-1000xm',
    'bose',
    'quietcomfort',
    'soundsport',
    'sony',
    'wireless',
    'beats',
    'jabra',
    'sennheiser',
    'momentum',
    'pixel buds',
    'buds pro',
    'earbuds'
  ];
  
  return bluetoothKeywords.some(keyword => label.includes(keyword));
}

/**
 * Get user-friendly error message for microphone errors
 * @param error Error object
 * @returns User-friendly error message
 */
export function getMicrophoneErrorMessage(error: any): string {
  if (!isMicrophoneSupported()) {
    return '죄송합니다. 이 브라우저는 마이크를 지원하지 않습니다. 최신 Chrome, Safari, 또는 Edge를 사용해주세요.';
  }

  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    return '마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.';
  }

  if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    return '마이크를 찾을 수 없습니다. 마이크나 블루투스 이어폰이 연결되어 있는지 확인해주세요.';
  }

  if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
    return '마이크가 다른 애플리케이션에서 사용 중입니다. 다른 앱을 종료하고 다시 시도해주세요.';
  }

  if (error.name === 'OverconstrainedError') {
    return '마이크 설정에 문제가 있습니다. 블루투스 이어폰의 경우 페어링 상태를 확인해주세요.';
  }

  return `마이크 오류: ${error.message || '알 수 없는 오류가 발생했습니다.'}`;
}

