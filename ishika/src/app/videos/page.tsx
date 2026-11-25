'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Sparkles, Filter, Play, Lock, Flame, ExternalLink, Radio } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { VideoCard } from '@/components/video/VideoCard';
import { MOCK_VIDEOS, MOCK_PLAYLISTS } from '@/lib/mock-data';
import { VIDEO_CATEGORIES, YOUTUBE_CHANNELS } from '@/lib/constants';

export default function VideosPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterType, setFilterType] = useState<'all' | 'free' | 'premium'>('all');

  const filteredVideos = useMemo(() => {
    return MOCK_VIDEOS.filter((video) => {
      const matchesSearch =
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (video.channelName && video.channelName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        video.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'All' || video.category === selectedCategory;

      const matchesType =
        filterType === 'all' ||
        (filterType === 'free' && !video.isPremium) ||
        (filterType === 'premium' && video.isPremium);

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [searchQuery, selectedCategory, filterType]);

  // First 4 are the latest new released videos
  const newReleasedVideos = MOCK_VIDEOS.slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* ==================== 1. NEW RELEASED VIDEOS (RIGHT AT THE TOP) ==================== */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose/15 text-rose-light text-xs font-bold border border-rose/30 shadow-md shadow-rose/10 animate-pulse">
              <Flame className="w-4 h-4 text-rose" />
              <span>NEW RELEASED EPISODES</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
              Latest Video Releases
            </h1>
            <p className="text-secondary text-xs sm:text-sm max-w-xl">
              Freshly premiered episodes and official audio drops from Ishika&apos;s channels with direct YouTube thumbnails.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Real-Time YouTube Updates</span>
            </span>
          </div>
        </div>

        {/* 4 Brand New Releases Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {newReleasedVideos.map((video) => (
            <div key={video.id} className="relative group">
              <div className="absolute -top-2.5 right-3 z-20">
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose to-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-rose/30">
                  New Released 🔥
                </span>
              </div>
              <VideoCard video={video} />
            </div>
          ))}
        </div>
      </section>

      {/* ==================== 2. SEARCH & CATEGORY FILTER BAR ==================== */}
      <section className="space-y-6 pt-4 border-t border-border/40">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search episodes (Shiddat, Maya × Siddhi, Not My Type)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-elevated border border-border text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-rose focus:ring-1 focus:ring-rose"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === 'all' ? 'bg-rose text-white' : 'bg-elevated text-secondary hover:text-foreground'
              }`}
            >
              All Episodes
            </button>
            <button
              onClick={() => setFilterType('free')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === 'free' ? 'bg-rose text-white' : 'bg-elevated text-secondary hover:text-foreground'
              }`}
            >
              Public Streams
            </button>
            <button
              onClick={() => setFilterType('premium')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
                filterType === 'premium' ? 'bg-gold text-background font-bold' : 'bg-elevated text-secondary hover:text-foreground'
              }`}
            >
              <Lock className="w-3 h-3" />
              VIP Uncut Vault
            </button>
          </div>
        </div>

        {/* Series Filter Horizontal Scroller */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-border/40">
          {VIDEO_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-foreground text-background font-bold shadow-md'
                  : 'bg-surface hover:bg-elevated text-secondary hover:text-foreground border border-border/40'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* ==================== 3. ALL EPISODES LIBRARY GRID ==================== */}
      <section className="space-y-6">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Showing {filteredVideos.length} episodes matching selection</span>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-rose hover:underline">
              Clear search
            </button>
          )}
        </div>

        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 glass rounded-3xl border border-border/50 space-y-4">
            <Radio className="w-12 h-12 text-muted mx-auto" />
            <h3 className="text-lg font-bold text-foreground">No episodes found</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              We couldn&apos;t find any series episodes matching &apos;{searchQuery}&apos;.
            </p>
          </div>
        )}
      </section>

      {/* ==================== 4. CURATED SERIES PLAYLISTS ==================== */}
      <section className="space-y-6 pt-8 border-t border-border/40">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            <span>Complete Series Playlists (Chronological)</span>
          </h2>
          <p className="text-xs text-muted">Binge-listen to Yashvi &amp; Vandana or Maya &amp; Siddhi from Episode 1 to latest.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_PLAYLISTS.map((pl) => (
            <div
              key={pl.id}
              className="group relative rounded-2xl overflow-hidden glass border border-border/50 hover:border-rose/40 transition-all p-4 flex flex-col justify-between space-y-3"
            >
              <div className="relative aspect-video w-full rounded-xl overflow-hidden shrink-0">
                <Image src={pl.thumbnail} alt={pl.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-[10px] font-bold rounded">
                  {pl.videoCount} Parts
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground group-hover:text-rose-light transition-colors line-clamp-1">
                  {pl.title}
                </h3>
                <p className="text-xs text-muted line-clamp-2">{pl.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
