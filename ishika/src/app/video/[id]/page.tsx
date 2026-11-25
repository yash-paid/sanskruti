'use client';

import { use, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Play, Lock, Eye, Clock, Share2, Bookmark, Heart, Sparkles, Crown, ArrowLeft, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { VideoCard } from '@/components/video/VideoCard';
import { CustomVideoPlayer } from '@/components/video/player/CustomVideoPlayer';
import { MOCK_VIDEOS, MOCK_PLANS } from '@/lib/mock-data';
import { useUser } from '@/context/UserContext';
import { MembershipPurchaseModal } from '@/components/membership/MembershipPurchaseModal';

export default function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const videoId = resolvedParams.id;
  const router = useRouter();
  const { user } = useUser();
  const [isPlayingInline, setIsPlayingInline] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const vipPlan = useMemo(() => MOCK_PLANS.find((p) => p.id === 'vip') || MOCK_PLANS[1], []);

  const video = MOCK_VIDEOS.find((v) => v.id === videoId) || MOCK_VIDEOS[0];
  const relatedVideos = MOCK_VIDEOS.filter((v) => v.id !== video.id).slice(0, 4);

  const isLocked = video.isPremium && user?.membershipTier !== 'VIP' && user?.membershipTier !== 'Elite';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link href="/videos" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Videos</span>
        </Link>
        <Link href={`/player/${video.id}`} className="inline-flex items-center gap-1.5 text-xs text-rose-light hover:text-rose transition-colors">
          <Maximize className="w-3.5 h-3.5" />
          <span>Open in Cinema Theater Mode</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Hero Video Banner */}
          {isPlayingInline && !isLocked ? (
            <CustomVideoPlayer
              video={video}
              nextVideo={relatedVideos[0]}
              onNextVideo={() => router.push(`/video/${relatedVideos[0].id}`)}
              isLocked={isLocked}
              onUnlockClick={() => setIsPurchaseModalOpen(true)}
            />
          ) : (
            <div className="relative aspect-video rounded-3xl overflow-hidden glass border border-border/50 group shadow-2xl bg-black">
              <Image
                src={video.thumbnail}
                alt={video.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

              {/* Locked Content Overlay or Direct Play */}
              {isLocked ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/75 backdrop-blur-md space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-rose/20 border border-rose/40 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-rose" />
                  </div>
                  <div className="space-y-1 max-w-md">
                    <Badge variant="premium">Exclusive Episode</Badge>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground">VIP Membership Required</h3>
                    <p className="text-xs sm:text-sm text-secondary">
                      This episode contains private behind-the-scenes footage and is reserved for VIP &amp; Elite members.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setIsPurchaseModalOpen(true)}
                      className="shadow-lg shadow-rose/25 font-bold"
                    >
                      <Crown className="w-4 h-4" />
                      <span>Upgrade to VIP (Instant Unlock)</span>
                    </Button>
                    <Link href={`/player/${video.id}`}>
                      <Button variant="secondary" size="md">
                        <span>Watch Preview</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <button
                    onClick={() => setIsPlayingInline(true)}
                    className="w-20 h-20 rounded-full bg-rose/90 hover:bg-rose text-white flex items-center justify-center shadow-2xl shadow-rose/40 hover:scale-110 transition-all duration-300 group/btn"
                  >
                    <Play className="w-8 h-8 fill-white ml-1 group-hover/btn:scale-110 transition-transform" />
                  </button>
                  <span className="text-xs font-semibold text-white/90 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                    Click to Stream in Custom Player
                  </span>
                </div>
              )}

              <span className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 backdrop-blur-md text-white text-xs font-semibold rounded-lg">
                {video.duration}
              </span>
            </div>
          )}

          {/* Video Metadata & Action Strip */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Badge variant={video.isPremium ? 'premium' : 'default'}>
                  {video.isPremium ? 'Exclusive' : 'Public Stream'}
                </Badge>
                <span className="text-xs text-muted bg-elevated px-2.5 py-1 rounded-full">{video.category}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => alert('Saved to your watch list!')}
                  className="p-2.5 rounded-xl bg-surface hover:bg-elevated text-secondary hover:text-rose border border-border/50 transition-colors"
                  title="Bookmark"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
                <button
                  onClick={() => alert('Link copied to clipboard!')}
                  className="p-2.5 rounded-xl bg-surface hover:bg-elevated text-secondary hover:text-foreground border border-border/50 transition-colors"
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">{video.title}</h1>

            <div className="flex items-center gap-4 text-xs text-muted border-b border-border/40 pb-4">
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{video.views} views</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{video.duration}</span>
              <span>•</span>
              <span>Released {video.date}</span>
            </div>

            <div className="prose prose-invert max-w-none text-sm text-secondary leading-relaxed">
              <p>{video.description}</p>
            </div>

            {/* Tags Strip */}
            <div className="flex flex-wrap gap-2 pt-2">
              {video.tags.map((tag) => (
                <span key={tag} className="text-xs text-muted hover:text-rose-light cursor-pointer">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Up Next & Community */}
        <div className="space-y-6">
          <div className="glass p-5 rounded-3xl border border-border/50 space-y-4">
            <h3 className="text-base font-bold text-foreground">Up Next in This Series</h3>
            <div className="space-y-4">
              {relatedVideos.map((rel) => (
                <VideoCard key={rel.id} video={rel} />
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
