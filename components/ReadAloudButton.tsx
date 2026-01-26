
import React, { useState, useRef, useEffect } from 'react';
import { generateSpeech } from '../services/geminiService';

// --- Audio Decoding Utilities ---

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface ReadAloudProps {
  text: string;
  className?: string;
  label?: string;
}

export const ReadAloudButton: React.FC<ReadAloudProps> = ({ text, className, label }) => {
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const stopAudio = () => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      sourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const playAudio = async () => {
    if (!text) return;
    
    if (isPlaying) {
      stopAudio();
      return;
    }

    setLoading(true);

    try {
      const base64Audio = await generateSpeech(text);
      if (!base64Audio) {
        throw new Error("No audio data returned");
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const bytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(bytes, ctx, 24000, 1);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => {
        setIsPlaying(false);
        sourceRef.current = null;
      };

      sourceRef.current = source;
      source.start();
      setIsPlaying(true);
    } catch (error) {
      console.error("Audio Playback Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <button 
      onClick={playAudio} 
      disabled={loading || !text}
      className={`brutalist-button flex items-center gap-2 !py-2 !px-4 !text-sm group hover:scale-105 transition-all ${className || ''}`}
      title="Read Aloud"
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-marker-black border-t-transparent animate-spin rounded-full"></div>
      ) : isPlaying ? (
        <div className="flex gap-1 items-end h-4">
           <div className="w-1 bg-marker-black h-2 animate-[bounce_0.8s_infinite]"></div>
           <div className="w-1 bg-marker-black h-4 animate-[bounce_0.6s_infinite]"></div>
           <div className="w-1 bg-marker-black h-3 animate-[bounce_1.0s_infinite]"></div>
        </div>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      )}
      <span className="handwritten font-bold uppercase tracking-wider">{isPlaying ? 'Stop' : (label || 'Read')}</span>
    </button>
  );
};
