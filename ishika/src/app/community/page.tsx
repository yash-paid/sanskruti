'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  MessageCircle, 
  Lock, 
  Send, 
  Users, 
  Crown, 
  Sparkles, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Maximize2, 
  Minimize2, 
  X, 
  Check, 
  Radio, 
  Info,
  Heart,
  Ban
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MOCK_CHAT_ROOMS, MOCK_CHAT_MESSAGES, MOCK_PLANS } from '@/lib/mock-data';
import { useUser } from '@/context/UserContext';
import { MembershipPurchaseModal } from '@/components/membership/MembershipPurchaseModal';
import type { ChatMessage } from '@/types';

// Pool of simulated lively fan messages for the Free Public Room
const FAN_SIMULATION_POOL = [
  { name: 'Aarushi Mehta', avatar: '🌸', text: 'Yashvi\'s dialogue in Part 85 gave me literal goosebumps 😭❤️' },
  { name: 'Pooja Verma', avatar: '💚', text: 'Wait is anyone re-listening to Not My Type Ep 32 right now?! That rain scene is legendary!' },
  { name: 'Megha Nair', avatar: '✨', text: 'Ishika\'s voice modulation when she narrates heartbroken scenes is unmatched! 🎧' },
  { name: 'Kiran Joshi', avatar: '𓆩♡𓆪', text: 'Who else ordered the couple necklace?! Can\'t wait for delivery!' },
  { name: 'Divya Sen', avatar: '🌙', text: 'Maya and Siddhi\'s chemistry in Episode 34 made me cry happy tears 🥺' },
  { name: 'Anjali R.', avatar: '🦋', text: 'Ishq Army is the best fandom in the world 💚 Love and respect to everyone here!' },
  { name: 'Shreya D.', avatar: '🌈', text: 'When love has no gender... that line will stay with me forever.' },
  { name: 'Tanya K.', avatar: '💫', text: 'Part 86 kab aayega koi batao please? Super excited!' },
];

export default function CommunityPage() {
  const { user } = useUser();
  const [selectedRoomId, setSelectedRoomId] = useState<'r-free' | 'r-exclusive'>('r-free');
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT_MESSAGES);
  const [inputMessage, setInputMessage] = useState('');
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [hasAcceptedRules, setHasAcceptedRules] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState(2842);

  const vipPlan = useMemo(() => MOCK_PLANS.find((p) => p.id === 'vip') || MOCK_PLANS[1], []);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mainWrapperRef = useRef<HTMLDivElement>(null);

  // Check if current user has VIP status (strictly locked unless purchased!)
  const isVipUser = useMemo(() => {
    return user?.membershipTier === 'VIP' || user?.membershipTier === 'Elite';
  }, [user]);

  const currentRoom = useMemo(() => {
    return MOCK_CHAT_ROOMS.find((r) => r.id === selectedRoomId) || MOCK_CHAT_ROOMS[0];
  }, [selectedRoomId]);

  const isRoomLocked = currentRoom.isPremium && !isVipUser;

  // Filter messages for current room
  const roomMessages = useMemo(() => {
    return messages.filter((m) => (m.roomId ? m.roomId === selectedRoomId : selectedRoomId === 'r-free'));
  }, [messages, selectedRoomId]);

  // Open rules modal automatically on first visit if not accepted
  useEffect(() => {
    const rulesAccepted = sessionStorage.getItem('ishika_chat_rules_accepted');
    if (!rulesAccepted) {
      setIsRulesModalOpen(true);
    } else {
      setHasAcceptedRules(true);
    }
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [roomMessages, selectedRoomId]);

  // Lock body scrolling on mobile so only internal chat messages can scroll
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Lively Fan Simulation: Incoming messages in Free Room every 14 seconds
  useEffect(() => {
    if (selectedRoomId !== 'r-free') return;

    const interval = setInterval(() => {
      const randomFan = FAN_SIMULATION_POOL[Math.floor(Math.random() * FAN_SIMULATION_POOL.length)];
      const newLiveMsg: ChatMessage = {
        id: 'live-' + Date.now(),
        roomId: 'r-free',
        user: {
          id: 'sim-' + Date.now(),
          name: randomFan.name,
          avatar: randomFan.avatar,
          isPremium: false,
        },
        content: randomFan.text,
        timestamp: new Date().toISOString(),
        isPremium: false,
      };

      setMessages((prev) => [...prev, newLiveMsg]);
      setOnlineCount((c) => c + (Math.random() > 0.5 ? 2 : -1));
    }, 14000);

    return () => clearInterval(interval);
  }, [selectedRoomId]);

  // Link & Promotion Detection Engine
  const linkDetected = useMemo(() => {
    if (!inputMessage) return false;
    const linkRegex = /(https?:\/\/|www\.|\.(com|in|org|net|me|io|co|xyz|link|gg|app)|t\.me|wa\.me|youtu\.be)/i;
    const promoRegex = /(subscribe to my|check my channel|follow my insta|dm for promo|buy now at)/i;
    return linkRegex.test(inputMessage) || promoRegex.test(inputMessage);
  }, [inputMessage]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isRoomLocked || linkDetected) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      roomId: selectedRoomId,
      user: {
        id: user?.id || 'you',
        name: user?.name || (isVipUser ? 'You (VIP Member)' : 'You (Ishq Army)'),
        avatar: isVipUser ? '👑' : '💚',
        isPremium: isVipUser,
        badge: isVipUser ? 'VIP' : undefined,
      },
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
      isPremium: isVipUser,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
  };

  const handleAcceptRules = () => {
    sessionStorage.setItem('ishika_chat_rules_accepted', 'true');
    setHasAcceptedRules(true);
    setIsRulesModalOpen(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mainWrapperRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const addEmojiToInput = (emoji: string) => {
    setInputMessage((prev) => prev + emoji);
  };

  return (
    <div 
      ref={mainWrapperRef}
      className={`w-full ${
        isFullscreen 
          ? 'fixed inset-0 z-[60] bg-[#08080c] p-2 sm:p-4 h-full' 
          : 'fixed top-16 bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-30 p-2 sm:p-3 bg-[#050507] md:static md:top-auto md:bottom-auto md:h-[calc(100vh-5.5rem)] md:max-w-7xl md:mx-auto md:px-4 md:py-3'
      } flex flex-col overflow-hidden transition-all duration-300`}
    >
      {/* ===================== 1. DIRECT 2-ROOM TABS (NEVER OVERLAPS) ===================== */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#0f0f17] rounded-2xl border border-border/60 mb-2.5 shrink-0 shadow-lg">
        {/* Tab 1: Free Public Room */}
        <button
          type="button"
          onClick={() => setSelectedRoomId('r-free')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            selectedRoomId === 'r-free'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-md shadow-emerald-500/10'
              : 'text-secondary hover:text-foreground hover:bg-white/5 border border-transparent'
          }`}
        >
          <span className="text-base">💚</span>
          <span className="truncate">Free Fan Lounge</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
            selectedRoomId === 'r-free' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-white/10 text-muted'
          }`}>
            38.4K
          </span>
        </button>

        {/* Tab 2: VIP Creator Terrace */}
        <button
          type="button"
          onClick={() => setSelectedRoomId('r-exclusive')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            selectedRoomId === 'r-exclusive'
              ? 'bg-gold/20 text-gold-light border border-gold/50 shadow-md shadow-gold/10'
              : 'text-secondary hover:text-foreground hover:bg-white/5 border border-transparent'
          }`}
        >
          <Crown className="w-4 h-4 text-gold shrink-0" />
          <span className="truncate">VIP Creator Terrace</span>
          {!isVipUser && <Lock className="w-3 h-3 text-gold shrink-0 animate-pulse" />}
        </button>
      </div>

      {/* ===================== 2. STATUS & CONTROLS SUB-HEADER (BULLETPROOF NO-OVERLAP) ===================== */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#0c0c14] border border-border/50 mb-2 shrink-0 overflow-hidden">
        {/* Left: Clean Room Title & Badge */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="font-extrabold text-foreground text-xs sm:text-sm truncate">
            {selectedRoomId === 'r-exclusive' ? 'VIP Creator Terrace' : 'Free Fan Lounge'}
          </span>
          {selectedRoomId === 'r-exclusive' ? (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-gold/20 text-gold-light border border-gold/40 shrink-0">
              EXCLUSIVE
            </span>
          ) : (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
              PUBLIC
            </span>
          )}
        </div>

        {/* Right: Live Counter + Rules + Fullscreen (Shrink-proof & Zero Overlap) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Live Online Users Counter */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{onlineCount.toLocaleString()}</span>
          </div>

          {/* Rules Modal Button */}
          <button
            type="button"
            onClick={() => setIsRulesModalOpen(true)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose/15 hover:bg-rose/25 border border-rose/30 text-rose-light text-[10px] font-bold transition-colors shrink-0"
            title="View Rules"
          >
            <ShieldAlert className="w-3 h-3 text-rose" />
            <span className="hidden sm:inline">Rules</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1 rounded-lg bg-surface hover:bg-elevated border border-border/50 text-secondary hover:text-foreground transition-colors shrink-0"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Chat'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-gold" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ===================== 3. MAIN CHAT STREAM CONTAINER ===================== */}
      <div className="relative flex-1 rounded-2xl bg-[#09090f] border border-border/50 flex flex-col justify-between overflow-hidden shadow-2xl min-h-0">
        {/* Exclusive Room Gatekeeper Screen (If Locked) */}
        {isRoomLocked ? (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-4 sm:p-6 text-center space-y-4 overflow-y-auto bg-[#0a0a12]">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-gold/30 via-rose/20 to-gold/40 border-2 border-gold/50 flex items-center justify-center shadow-2xl shadow-gold/20">
                <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-gold animate-bounce" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-rose text-white shadow">
                <Lock className="w-3 h-3" />
              </div>
            </div>

            <div className="space-y-1.5 max-w-md">
              <span className="text-[10px] uppercase font-black tracking-widest text-gold px-2.5 py-0.5 rounded-full bg-gold/15 border border-gold/30">
                VIP Creator Room
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                VIP Creator Terrace is Locked
              </h2>
              <p className="text-xs text-secondary leading-relaxed">
                Reserved for <strong>VIP &amp; Elite members</strong>. Connect directly with Ishika, hear unedited voice takes, and take part in live monthly audio hangouts.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full max-w-lg text-left text-xs">
              <div className="p-3 rounded-xl bg-[#12121c] border border-border/40 space-y-0.5">
                <span className="text-gold font-bold text-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Direct Replies
                </span>
                <p className="text-[10px] text-muted">Ishika answers questions here directly.</p>
              </div>
              <div className="p-3 rounded-xl bg-[#12121c] border border-border/40 space-y-0.5">
                <span className="text-rose-light font-bold text-xs flex items-center gap-1">
                  <Radio className="w-3 h-3" /> Voice Memos
                </span>
                <p className="text-[10px] text-muted">Raw audio takes &amp; private story leaks.</p>
              </div>
              <div className="p-3 rounded-xl bg-[#12121c] border border-border/40 space-y-0.5">
                <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Crown Flair
                </span>
                <p className="text-[10px] text-muted">Exclusive golden badge beside your name.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <Button
                type="button"
                variant="gold"
                size="sm"
                onClick={() => setIsPurchaseModalOpen(true)}
                className="font-black shadow-lg shadow-gold/25 text-xs py-2.5 px-6 flex items-center gap-1.5"
              >
                <Crown className="w-4 h-4 text-background fill-background" />
                <span>Unlock VIP Creator Terrace</span>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Message Feed Container */}
            <div 
              ref={chatContainerRef}
              className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-3.5 no-scrollbar scroll-smooth"
            >
              {/* Room Guidelines Reminder Bar */}
              <div className="p-3 rounded-xl bg-[#101018] border border-border/40 flex items-center justify-between text-xs max-w-xl mx-auto">
                <div className="flex items-center gap-2 text-muted text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>External links &amp; promotions are strictly prohibited.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRulesModalOpen(true)}
                  className="text-[10px] text-gold hover:underline font-bold shrink-0 ml-2"
                >
                  View Rules
                </button>
              </div>

              {/* Messages List */}
              {roomMessages.map((msg) => {
                const isCreator = msg.user.badge === 'CREATOR';
                const isSelf = msg.user.id === user?.id || msg.user.name.includes('You');
                return (
                  <div 
                    key={msg.id} 
                    className={`flex items-start gap-2.5 text-xs animate-in fade-in duration-200 ${
                      isCreator ? 'p-3 rounded-2xl bg-gradient-to-r from-gold/15 via-[#14141e] to-gold/5 border border-gold/40 shadow-lg' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 ${
                      isCreator 
                        ? 'bg-gold/30 border border-gold shadow-md shadow-gold/30' 
                        : 'bg-elevated border border-border/50'
                    }`}>
                      {msg.user.avatar}
                    </div>

                    <div className="space-y-1 flex-1 max-w-2xl min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className={`font-bold ${isCreator ? 'text-gold-light text-sm' : 'text-foreground'}`}>
                          {msg.user.name}
                        </span>
                        {isCreator && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-gold text-background font-black flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            CREATOR
                          </span>
                        )}
                        {msg.user.badge && !isCreator && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose/20 text-rose-light font-bold border border-rose/30">
                            {msg.user.badge}
                          </span>
                        )}
                        <span className="text-[10px] text-muted">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className={`p-2.5 sm:p-3 rounded-2xl leading-relaxed text-secondary ${
                        isCreator 
                          ? 'bg-transparent text-foreground font-medium' 
                          : isSelf 
                          ? 'bg-rose/15 border border-rose/30 text-foreground' 
                          : 'bg-[#12121c] border border-border/40'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Protected Input Box Area */}
            <div className="p-2.5 sm:p-3 border-t border-border/40 bg-[#0c0c14] space-y-2 shrink-0 z-10">
              {/* Anti-Link Warning Banner */}
              {linkDetected && (
                <div className="p-2 rounded-xl bg-rose/15 border border-rose/50 text-rose-light text-[11px] font-bold flex items-center gap-2 animate-bounce">
                  <Ban className="w-3.5 h-3.5 text-rose shrink-0" />
                  <span>Links &amp; promotions are strictly prohibited in the community! Please remove to send.</span>
                </div>
              )}

              {/* Quick Emoji Bar */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5 text-sm">
                <span className="text-[10px] text-muted uppercase font-bold shrink-0 mr-1">React:</span>
                {['💚', '🌈', '🥺', '😭', '🔥', '👑', '✨', '💕'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => addEmojiToInput(emoji)}
                    className="px-2 py-0.5 rounded-lg bg-[#141420] hover:bg-elevated text-xs transition-transform hover:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Message Submission Form */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={
                      linkDetected
                        ? 'Links are not permitted here...'
                        : selectedRoomId === 'r-free'
                        ? 'Chat with fans (links & promotions strictly prohibited)...'
                        : 'Message the exclusive VIP Terrace with Ishika...'
                    }
                    className={`w-full px-3.5 py-2 rounded-xl bg-elevated border text-foreground text-xs sm:text-sm placeholder:text-muted focus:outline-none transition-all ${
                      linkDetected 
                        ? 'border-rose focus:ring-1 focus:ring-rose text-rose-light' 
                        : 'border-border focus:border-rose focus:ring-1 focus:ring-rose'
                    }`}
                  />
                </div>

                <Button
                  type="submit"
                  variant={selectedRoomId === 'r-exclusive' ? 'gold' : 'primary'}
                  size="sm"
                  disabled={!inputMessage.trim() || linkDetected}
                  className="shrink-0 font-bold px-3.5 py-2 text-xs"
                  title={linkDetected ? 'Remove links to send message' : 'Send message'}
                >
                  <Send className="w-3.5 h-3.5 mr-1" />
                  <span>Send</span>
                </Button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* ===================== MANDATORY RULES & GUIDELINES MODAL ===================== */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-rose/40 bg-[#0c0c14] p-6 sm:p-8 space-y-5 shadow-2xl">
            {hasAcceptedRules && (
              <button
                onClick={() => setIsRulesModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-muted hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-3 pb-3 border-b border-border/40">
              <div className="w-11 h-11 rounded-2xl bg-rose/20 border border-rose/40 flex items-center justify-center text-rose-light shrink-0">
                <ShieldAlert className="w-5 h-5 text-rose" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-rose-light">Community Etiquette</span>
                <h3 className="text-lg sm:text-xl font-black text-foreground">Room Rules &amp; Anti-Spam Policy</h3>
              </div>
            </div>

            {/* Rules Cards */}
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-[#12121c] border border-border/40 flex items-start gap-2.5">
                <Ban className="w-4 h-4 text-rose shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-foreground">1. Strictly NO Links or External URLs</h4>
                  <p className="text-muted text-[11px] mt-0.5">
                    Posting website links, YouTube URLs, Telegram channels, or WhatsApp invites is strictly blocked.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#12121c] border border-border/40 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-foreground">2. NO Self-Promotion or Advertising</h4>
                  <p className="text-muted text-[11px] mt-0.5">
                    Do not promote personal channels, social handles, or commercial products in the fan lounge.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#12121c] border border-border/40 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-foreground">3. Respect Fellow Fans &amp; Ishika</h4>
                  <p className="text-muted text-[11px] mt-0.5">
                    Zero tolerance for abusive language, slurs, harassment, or negative trolling.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#12121c] border border-border/40 flex items-start gap-2.5">
                <Heart className="w-4 h-4 text-rose-light shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-foreground">4. No Sharing of Personal Contact Details</h4>
                  <p className="text-muted text-[11px] mt-0.5">
                    Never post phone numbers, WhatsApp, or private residential details for safety.
                  </p>
                </div>
              </div>
            </div>

            {/* Accept Button */}
            <div className="pt-2">
              <button
                onClick={handleAcceptRules}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose to-rose-dark text-white font-black text-xs sm:text-sm hover:opacity-90 transition-all shadow-lg shadow-rose/25 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>I Understand &amp; Agree to the Rules</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIP Membership Purchase & Activation Modal */}
      <MembershipPurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        plan={vipPlan}
        billingCycle="monthly"
      />
    </div>
  );
}
