'use client';

import React from 'react';
import Image from 'next/image';
import { Play, X, Sparkles } from 'lucide-react';
import type { Video } from '@/types';

interface NextVideoOverlayProps {
  nextVideo: Video;
  countdown: number;
  onPlayNow: () => void;
  onCancel: () => void;
}

export const NextVideoOverlay: React.FC<NextVideoOverlayProps> = ({
  nextVideo,
  countdown,
  onPlayNow,
  onCancel,
}) => {
  return (
    <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
      <div className="max-w-md w-full glass border border-rose/30 rounded-3xl p-6 sm:p-8 space-y-6 text-center shadow-2xl relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-muted hover:text-white transition-colors"
          title="Cancel Autoplay"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose/15 text-rose-light text-xs font-bold border border-rose/30 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-rose" />
            <span>Up Next in {countdown}s</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-foreground line-clamp-1">
            {nextVideo.title}
          </h3>
          <p className="text-xs text-secondary">{nextVideo.channelName}</p>
        </div>

        {/* Next Video Preview Card */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-border/50 group">
          <Image
            src={nextVideo.thumbnail}
            alt={nextVideo.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3 justify-between">
            <span className="text-[11px] font-bold text-white bg-black/60 px-2 py-0.5 rounded">
              {nextVideo.duration}
            </span>
            <span className="text-[11px] font-bold text-rose-light">
              {nextVideo.category}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onPlayNow}
            className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-rose to-rose-dark hover:from-rose-light hover:to-rose text-white text-sm font-bold shadow-lg shadow-rose/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Play Next Episode</span>
          </button>
          <button
            onClick={onCancel}
            className="py-3 px-5 rounded-xl bg-surface hover:bg-elevated border border-border/60 text-secondary hover:text-white text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
