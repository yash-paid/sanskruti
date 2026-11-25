'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Lock, Clock, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { Video } from '@/types';

export function VideoCard({ video }: { video: Video }) {
  return (
    <Link href={`/video/${video.id}`} className="group block">
      <div className="rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-rose/30 transition-all duration-300 hover:shadow-lg hover:shadow-rose/5">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-14 h-14 rounded-full bg-rose/90 flex items-center justify-center shadow-xl">
              {video.isPremium ? <Lock className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
            </div>
          </div>

          {/* Duration */}
          <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-[11px] font-medium rounded-md">
            {video.duration}
          </span>

          {/* Premium Badge */}
          {video.isPremium && (
            <div className="absolute top-2 left-2">
              <Badge variant="premium">Exclusive</Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-2">
          {video.channelName && (
            <p className="text-[11px] text-emerald-400 font-medium truncate">{video.channelName}</p>
          )}
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-rose-light transition-colors">
            {video.title}
          </h3>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{video.views}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{video.duration}</span>
          </div>
          <span className="inline-block text-[11px] text-secondary bg-elevated px-2 py-0.5 rounded-md">{video.category}</span>
        </div>
      </div>
    </Link>
  );
}
