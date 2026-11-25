'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Play, Sparkles, Crown, ShoppingBag, ArrowRight, Heart, Flame, ExternalLink, Video } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { VideoCard } from '@/components/video/VideoCard';
import { ProductCard } from '@/components/store/ProductCard';
import { MOCK_VIDEOS, MOCK_PRODUCTS, MOCK_PLANS, MOCK_CHAT_MESSAGES } from '@/lib/mock-data';
import { BRAND, YOUTUBE_CHANNELS } from '@/lib/constants';

export default function HomePage() {
  const featuredVideos = MOCK_VIDEOS.slice(0, 4);
  const trendingVideos = MOCK_VIDEOS.slice(4, 10);
  const featuredProducts = MOCK_PRODUCTS.slice(0, 4);
  const recentMessages = MOCK_CHAT_MESSAGES.slice(0, 4);

  return (
    <div className="space-y-24 md:space-y-32 overflow-hidden pb-12">
      {/* ===================== HERO SECTION ===================== */}
      <section className="relative min-h-[85vh] md:min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-8 md:pt-12">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[650px] h-[350px] md:h-[650px] bg-rose/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[250px] md:w-[450px] h-[250px] md:h-[450px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-emerald-500/30 text-emerald-300 text-xs md:text-sm font-medium tracking-wide shadow-lg shadow-emerald-500/10"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Official Home of Ishq Army 💚</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.08]"
          >
            <span className="text-gradient-rose">ISHIKA&apos;S</span>{' '}
            <span className="text-gradient-gold">WORLD</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-secondary font-normal leading-relaxed"
          >
            The unified digital universe for <strong className="text-foreground">Shiddat</strong>, <strong className="text-foreground">Not My Type</strong>, and <strong className="text-foreground">Pretending To Be Yours</strong>. Uncut romantic audios, VIP terrace hangouts, exclusive character merchandise, and direct community rooms.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            <Link href="/videos">
              <Button size="lg" variant="primary" className="shadow-rose/30 hover:scale-[1.02]">
                <Play className="w-4 h-4 fill-white" />
                <span>Listen All Series</span>
              </Button>
            </Link>
            <Link href="/membership">
              <Button size="lg" variant="gold" className="shadow-gold/30 hover:scale-[1.02]">
                <Crown className="w-4 h-4 text-background" />
                <span>Join VIP Army</span>
              </Button>
            </Link>
            <Link href="/store">
              <Button size="lg" variant="outline">
                <ShoppingBag className="w-4 h-4" />
                <span>Series Merch</span>
              </Button>
            </Link>
          </motion.div>

          {/* Key Metrics Strip */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {[
              { label: 'YouTube Army', value: '28K+ Strong' },
              { label: 'Total Series Plays', value: '3.5M+' },
              { label: 'Original Episodes', value: '180+ Parts' },
              { label: 'Official Channels', value: '4 Network Hubs' },
            ].map((stat, idx) => (
              <div key={idx} className="glass p-4 rounded-xl border border-border/40 text-center">
                <p className="text-xl md:text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted mt-0.5">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===================== THE 4 OFFICIAL CHANNELS NETWORK ===================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <Badge variant="gold">Creator Network</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground">
            The 4 Official Channels of Ishika
          </h2>
          <p className="text-xs sm:text-sm text-secondary">
            All 4 channels are created, written, and narrated by Ishika. Explore each channel&apos;s signature series below:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {YOUTUBE_CHANNELS.map((ch) => (
            <div
              key={ch.handle}
              className="glass p-6 rounded-3xl border border-border/60 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border-2 border-emerald-500/40">
                    <Image src={ch.avatar} alt={ch.name} fill className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-foreground group-hover:text-emerald-400 transition-colors truncate">
                      {ch.name}
                    </h3>
                    <p className="text-xs text-muted font-mono">{ch.handle}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose/20 text-rose-light text-[10px] font-bold">
                    {ch.badge}
                  </span>
                  <p className="text-xs text-secondary leading-relaxed line-clamp-3">
                    {ch.description}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                <span className="text-xs text-muted font-medium">{ch.subscribers}</span>
                <a
                  href={ch.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  <span>Visit Channel</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== FEATURED EPISODES ===================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Latest Releases</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Featured Series Episodes</h2>
          </div>
          <Link href="/videos" className="text-sm font-semibold text-rose-light hover:text-rose flex items-center gap-1.5 transition-colors group">
            <span>Watch All Videos &amp; Episodes</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </section>

      {/* ===================== TRENDING RELEASES ===================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wider mb-2">
              <Flame className="w-4 h-4 text-gold" />
              <span>Most Streamed</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Fan Favorites &amp; Plot Climaxes</h2>
          </div>
          <Link href="/videos" className="text-sm font-semibold text-gold-light hover:text-gold flex items-center gap-1.5 transition-colors group">
            <span>All Series Videos</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </section>

      {/* ===================== MEMBERSHIP TIERS PROMOTION ===================== */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl p-8 sm:p-12 lg:p-16 overflow-hidden glass border border-rose/30 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-3xl space-y-6">
            <Badge variant="premium">VIP Army Vault</Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground leading-tight">
              Unlock the Uncut Audio Vault &amp; <span className="text-gradient-rose">Terrace Hangouts</span>
            </h2>
            <p className="text-secondary text-base sm:text-lg leading-relaxed">
              Experience the extended romantic scenes, spicy unedited dialogues of Yashvi &amp; Vandana and Maya &amp; Siddhi, plus live voice script reads with Ishika.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 pt-4">
              {MOCK_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    plan.highlighted
                      ? 'bg-rose/10 border-rose/50 shadow-lg shadow-rose/10'
                      : 'bg-surface/60 border-border/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-foreground">{plan.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-elevated text-secondary font-mono">
                      {plan.badge}
                    </span>
                  </div>
                  <p className="text-2xl font-black text-foreground">
                    ₹{plan.price}
                    <span className="text-xs font-normal text-muted">/{plan.period}</span>
                  </p>
                  <p className="text-xs text-muted mt-2 line-clamp-2">{plan.description}</p>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-wrap gap-4">
              <Link href="/membership">
                <Button size="lg" variant="primary">
                  <span>Compare Plans &amp; VIP Perks</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== MERCHANDISE SPOTLIGHT ===================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wider mb-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Official Merch Drop</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Shiddat &amp; Series Apparel</h2>
          </div>
          <Link href="/store" className="text-sm font-semibold text-gold-light hover:text-gold flex items-center gap-1.5 transition-colors group">
            <span>Visit Full Merch Store</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ===================== COMMUNITY HIGHLIGHT ===================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl p-8 sm:p-12 glass border border-border/50 grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <Badge variant="gold">Ishq Army 💚 Community</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Connect with Ishika &amp; Fellow Fans</h2>
            <p className="text-secondary text-sm sm:text-base leading-relaxed">
              Step into character theory rooms for Shiddat and Not My Type. Share fan art, vote on plot confessions, and join live voice discussions with Ishika.
            </p>
            <div className="flex gap-4">
              <Link href="/community">
                <Button variant="primary">
                  <span>Enter Ishq Army Lounge</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Interactive Chat Stream Preview */}
          <div className="bg-background/80 rounded-2xl p-5 border border-border/60 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-foreground">Live Fan Stream</span>
              </div>
              <span className="text-xs text-muted">28.4K Online</span>
            </div>
            <div className="space-y-3">
              {recentMessages.map((msg) => (
                <div key={msg.id} className="p-3 rounded-xl bg-surface/50 border border-border/40 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <span>{msg.user.avatar}</span>
                      <span>{msg.user.name}</span>
                      {msg.user.badge && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose/20 text-rose-light font-bold">
                          {msg.user.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted">Just now</span>
                  </div>
                  <p className="text-secondary leading-relaxed">{msg.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
