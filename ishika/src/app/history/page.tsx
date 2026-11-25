'use client';

import Link from 'next/link';
import { Clock, Trash2, ArrowLeft, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { VideoCard } from '@/components/video/VideoCard';
import { MOCK_VIDEOS } from '@/lib/mock-data';
import { useUser } from '@/context/UserContext';

export default function HistoryPage() {
  const { user } = useUser();

  const historyVideos = MOCK_VIDEOS.filter((v) =>
    user?.watchHistory.includes(v.id)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link href="/profile" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Profile</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-4xl font-black text-foreground">Your Watch History</h1>
            <p className="text-xs text-muted">Pick up where you left off across all episodes and secret releases.</p>
          </div>
          <button
            onClick={() => alert('History cleared (demo)!')}
            className="text-xs text-rose-light hover:text-rose inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Watch History</span>
          </button>
        </div>
      </div>

      {historyVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {historyVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass rounded-3xl border border-border/50 space-y-4">
          <Clock className="w-12 h-12 text-muted mx-auto" />
          <h3 className="text-lg font-bold text-foreground">No watch history yet</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Videos you watch will appear here so you can easily re-watch them anytime.
          </p>
          <Link href="/videos">
            <Button variant="primary">Start Watching</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
