'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  ShoppingBag, 
  User, 
  Search, 
  MoreVertical, 
  PackageCheck, 
  Crown, 
  Clock, 
  HelpCircle,
  Sparkles,
  ChevronRight,
  Radio
} from 'lucide-react';
import { NAV_LINKS, BRAND } from '@/lib/constants';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const { itemCount } = useCart();
  const { isLoggedIn } = useUser();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    }
    if (moreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [moreMenuOpen]);

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo with User Uploaded Official Brand Seal */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-gold/40 shadow-sm shadow-gold/20 shrink-0 bg-surface">
              <Image
                src="/logo.png"
                alt="Ishika's World Official Logo"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
                priority
              />
            </div>
            <span className="text-xs sm:text-sm md:text-base font-black tracking-tight whitespace-nowrap flex items-center gap-1">
              <span className="text-gradient-rose">ISHIKA&apos;S</span>
              <span className="text-gradient-gold">WORLD</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-secondary hover:text-foreground transition-colors rounded-lg hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link 
              href="/videos" 
              className="hidden md:flex p-2 rounded-lg text-secondary hover:text-foreground hover:bg-white/5 transition-colors" 
              title="Search Videos"
            >
              <Search className="w-5 h-5" />
            </Link>

            <Link 
              href="/cart" 
              className="relative p-2 rounded-lg text-secondary hover:text-foreground hover:bg-white/5 transition-colors"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                  {itemCount}
                </span>
              )}
            </Link>

            <Link
              href={isLoggedIn ? '/profile' : '/login'}
              className="p-2 rounded-lg text-secondary hover:text-foreground hover:bg-white/5 transition-colors"
              title="My Profile"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Three-Dot Menu Button & Dropdown */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className={`p-2 rounded-lg transition-all ${
                  moreMenuOpen 
                    ? 'text-gold bg-gold/15 shadow-inner' 
                    : 'text-secondary hover:text-foreground hover:bg-white/5'
                }`}
                title="Quick Shortcuts & Orders"
                aria-label="More options"
                aria-expanded={moreMenuOpen}
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {moreMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-gold/40 bg-[#0c0c14] shadow-2xl p-2 z-[70] divide-y divide-border/40"
                  >
                    {/* Primary Highlight: View My Orders */}
                    <div className="p-1 pb-2">
                      <Link
                        href="/orders"
                        onClick={() => setMoreMenuOpen(false)}
                        className="flex items-center justify-between p-3 rounded-xl bg-gold/10 hover:bg-gold/20 border border-gold/30 text-foreground transition-all group shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gold/25 flex items-center justify-center text-gold-light group-hover:scale-110 transition-transform">
                            <PackageCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-foreground">View My Orders</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose text-white font-bold">
                                Live
                              </span>
                            </div>
                            <p className="text-[11px] text-muted">Track packages &amp; invoices</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gold group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>

                    {/* Secondary Navigation Links */}
                    <div className="py-1.5 space-y-0.5">
                      <Link
                        href="/my-membership"
                        onClick={() => setMoreMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-secondary hover:text-foreground hover:bg-white/5 transition-colors group"
                      >
                        <Crown className="w-4 h-4 text-gold shrink-0 group-hover:scale-110 transition-transform" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-foreground">My Membership</p>
                          <p className="text-[10px] text-muted">VIP pass &amp; audio vault</p>
                        </div>
                      </Link>

                      <Link
                        href="/history"
                        onClick={() => setMoreMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-secondary hover:text-foreground hover:bg-white/5 transition-colors group"
                      >
                        <Clock className="w-4 h-4 text-rose-light shrink-0 group-hover:scale-110 transition-transform" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-foreground">Watch History</p>
                          <p className="text-[10px] text-muted">Resume recent episodes</p>
                        </div>
                      </Link>

                      <Link
                        href="/store"
                        onClick={() => setMoreMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-secondary hover:text-foreground hover:bg-white/5 transition-colors group"
                      >
                        <ShoppingBag className="w-4 h-4 text-secondary shrink-0 group-hover:scale-110 transition-transform" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-foreground">Creator Store</p>
                          <p className="text-[10px] text-muted">Shirts, pants &amp; couple jewelry</p>
                        </div>
                      </Link>

                      <Link
                        href="/contact"
                        onClick={() => setMoreMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-secondary hover:text-foreground hover:bg-white/5 transition-colors group"
                      >
                        <HelpCircle className="w-4 h-4 text-muted shrink-0 group-hover:scale-110 transition-transform" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-foreground">Help &amp; Support</p>
                          <p className="text-[10px] text-muted">Delivery issues &amp; FAQs</p>
                        </div>
                      </Link>

                      <a
                        href="/connect"
                        onClick={() => setMoreMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-secondary hover:text-foreground hover:bg-white/5 transition-colors group border-t border-border/30 pt-2"
                      >
                        <Radio className="w-4 h-4 text-rose shrink-0 group-hover:scale-110 transition-transform animate-pulse" />
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-foreground">Connect Live</p>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose/20 text-rose font-bold">1-on-1</span>
                          </div>
                          <p className="text-[10px] text-muted">Live video &amp; voice calls</p>
                        </div>
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-secondary hover:text-foreground hover:bg-white/5 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/50 overflow-hidden bg-background/95 backdrop-blur-xl"
          >
            <nav className="px-4 py-4 space-y-2">
              {/* Highlighted Mobile Shortcut: View My Orders */}
              <Link
                href="/orders"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl bg-gold/15 border border-gold/30 text-gold-light font-bold text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <PackageCheck className="w-4 h-4 text-gold" />
                  <span>View My Orders &amp; Tracking</span>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-gold text-background font-black">
                  TRACK
                </span>
              </Link>

              {/* Connect Live Shortcut */}
              <a
                href="/connect"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl bg-rose/10 border border-rose/30 text-rose-light font-bold text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-rose animate-pulse" />
                  <span>Connect Live (Video &amp; Voice)</span>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose text-white font-black">
                  LIVE
                </span>
              </a>

              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-sm font-medium text-secondary hover:text-foreground hover:bg-white/5 rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-2 border-t border-border/40 grid grid-cols-2 gap-2">
                <Link
                  href="/my-membership"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-secondary hover:text-foreground rounded-lg bg-surface"
                >
                  <Crown className="w-3.5 h-3.5 text-gold" />
                  <span>Membership</span>
                </Link>
                <Link
                  href="/history"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-secondary hover:text-foreground rounded-lg bg-surface"
                >
                  <Clock className="w-3.5 h-3.5 text-rose-light" />
                  <span>Watch History</span>
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
