'use client';

import { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  analyser: AnalyserNode | null;
  dataArray: Uint8Array | null;
  isRecording: boolean;
  width?: number;
  height?: number;
}

/**
 * WaveformVisualizer Component
 * 
 * Real-time audio waveform visualization with Liquid Glass style
 * - Flowing wave animation
 * - Amplitude-based wave height
 * - Gradient colors with blur effects
 * - 60fps smooth animation
 */
export default function WaveformVisualizer({
  analyser,
  dataArray,
  isRecording,
  width = 800,
  height = 200,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let isActive = true;

    /**
     * Draw waveform animation
     */
    const draw = () => {
      if (!isActive) return;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Calculate average amplitude
      let amplitude = 0;
      if (isRecording && analyser && dataArray) {
        // TypeScript workaround for ArrayBufferLike vs ArrayBuffer
        // @ts-expect-error - ArrayBufferLike is compatible at runtime
        analyser.getByteTimeDomainData(dataArray);
        
        // Calculate average amplitude from time domain data
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const value = (dataArray[i] - 128) / 128; // Normalize to -1 to 1
          sum += Math.abs(value);
        }
        amplitude = sum / dataArray.length;
        
        // Boost amplitude for better visualization
        amplitude = Math.min(amplitude * 3, 1);
      }

      // Base amplitude when not recording or no sound
      const baseAmplitude = isRecording ? 0.1 : 0.05;
      const finalAmplitude = isRecording ? amplitude : baseAmplitude;

      // Update phase for flowing animation
      phaseRef.current += isRecording ? 0.08 : 0.03;

      // Draw multiple wave layers for depth effect
      drawWaveLayer(ctx, width, height, finalAmplitude, phaseRef.current, {
        color: isRecording ? 'rgba(147, 51, 234, 0.6)' : 'rgba(156, 163, 175, 0.4)', // Purple when recording, gray when idle
        blur: 20,
        lineWidth: 3,
        frequency: 0.02,
        yOffset: 0,
      });

      drawWaveLayer(ctx, width, height, finalAmplitude * 0.7, phaseRef.current + 1, {
        color: isRecording ? 'rgba(168, 85, 247, 0.4)' : 'rgba(209, 213, 219, 0.3)',
        blur: 15,
        lineWidth: 2,
        frequency: 0.025,
        yOffset: 10,
      });

      drawWaveLayer(ctx, width, height, finalAmplitude * 0.5, phaseRef.current + 2, {
        color: isRecording ? 'rgba(192, 132, 252, 0.3)' : 'rgba(229, 231, 235, 0.2)',
        blur: 10,
        lineWidth: 1.5,
        frequency: 0.03,
        yOffset: -10,
      });

      // Continue animation
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    // Start animation
    draw();

    // Cleanup
    return () => {
      isActive = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser, dataArray, isRecording, width, height]);

  return (
    <div className="relative w-full">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-2xl max-w-full"
        style={{ width: `${width}px`, height: `${height}px` }}
      />

      {/* Glass overlay effect */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none
        bg-gradient-to-b from-white/5 to-transparent
        backdrop-blur-[1px]"
      />
    </div>
  );
}

/**
 * Draw a single wave layer
 */
function drawWaveLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amplitude: number,
  phase: number,
  options: {
    color: string;
    blur: number;
    lineWidth: number;
    frequency: number;
    yOffset: number;
  }
) {
  const { color, blur, lineWidth, frequency, yOffset } = options;

  // Set style
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.shadowBlur = blur;
  ctx.shadowColor = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Begin path
  ctx.beginPath();

  // Draw sine wave
  const centerY = height / 2 + yOffset;
  const amplitudeScale = height * 0.3; // Max wave height

  for (let x = 0; x <= width; x += 2) {
    // Create flowing sine wave
    const y = centerY + 
      Math.sin((x * frequency) + phase) * amplitudeScale * amplitude +
      Math.sin((x * frequency * 2) + phase * 1.5) * amplitudeScale * amplitude * 0.3;

    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();

  // Reset shadow
  ctx.shadowBlur = 0;
}

