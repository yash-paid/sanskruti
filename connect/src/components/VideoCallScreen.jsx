import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  ChevronLeft,
  RefreshCw,
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  Gift,
  MoreHorizontal,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function VideoCallScreen({
  expert,
  coins = 0,
  onEndCall,
  onToast,
  onDeductCoins,
  onInsufficientCoins,
  onOpenRecharge,
}) {
  const { t } = useLanguage();
  // Call States: 'connecting' | 'active' | 'error'
  const [callState, setCallState] = useState('connecting');
  const [connectingStage, setConnectingStage] = useState('Initializing Video...');
  const [callDuration, setCallDuration] = useState(0);

  // Per-minute coin rate
  const callRate = expert?.price || 25;
  const hasDeductedFirstMinuteRef = useRef(false);

  // Call Control Toggles
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  // Interactive Overlays
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [activeGiftAnim, setActiveGiftAnim] = useState(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Media Refs
  const expertVideoRef = useRef(null);
  const userCamVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const durationTimerRef = useRef(null);
  const hasSeekedRef = useRef(false);
  const lastSavedTimeRef = useRef(0);

  // Video source for expert (maps to 1.mp4 ... 23.mp4)
  const videoSrc = expert?.videoUrl || (expert?.index ? `/assets/videos/${expert.index}.mp4` : '/assets/videos/1.mp4');

  /* ── 0. Video Progress Memory (Resume from Last Position) ── */
  const getSavedPlaybackPosition = (expertId) => {
    if (!expertId) return 0;
    try {
      const saved = JSON.parse(localStorage.getItem('connect_video_progress') || '{}');
      return typeof saved[expertId] === 'number' ? saved[expertId] : 0;
    } catch (e) {
      return 0;
    }
  };

  const savePlaybackPosition = () => {
    if (!expert?.id) return;
    const curTime = expertVideoRef.current?.currentTime || lastSavedTimeRef.current || 0;
    const dur = expertVideoRef.current?.duration || 0;
    // If video reached near the very end (last 2 seconds), reset so next call starts fresh
    const timeToSave = (dur > 0 && curTime >= dur - 2) ? 0 : curTime;
    try {
      const saved = JSON.parse(localStorage.getItem('connect_video_progress') || '{}');
      saved[expert.id] = timeToSave;
      localStorage.setItem('connect_video_progress', JSON.stringify(saved));
    } catch (e) {}
  };

  useEffect(() => {
    return () => {
      savePlaybackPosition();
    };
  }, []);

  /* ── 1. Progressive Connection Stages ── */
  useEffect(() => {
    if (callState !== 'connecting') return;

    const t1 = setTimeout(() => {
      setConnectingStage('Connecting to Expert...');
    }, 1200);

    const t2 = setTimeout(() => {
      setConnectingStage('Starting Call...');
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [callState]);

  /* ── 2. Handle Expert Video Ready & Resume Playback ── */
  const handleLoadedMetadata = () => {
    if (!hasSeekedRef.current && expertVideoRef.current && expert?.id) {
      const savedTime = getSavedPlaybackPosition(expert.id);
      const dur = expertVideoRef.current.duration || 0;
      if (savedTime > 0 && (dur === 0 || savedTime < dur - 2)) {
        try {
          expertVideoRef.current.currentTime = savedTime;
        } catch (e) {}
      }
      hasSeekedRef.current = true;
    }
  };

  const handleVideoCanPlay = () => {
    if (callState === 'active') return;

    if (expertVideoRef.current) {
      if (!hasSeekedRef.current && expert?.id) {
        const savedTime = getSavedPlaybackPosition(expert.id);
        const dur = expertVideoRef.current.duration || 0;
        if (savedTime > 0 && (dur === 0 || savedTime < dur - 2)) {
          try {
            expertVideoRef.current.currentTime = savedTime;
          } catch (e) {}
        }
        hasSeekedRef.current = true;
      }

      expertVideoRef.current
        .play()
        .then(() => {
          // Transition to active call only once real video is playing
          setCallState('active');
        })
        .catch((err) => {
          console.warn('Autoplay error, retrying muted:', err);
          if (expertVideoRef.current) {
            expertVideoRef.current.muted = true;
            expertVideoRef.current
              .play()
              .then(() => setCallState('active'))
              .catch((e) => {
                setErrorMsg('Unable to start video stream.');
                setCallState('error');
              });
          }
        });
    }
  };

  const handleTimeUpdate = () => {
    if (expertVideoRef.current) {
      lastSavedTimeRef.current = expertVideoRef.current.currentTime;
    }
  };

  const handleVideoEnded = () => {
    if (expert?.id) {
      try {
        const saved = JSON.parse(localStorage.getItem('connect_video_progress') || '{}');
        saved[expert.id] = 0;
        localStorage.setItem('connect_video_progress', JSON.stringify(saved));
      } catch (e) {}
    }
  };

  const handleVideoError = () => {
    setErrorMsg(`Video for ${expert?.name || 'expert'} not found or still uploading. Please drop ${expert?.videoUrl?.split('/')?.pop()} into the 'upload-videos-here' folder.`);
    setCallState('error');
  };

  const handleRetry = () => {
    setErrorMsg('');
    setCallState('connecting');
    setConnectingStage('Initializing Video...');
    if (expertVideoRef.current) {
      expertVideoRef.current.load();
    }
  };

  /* ── 3. Active Call Duration Timer & Per-Minute Coin Deduction ── */
  // A. Deduct Minute 1 immediately when video call successfully connects
  useEffect(() => {
    if (callState === 'active' && !hasDeductedFirstMinuteRef.current) {
      hasDeductedFirstMinuteRef.current = true;
      const success = onDeductCoins ? onDeductCoins(callRate) : true;
      if (success) {
        onToast?.(`🪙 Deducted ${callRate} Coins (Minute 1 started)`);
      } else {
        setTimeout(() => {
          onToast?.('Insufficient coins to continue call!');
          if (onInsufficientCoins) {
            onInsufficientCoins();
          } else {
            onEndCall?.(0);
          }
        }, 50);
      }
    }
  }, [callState, callRate, onDeductCoins, onInsufficientCoins, onEndCall, onToast]);

  // B. Deduct subsequent minutes every 60 seconds (at 60s, 120s, 180s, etc.)
  useEffect(() => {
    if (callState === 'active') {
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => {
          const nextSec = prev + 1;
          // Every 60 seconds of conversation, deduct coins for the next minute
          if (nextSec > 0 && nextSec % 60 === 0) {
            const success = onDeductCoins ? onDeductCoins(callRate) : true;
            if (success) {
              const nextMin = Math.floor(nextSec / 60) + 1;
              onToast?.(`🪙 Deducted ${callRate} Coins (Minute ${nextMin} started)`);
            } else {
              // Out of coins! End call and immediately open recharge modal
              setTimeout(() => {
                onToast?.('Call ended: Coin balance exhausted!');
                if (onInsufficientCoins) {
                  onInsufficientCoins();
                } else {
                  onEndCall?.(nextSec);
                }
              }, 50);
            }
          }
          return nextSec;
        });
      }, 1000);
    } else {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    }

    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [callState, callRate, onDeductCoins, onInsufficientCoins, onEndCall, onToast]);

  /* ── 4. User Camera Preview (PiP) ── */
  useEffect(() => {
    let active = true;

    async function setupUserCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: isFrontCamera ? 'user' : 'environment' },
            audio: false,
          });
          if (active) {
            mediaStreamRef.current = stream;
            if (userCamVideoRef.current) {
              userCamVideoRef.current.srcObject = stream;
            }
          }
        }
      } catch (e) {
        // Fallback gracefully to simulated selfie view if camera permission not granted
        console.log('User camera not accessible or denied, using simulated preview.');
      }
    }

    if (callState === 'active') {
      setupUserCamera();
    }

    return () => {
      active = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [callState, isFrontCamera]);

  /* ── Clean Up on End Call ── */
  const handleEnd = () => {
    savePlaybackPosition();
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (expertVideoRef.current) {
      expertVideoRef.current.pause();
      expertVideoRef.current.src = '';
    }
    onEndCall?.(callDuration);
  };

  /* ── Controls Handlers ── */
  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (expertVideoRef.current) {
        expertVideoRef.current.muted = next;
      }
      onToast?.(next ? 'Microphone Muted' : 'Microphone Unmuted');
      return next;
    });
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn((prev) => {
      const next = !prev;
      onToast?.(next ? 'Speaker On' : 'Earpiece Mode');
      return next;
    });
  };

  const toggleVideo = () => {
    setIsVideoOff((prev) => {
      const next = !prev;
      onToast?.(next ? 'Camera Turned Off' : 'Camera Turned On');
      return next;
    });
  };

  const toggleCameraFlip = () => {
    setIsFrontCamera((prev) => !prev);
    onToast?.('Camera Switched');
  };

  const handleSendGift = (gift) => {
    // 1. Check if user has sufficient coins for this specific gift
    if (coins < gift.cost) {
      onToast?.(`⚠️ You need ${gift.cost} Coins to send ${gift.name}! Your balance: ${coins} Coins. Please recharge!`);
      if (onOpenRecharge) {
        onOpenRecharge();
      }
      return;
    }

    // 2. User has enough coins -> attempt deduction
    const success = onDeductCoins ? onDeductCoins(gift.cost) : false;
    if (success) {
      setShowGiftModal(false);
      setActiveGiftAnim(gift.emoji);
      onToast?.(`🎁 Sent ${gift.name} (${gift.emoji}) to ${expert.name}! (-${gift.cost} Coins)`);
      setTimeout(() => setActiveGiftAnim(null), 2500);
    } else {
      onToast?.(`⚠️ Insufficient coins! Please recharge to send ${gift.name}.`);
      if (onOpenRecharge) {
        onOpenRecharge();
      }
    }
  };

  // Format MM:SS or HH:MM:SS
  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const gifts = [
    { key: 'gift_rose', name: t('gift_rose', 'Rose'), emoji: '🌹', cost: 10 },
    { key: 'gift_chocolate', name: t('gift_chocolate', 'Chocolate'), emoji: '🍫', cost: 25 },
    { key: 'gift_teddy', name: t('gift_teddy', 'Teddy'), emoji: '🧸', cost: 50 },
    { key: 'gift_diamond', name: t('gift_diamond', 'Diamond'), emoji: '💎', cost: 100 },
    { key: 'gift_crown', name: t('gift_crown', 'Crown'), emoji: '👑', cost: 250 },
    { key: 'gift_car', name: t('gift_car', 'Sports Car'), emoji: '🏎️', cost: 500 },
  ];

  /* ══════════════════════════════════════════════════════════════
     RENDER SCREEN
     ══════════════════════════════════════════════════════════════ */
  return (
    <div className="video-call-root">
      {/* ── Strict Mobile Portrait 9:16 Phone Container ── */}
      <div className="video-call-phone-container">
        {/* ── Background Preloading/Active Video Element (9:16 Fullscreen Cropped) ── */}
        <video
          ref={expertVideoRef}
          src={videoSrc}
          playsInline
          autoPlay
          loop
          className={`video-call-fullscreen ${callState === 'active' && !isVideoOff ? 'visible' : 'hidden'}`}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleVideoCanPlay}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnded}
          onError={handleVideoError}
          muted={isMuted}
        />

      {/* When video is turned off by user or placeholder */}
      {callState === 'active' && isVideoOff && (
        <div className="video-off-backdrop">
          <div className="video-off-avatar">
            <img src={expert.photo} alt={expert.name} className="v-off-img" />
          </div>
          <span className="v-off-text">Video Paused</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
         SCREEN 1: CONNECTING CALL (Reference Left Image)
         ══════════════════════════════════════════════════════════ */}
      {callState === 'connecting' && (
        <div className="call-connecting-overlay">
          {/* Top Left Close Button */}
          <button className="connecting-cancel-btn" onClick={handleEnd} aria-label="Cancel Call">
            <X size={20} color="#fff" />
          </button>

          {/* Center Glowing Avatar with Radiating Pulse Rings */}
          <div className="connecting-hero-center">
            <div className="connecting-avatar-wrapper">
              <div className="connecting-pulse-ring ring-1" />
              <div className="connecting-pulse-ring ring-2" />
              <div className="connecting-pulse-ring ring-3" />
              <div className="connecting-avatar-frame">
                <img
                  src={expert.photo}
                  alt={expert.name}
                  className="connecting-avatar-img"
                  onError={(e) => {
                    e.target.src = '/assets/profiles/simran.jpg';
                  }}
                />
              </div>
            </div>

            {/* Connecting Call status text */}
            <h2 className="connecting-main-heading">Connecting Call...</h2>
            <p className="connecting-sub-heading">{connectingStage}</p>

            {/* Animated Pink Dots */}
            <div className="connecting-dots-row">
              <span className="c-dot dot-1" />
              <span className="c-dot dot-2" />
              <span className="c-dot dot-3" />
            </div>

            {/* Expert Info */}
            <div className="connecting-expert-info">
              <div className="connecting-name-row">
                <span className="connecting-name">{expert.name}</span>
                {expert.verified && (
                  <CheckCircle2 size={16} fill="#ff2a8d" color="#fff" className="v-tick-pink" />
                )}
              </div>
              <span className="connecting-call-type">Video Call</span>
            </div>
          </div>

          {/* Bottom Cancel Button */}
          <div className="connecting-bottom-bar">
            <button className="call-hangup-btn cancel-pill" onClick={handleEnd}>
              <PhoneOff size={22} fill="white" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
         ERROR SCREEN (Handles loading errors, Retry / Cancel)
         ══════════════════════════════════════════════════════════ */}
      {callState === 'error' && (
        <div className="call-connecting-overlay error-mode">
          <div className="error-card-box">
            <AlertCircle size={48} color="#ff2a8d" />
            <h3 className="error-title">Connection Error</h3>
            <p className="error-desc">{errorMsg || 'Unable to connect video call at this moment.'}</p>
            <div className="error-actions-row">
              <button className="error-retry-btn" onClick={handleRetry}>
                <RotateCcw size={16} />
                <span>Retry</span>
              </button>
              <button className="error-cancel-btn" onClick={handleEnd}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
         SCREEN 2: ACTIVE VIDEO CALL (Reference Right Images)
         ══════════════════════════════════════════════════════════ */}
      {callState === 'active' && (
        <div className="call-active-overlay">
          {/* Top Gradient Shadow for Readability */}
          <div className="call-top-gradient" />

          {/* ── Top Bar ── */}
          <div className="call-top-bar">
            {/* Left: Back button + Expert info + Rate chip */}
            <div className="call-top-left">
              <button className="call-header-back-btn" onClick={handleEnd} aria-label="Minimize Call">
                <ChevronLeft size={22} color="#fff" />
              </button>
              <div className="call-expert-meta">
                <div className="c-meta-name-row">
                  <span className="c-meta-name">{expert.name}</span>
                  {expert.verified && (
                    <CheckCircle2 size={15} fill="#ff2a8d" color="#fff" />
                  )}
                </div>
                <div className="c-meta-status-row">
                  <span className="live-pulse-dot" />
                  <span className="c-meta-status">{t('live_video_call', 'Live Video Call')}</span>
                </div>
                <div className="c-meta-rate-pill">
                  <span className="c-meta-coin">🪙</span>
                  <span>{callRate} {t('coins_per_min', 'Coins / Min')}</span>
                  <span className="c-meta-divider">•</span>
                  <span className="c-meta-balance" title="Your Coin Balance">Bal: {coins}</span>
                </div>
              </div>
            </div>

            {/* Top Center: Timer badge with red record dot */}
            <div className="call-timer-badge">
              <span className="record-red-dot" />
              <span className="timer-text">{formatTime(callDuration)}</span>
            </div>

            {/* Top Right: User Camera Preview (Picture-in-Picture) */}
            <div className="user-cam-pip" onClick={toggleCameraFlip} title="Tap to flip camera">
              <video
                ref={userCamVideoRef}
                autoPlay
                playsInline
                muted
                className="user-pip-video"
              />
              {/* Fallback image if user webcam stream not active */}
              <img
                src="/assets/profiles/priya.jpg"
                alt="Your camera preview"
                className="user-pip-fallback-img"
                onError={(e) => {
                  e.target.src = '/assets/profiles/simran.jpg';
                }}
              />
              <button className="pip-flip-btn" aria-label="Flip camera">
                <RefreshCw size={12} color="#fff" />
              </button>
            </div>
          </div>

          {/* ── Floating Gift Animation Overlay ── */}
          {activeGiftAnim && (
            <div className="floating-gift-anim" aria-hidden="true">
              <span className="f-gift-emoji">{activeGiftAnim}</span>
              <span className="f-gift-burst">✨ ✨ ✨</span>
            </div>
          )}

          {/* ── Right-side Floating Action Buttons ── */}
          <div className="call-floating-right-actions">
            {/* Gift Button */}
            <button
              className="floating-btn gift-btn"
              onClick={() => setShowGiftModal((prev) => !prev)}
              aria-label="Send Gift"
              title="Send Gift"
            >
              <Gift size={22} color="#fff" />
            </button>

            {/* More Button */}
            <button
              className="floating-btn more-btn"
              onClick={() => setShowMoreMenu((prev) => !prev)}
              aria-label="More options"
              title="More"
            >
              <MoreHorizontal size={22} color="#fff" />
            </button>
          </div>

          {/* ── Bottom Gradient Shadow ── */}
          <div className="call-bottom-gradient" />

          {/* ── Bottom Call Controls Row (Flip, Mute, End, Speaker, Video) ── */}
          <div className="call-bottom-controls-bar">
            {/* 1. Flip */}
            <div className="call-ctrl-item" onClick={toggleCameraFlip}>
              <div className="ctrl-btn-circle">
                <RefreshCw size={20} color="#fff" />
              </div>
              <span className="ctrl-btn-label">{t('flip', 'Flip')}</span>
            </div>

            {/* 2. Mute */}
            <div className={`call-ctrl-item ${isMuted ? 'active-toggled' : ''}`} onClick={toggleMute}>
              <div className="ctrl-btn-circle">
                {isMuted ? <MicOff size={20} color="#ff2a8d" /> : <Mic size={20} color="#fff" />}
              </div>
              <span className="ctrl-btn-label">{t('mute', 'Mute')}</span>
            </div>

            {/* 3. End (Large Red Hangup Button) */}
            <div className="call-ctrl-item end-call-item" onClick={handleEnd}>
              <div className="ctrl-btn-circle end-btn-circle">
                <PhoneOff size={26} color="#fff" />
              </div>
              <span className="ctrl-btn-label">{t('end_call', 'End')}</span>
            </div>

            {/* 4. Speaker */}
            <div
              className={`call-ctrl-item ${!isSpeakerOn ? 'active-toggled' : ''}`}
              onClick={toggleSpeaker}
            >
              <div className="ctrl-btn-circle">
                {isSpeakerOn ? <Volume2 size={20} color="#fff" /> : <VolumeX size={20} color="#ff2a8d" />}
              </div>
              <span className="ctrl-btn-label">{t('speaker', 'Speaker')}</span>
            </div>

            {/* 5. Video */}
            <div className={`call-ctrl-item ${isVideoOff ? 'active-toggled' : ''}`} onClick={toggleVideo}>
              <div className="ctrl-btn-circle">
                {isVideoOff ? <VideoOff size={20} color="#ff2a8d" /> : <Video size={20} color="#fff" />}
              </div>
              <span className="ctrl-btn-label">{t('video', 'Video')}</span>
            </div>
          </div>

          {/* ── Gift Selection Popup Modal ── */}
          {showGiftModal && (
            <div className="gift-modal-overlay" onClick={() => setShowGiftModal(false)}>
              <div className="gift-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="gift-modal-header">
                  <div className="gift-header-text">
                    <span className="gift-modal-title">{t('send_gift_to', 'Send a Gift to')} {expert.name}</span>
                    <span className="gift-balance-sub">🪙 {t('your_balance_label', 'Your Balance:')} <strong>{coins} {t('coins', 'Coins')}</strong></span>
                  </div>
                  <button
                    type="button"
                    className="gift-modal-close"
                    onClick={() => setShowGiftModal(false)}
                    aria-label="Close gift modal"
                  >
                    <X size={18} color="#fff" strokeWidth={2.4} />
                  </button>
                </div>
                <div className="gift-items-grid">
                  {gifts.map((g) => (
                    <div
                      key={g.key || g.name}
                      className="gift-card-item"
                      onClick={() => handleSendGift(g)}
                    >
                      <span className="gift-emoji">{g.emoji}</span>
                      <span className="gift-name">{g.name}</span>
                      <span className="gift-cost">🪙 {g.cost}</span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="gift-modal-recharge-btn"
                  onClick={() => {
                    setShowGiftModal(false);
                    onOpenRecharge?.();
                  }}
                >
                  <Wallet size={16} />
                  <span>{t('gift_recharge_btn', 'Recharge Coins to Send Bigger Gifts →')}</span>
                </button>
              </div>
            </div>
          )}

          {/* ── More Options Dropdown ── */}
          {showMoreMenu && (
            <div className="more-menu-popup" onClick={() => setShowMoreMenu(false)}>
              <div className="more-menu-card" onClick={(e) => e.stopPropagation()}>
                <div
                  className="more-menu-row"
                  onClick={() => {
                    setShowMoreMenu(false);
                    onToast?.('Audio switched to High Definition mode');
                  }}
                >
                  HD Audio Mode
                </div>
                <div
                  className="more-menu-row"
                  onClick={() => {
                    setShowMoreMenu(false);
                    onToast?.('Report submitted. Our safety team will review.');
                  }}
                >
                  Report Call
                </div>
                <div className="more-menu-row cancel" onClick={() => setShowMoreMenu(false)}>
                  Close
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

