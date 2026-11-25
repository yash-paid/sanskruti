'use client';

import { use, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { VideoCard } from '@/components/video/VideoCard';
import { CustomVideoPlayer } from '@/components/video/player/CustomVideoPlayer';
import { MOCK_VIDEOS, MOCK_PLANS } from '@/lib/mock-data';
import { useUser } from '@/context/UserContext';
import { MembershipPurchaseModal } from '@/components/membership/MembershipPurchaseModal';

export default function VideoPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const videoId = resolvedParams.id;
  const router = useRouter();
  const { user } = useUser();
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const vipPlan = useMemo(() => MOCK_PLANS.find((p) => p.id === 'vip') || MOCK_PLANS[1], []);

  const video = MOCK_VIDEOS.find((v) => v.id === videoId) || MOCK_VIDEOS[0];
  const currentIndex = MOCK_VIDEOS.findIndex((v) => v.id === video.id);
  const prevVideo = currentIndex > 0 ? MOCK_VIDEOS[currentIndex - 1] : undefined;
  const nextVideo =
    currentIndex < MOCK_VIDEOS.length - 1
      ? MOCK_VIDEOS[currentIndex + 1]
      : MOCK_VIDEOS[0];
  const relatedVideos = MOCK_VIDEOS.filter((v) => v.id !== video.id).slice(0, 4);

  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [comments, setComments] = useState([
    {
      id: '1',
      user: 'Simran Roy',
      text: 'The sound design and dialogue delivery in this episode gives literal chills...',
      time: '10m ago',
    },
    {
      id: '2',
      user: 'Tanmay Mehta',
      text: 'Ishika your storytelling pace is unmatched. Best Indian GL romance hands down!',
      time: '25m ago',
    },
    {
      id: '3',
      user: 'Ritika K.',
      text: 'VIP Army forever 💚 The quality on this new custom player is unreal!',
      time: '1h ago',
    },
  ]);
  const [commentInput, setCommentInput] = useState('');

  const isLocked =
    video.isPremium &&
    user?.membershipTier !== 'VIP' &&
    user?.membershipTier !== 'Elite';

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setComments([
      {
        id: Date.now().toString(),
        user: user?.name || 'You',
        text: commentInput,
        time: 'Just now',
      },
      ...comments,
    ]);
    setCommentInput('');
  };

  return (
    <div
      className={`mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 transition-all duration-300 ${
        isTheaterMode ? 'max-w-[1700px]' : 'max-w-7xl'
      }`}
    >
      {/* Top Breadcrumb & Theater Mode Indicator */}
      <div className="flex items-center justify-between">
        <Link
          href={`/video/${video.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to Episode Details</span>
        </Link>

        <div className="flex items-center gap-2">
          {isTheaterMode && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gold/15 text-gold border border-gold/30 flex items-center gap-1 animate-pulse">
              <Sparkles className="w-3 h-3 text-gold" />
              <span>Cinema Theater Mode Active</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div
        className={`grid gap-8 transition-all duration-300 ${
          isTheaterMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'
        }`}
      >
        {/* Main Cinema Screen Column */}
        <div className={isTheaterMode ? 'w-full space-y-6' : 'lg:col-span-2 space-y-6'}>
          {/* ===================== PROPRIETARY CUSTOM VIDEO PLAYER ===================== */}
          <CustomVideoPlayer
            video={video}
            nextVideo={nextVideo}
            prevVideo={prevVideo}
            onNextVideo={() => router.push(`/player/${nextVideo.id}`)}
            onPrevVideo={
              prevVideo ? () => router.push(`/player/${prevVideo.id}`) : undefined
            }
            isTheaterMode={isTheaterMode}
            onToggleTheater={() => setIsTheaterMode((prev) => !prev)}
            isLocked={isLocked}
            onUnlockClick={() => setIsPurchaseModalOpen(true)}
          />

          {/* Episode Info */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose/15 text-rose-light border border-rose/30">
                  {video.category}
                </span>
                <span className="text-xs text-secondary font-medium">
                  {video.channelName}
                </span>
              </div>
              <span className="text-xs text-muted">
                Premiered: {video.date} • {video.views} streams
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground">
              {video.title}
            </h1>
            <p className="text-sm text-secondary leading-relaxed">
              {video.description}
            </p>
          </div>

          {/* Comments / Discussion Section */}
          <div className="glass p-6 sm:p-8 rounded-3xl border border-border/50 space-y-6">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-rose" />
              <span>Live Discussion &amp; Fan Reactions ({comments.length})</span>
            </h3>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Share your review or reaction on this episode..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-elevated border border-border text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-rose focus:ring-1 focus:ring-rose"
              />
              <Button type="submit" variant="primary" size="sm">
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>

            {/* Comments List */}
            <div className="space-y-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-4 rounded-2xl bg-surface/50 border border-border/40 text-xs space-y-1 hover:border-rose/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{comment.user}</span>
                    <span className="text-[10px] text-muted">{comment.time}</span>
                  </div>
                  <p className="text-secondary leading-relaxed">{comment.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Next Up Playlist (Right or Stacked in Theater Mode) */}
        <div className={isTheaterMode ? 'w-full pt-4' : 'space-y-6'}>
          <div className="glass p-5 rounded-3xl border border-border/50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-gold" />
                <span>Next in Series</span>
              </h3>
              <span className="text-[11px] text-muted font-medium">Autoplay Enabled</span>
            </div>

            <div
              className={`gap-4 ${
                isTheaterMode
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                  : 'space-y-4'
              }`}
            >
              {relatedVideos.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* VIP Instant Unlock Payment Modal */}
      <MembershipPurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        plan={vipPlan}
        billingCycle="monthly"
      />
    </div>
  );
}
