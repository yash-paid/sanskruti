'use client';

import React, { useMemo } from 'react';
import type { SubtitleStyle } from '@/types/player';
import { getVideoCaptions } from '@/lib/video-captions';

interface SubtitleOverlayProps {
  videoId?: string;
  currentTime: number;
  subtitleTrack: string;
  style: SubtitleStyle;
}

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  videoId,
  currentTime,
  subtitleTrack,
  style,
}) => {
  if (subtitleTrack === 'off') return null;

  // Retrieve accurate video-specific transcript cues
  const videoCaptions = useMemo(() => getVideoCaptions(videoId), [videoId]);
  const cues = subtitleTrack === 'hi' ? videoCaptions.hi : videoCaptions.en;

  const activeCue = useMemo(() => {
    return cues.find((c) => currentTime >= c.start && currentTime <= c.end);
  }, [cues, currentTime]);

  if (!activeCue) return null;

  const fontSizes = {
    sm: 'text-xs sm:text-sm md:text-base',
    md: 'text-sm sm:text-base md:text-lg',
    lg: 'text-base sm:text-lg md:text-xl',
  };

  const bgOpacities = {
    0: 'bg-transparent',
    50: 'bg-black/50',
    75: 'bg-black/75',
    100: 'bg-black/95',
  };

  const positions = {
    bottom: 'bottom-16 sm:bottom-20',
    top: 'top-16 sm:top-20',
  };

  return (
    <div
      className={`absolute left-0 right-0 ${positions[style.position]} z-30 flex justify-center px-6 pointer-events-none transition-all duration-200`}
    >
      <div
        className={`max-w-2xl px-5 py-2.5 rounded-2xl backdrop-blur-sm text-center font-semibold text-white tracking-wide shadow-2xl transition-all border border-white/10 ${
          fontSizes[style.fontSize]
        } ${bgOpacities[style.backgroundOpacity]}`}
        style={{
          textShadow: '0 2px 10px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.95)',
        }}
      >
        <span className="leading-relaxed drop-shadow-md">{activeCue.text}</span>
      </div>
    </div>
  );
};
