import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  ChevronLeft,
  RefreshCw,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  Gift,
  MoreHorizontal,
  RotateCcw,
  AlertCircle,
  Wallet,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/* ── Live Stream Gift Animation Overlay Component ── */
function GiftAnimationOverlay({ gift, expertName, onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 2800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!gift) return null;

  return (
    <div className={`gift-anim-stage ${gift.key}`} aria-hidden="true">
      {/* 1. Ambient Glow Backdrop */}
      <div className="gift-anim-ambient-glow" />

      {/* 2. Top Banner */}
      <div className="gift-sender-banner">
        <span className="banner-sparkle">✨</span>
        <span className="banner-text">
          Sent <strong>{gift.name}</strong> to {expertName}!
        </span>
        <span className="banner-cost-tag">🪙 {gift.cost}</span>
        <span className="banner-sparkle">✨</span>
      </div>

      {/* 3. Hero Centerpiece (Scale + Radiant Rays) */}
      <div className="gift-hero-wrap">
        <div className="gift-hero-emoji">{gift.emoji}</div>
        <div className="gift-hero-rays" />
      </div>

      {/* 4. Particle Shower / Unique Animations */}
      {gift.key === 'gift_rose' && (
        <div className="gift-particles-container">
          {[...Array(16)].map((_, i) => (
            <span
              key={i}
              className={`p-item rose-petal`}
              style={{ left: `${6 + i * 5.8}%`, animationDelay: `${(i % 6) * 0.12}s` }}
            >
              {i % 3 === 0 ? '🌹' : i % 3 === 1 ? '🌸' : '✨'}
            </span>
          ))}
        </div>
      )}

      {gift.key === 'gift_chocolate' && (
        <div className="gift-particles-container">
          {[...Array(14)].map((_, i) => (
            <span
              key={i}
              className={`p-item choc-item`}
              style={{ left: `${8 + i * 6.5}%`, animationDelay: `${(i % 5) * 0.14}s` }}
            >
              {i % 2 === 0 ? '🍫' : '💖'}
            </span>
          ))}
        </div>
      )}

      {gift.key === 'gift_teddy' && (
        <div className="gift-particles-container">
          {[...Array(12)].map((_, i) => (
            <span
              key={i}
              className="p-item teddy-item"
              style={{ left: `${10 + i * 7}%`, animationDelay: `${(i % 4) * 0.15}s` }}
            >
              {i % 2 === 0 ? '🧸' : '💕'}
            </span>
          ))}
        </div>
      )}

      {gift.key === 'gift_diamond' && (
        <div className="gift-particles-container">
          {[...Array(18)].map((_, i) => (
            <span
              key={i}
              className="p-item diamond-item"
              style={{ left: `${5 + i * 5.2}%`, animationDelay: `${(i % 6) * 0.1}s` }}
            >
              {i % 3 === 0 ? '💎' : i % 3 === 1 ? '✨' : '⭐'}
            </span>
          ))}
        </div>
      )}

      {gift.key === 'gift_crown' && (
        <div className="gift-particles-container">
          {[...Array(16)].map((_, i) => (
            <span
              key={i}
              className="p-item crown-item"
              style={{ left: `${7 + i * 5.8}%`, animationDelay: `${(i % 5) * 0.12}s` }}
            >
              {i % 2 === 0 ? '👑' : '🎆'}
            </span>
          ))}
        </div>
      )}

      {gift.key === 'gift_car' && (
        <div className="gift-car-track">
          <div className="speed-lines" />
          <div className="flying-supercar">🏎️💨</div>
        </div>
      )}
    </div>
  );
}

export default function VideoCallScreen({
  expert,
  uid,
  coins = 0,
  onEndCall,
  onToast,
  onDeductCoins,
  onAddCoins,
  onInsufficientCoins,
  onOpenRecharge,
  isDemo = false,
}) {
  const { t } = useLanguage();
  // Call States: 'connecting' | 'active' | 'error'
  const [callState, setCallState] = useState('connecting');
  const [connectingStage, setConnectingStage] = useState('Initializing Video...');
  const [callDuration, setCallDuration] = useState(0);

  // In-call grace window states (prevents abrupt disconnects when balance is low)
  const [graceSecondsLeft, setGraceSecondsLeft] = useState(null);
  const inGracePeriodRef = useRef(false);
  const pendingMinuteRef = useRef(1);

  // Per-minute coin rate (65 Coins/min for Uma & Simran, 30 Coins/min for all others)
  const isTopExpert = expert?.id === 'simran' || expert?.id === 'uma' || expert?.top;
  const callRate = isTopExpert ? 65 : (Number(expert?.price) || 30);
  const numericCoins = Number(coins) || 0;

  // Demo / incoming free 10s preview states
  const [isDemoActive, setIsDemoActive] = useState(isDemo);
  const isDemoActiveRef = useRef(isDemo);
  const hasUserContinuedRef = useRef(false);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const showContinuePromptRef = useRef(false);
  const [isWaitingForRecharge, setIsWaitingForRecharge] = useState(false);
  const isWaitingForRechargeRef = useRef(false);

  useEffect(() => {
    if (!hasUserContinuedRef.current) {
      setIsDemoActive(isDemo);
      isDemoActiveRef.current = isDemo;
    }
  }, [isDemo]);

  const hasDeductedFirstMinuteRef = useRef(false);
  const coinsRef = useRef(numericCoins);

  useEffect(() => {
    coinsRef.current = Number(coins) || 0;
  }, [coins]);

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
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(true);

  // Media Refs
  const expertVideoRef = useRef(null);
  const userCamVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const availableCamerasRef = useRef([]);
  const activeCameraIndexRef = useRef(0);
  const durationTimerRef = useRef(null);
  const hasSeekedRef = useRef(false);
  const lastSavedTimeRef = useRef(0);

  // Video source for expert (maps to 1.mp4 ... 23.mp4)
  const videoSrc = expert?.videoUrl || (expert?.index ? `/assets/videos/${expert.index}.mp4` : '/assets/videos/1.mp4');

  /* ── 0. Video Progress Memory (Per-Account & Per-Expert Resume) ── */
  const getStorageKey = () => (uid ? `connect_video_progress_${uid}` : 'connect_video_progress');

  const getSavedPlaybackPosition = (expertId) => {
    if (!expertId) return 0;
    try {
      const key = getStorageKey();
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      const pos = saved[expertId];
      return typeof pos === 'number' && pos > 0 ? pos : 0;
    } catch (e) {
      return 0;
    }
  };

  const savePlaybackPosition = (overrideTime) => {
    if (!expert?.id) return;
    const curTime = typeof overrideTime === 'number'
      ? overrideTime
      : expertVideoRef.current?.currentTime || lastSavedTimeRef.current || 0;
    if (curTime <= 0) return;

    try {
      const key = getStorageKey();
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      saved[expert.id] = curTime;
      localStorage.setItem(key, JSON.stringify(saved));
      lastSavedTimeRef.current = curTime;
    } catch (e) {}
  };

  useEffect(() => {
    return () => {
      savePlaybackPosition();
    };
  }, [expert?.id, uid]);

  /* ── 1. Progressive Connection Stages ── */
  useEffect(() => {
    if (callState !== 'connecting') return;

    if (isDemo) {
      const fastConnect = setTimeout(() => {
        if (expertVideoRef.current) {
          expertVideoRef.current
            .play()
            .then(() => setCallState('active'))
            .catch(() => setCallState('active'));
        } else {
          setCallState('active');
        }
      }, 350);
      return () => clearTimeout(fastConnect);
    }

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
  }, [callState, isDemo]);

  /* ── 2. Handle Expert Video Ready & Resume Playback ── */
  const applyResumePosition = () => {
    if (!expertVideoRef.current || !expert?.id) return;
    const savedTime = getSavedPlaybackPosition(expert.id);
    if (savedTime > 0) {
      try {
        const dur = expertVideoRef.current.duration;
        const targetTime = dur > 0 ? (savedTime % dur) : savedTime;
        if (Math.abs(expertVideoRef.current.currentTime - targetTime) > 0.5) {
          expertVideoRef.current.currentTime = targetTime;
        }
      } catch (e) {
        console.warn('Seek error:', e);
      }
    }
    hasSeekedRef.current = true;
  };

  const handleLoadedMetadata = () => {
    applyResumePosition();
  };

  const handleVideoCanPlay = () => {
    applyResumePosition();
    if (callState === 'active') return;

    if (expertVideoRef.current) {
      expertVideoRef.current
        .play()
        .then(() => {
          applyResumePosition();
          setCallState('active');
        })
        .catch((err) => {
          console.warn('Autoplay error, retrying muted:', err);
          if (expertVideoRef.current) {
            expertVideoRef.current.muted = true;
            expertVideoRef.current
              .play()
              .then(() => {
                applyResumePosition();
                setCallState('active');
              })
              .catch(() => {
                setErrorMsg('Unable to start video stream.');
                setCallState('error');
              });
          }
        });
    }
  };

  const handleTimeUpdate = () => {
    if (expertVideoRef.current && expert?.id) {
      const cur = expertVideoRef.current.currentTime;
      if (cur > 0) {
        lastSavedTimeRef.current = cur;
        // Continuously persist current playback position so progress is never lost
        try {
          const key = getStorageKey();
          const saved = JSON.parse(localStorage.getItem(key) || '{}');
          saved[expert.id] = cur;
          localStorage.setItem(key, JSON.stringify(saved));
        } catch (e) {}
      }
    }
  };

  const handleVideoEnded = () => {
    // If video naturally ends, allow it to loop without resetting to 0
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
  // A. Deduct Minute 1 immediately in the starting 1 second when call starts (only for paid calls, NOT for free 10s preview)
  useEffect(() => {
    if (isDemoActive) return; // Zero coin deduction for demo / free 10s preview calls
    if (!hasDeductedFirstMinuteRef.current) {
      hasDeductedFirstMinuteRef.current = true;
      (async () => {
        const numericCoins = Number(coinsRef.current ?? coins) || 0;
        const numericRate = Number(callRate) || 30;
        if (numericCoins < numericRate) {
          onToast?.('⚠️ Insufficient coins to start call! Please recharge.');
          if (onInsufficientCoins) {
            onInsufficientCoins();
          } else {
            onEndCall?.(0);
          }
          return;
        }

        const success = onDeductCoins
          ? await onDeductCoins(numericRate, {
              type: 'call',
              title: `Call with ${expert?.name || 'Expert'} (Min 1)`,
              expertId: expert?.id,
              expertName: expert?.name,
            })
          : true;

        const updatedCoins = Number(coinsRef.current ?? coins) || 0;
        if (!success && updatedCoins < numericRate) {
          onToast?.('⚠️ Insufficient coins to start call! Please recharge.');
          if (onInsufficientCoins) {
            onInsufficientCoins();
          } else {
            onEndCall?.(0);
          }
        }
      })();
    }
  }, [isDemoActive]);

  // B. Deduct subsequent minutes every 60 seconds (at 60s, 120s, 180s, etc.) & check 10s preview limit
  useEffect(() => {
    if (callState === 'active') {
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => {
          // If in low-balance grace countdown, showing continue prompt, or waiting for recharge, hold duration
          if (inGracePeriodRef.current || showContinuePromptRef.current || isWaitingForRechargeRef.current) {
            return prev;
          }

          const nextSec = prev + 1;

          // In incoming free preview: check at 10 seconds!
          if (isDemoActiveRef.current && !hasUserContinuedRef.current && nextSec >= 10) {
            const currentCoins = Number(coinsRef.current ?? coins) || 0;
            const numericRate = Number(callRate) || 30;

            // Always STOP the video — call is CUT regardless of coins
            try { expertVideoRef.current?.pause(); } catch (_) {}

            if (currentCoins >= numericRate) {
              // User HAS coins → cut call but show "Continue with Coins?" popup
              // (Keep duration timer alive; line 415 holds duration at 10 while popup is open)
              showContinuePromptRef.current = true;
              setShowContinuePrompt(true);
            } else {
              // User has NO coins → clear interval & end call directly with a toast
              if (durationTimerRef.current) clearInterval(durationTimerRef.current);
              onToast?.(`Free 10s preview ended! Add coins to call ${expert?.name || 'Expert'} again.`);
              setTimeout(() => {
                onEndCall?.(0);
              }, 1500);
            }
            return 10;
          }

          // Every 60 seconds (at 60s, 120s, 180s, etc.), deduct coins for the next minute (Minute 2 at 1 min, Minute 3 at 2 min, etc.)
          if (!isDemoActiveRef.current && nextSec > 0 && nextSec % 60 === 0) {
            const nextMin = Math.floor(nextSec / 60) + 1;
            const numericCoins = Number(coinsRef.current ?? coins) || 0;
            const numericRate = Number(callRate) || 30;

            // Check if user has sufficient coins for next minute
            if (numericCoins < numericRate) {
              // Smooth in-call grace window: pause duration counter, show recharge popup & countdown banner
              inGracePeriodRef.current = true;
              pendingMinuteRef.current = nextMin;
              setGraceSecondsLeft(15);
              onToast?.(`⚠️ Low Coins (${numericCoins})! Please recharge within 15s to continue call with ${expert?.name || 'Expert'}.`);
              if (onOpenRecharge) {
                onOpenRecharge();
              } else if (onInsufficientCoins) {
                onInsufficientCoins();
              }
              return nextSec;
            }

            (async () => {
              const success = onDeductCoins
                ? await onDeductCoins(numericRate, {
                    type: 'call',
                    title: `Call with ${expert?.name || 'Expert'} (Min ${nextMin})`,
                    expertId: expert?.id,
                    expertName: expert?.name,
                  })
                : true;

              const updatedCoins = Number(coinsRef.current ?? coins) || 0;
              if (!success || updatedCoins < 0) {
                inGracePeriodRef.current = true;
                pendingMinuteRef.current = nextMin;
                setGraceSecondsLeft(15);
                onToast?.(`⚠️ Low Coins! Please recharge within 15s to keep talking.`);
                if (onOpenRecharge) {
                  onOpenRecharge();
                } else if (onInsufficientCoins) {
                  onInsufficientCoins();
                }
              }
            })();
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
  }, [callState, callRate, onDeductCoins, onInsufficientCoins, onOpenRecharge, onEndCall, onToast, expert]);

  // C. In-Call Grace Window Countdown (15s timer when balance is exhausted for next minute)
  useEffect(() => {
    if (graceSecondsLeft === null) return;

    const numericCoins = Number(coinsRef.current ?? coins) || 0;
    const numericRate = Number(callRate) || 30;

    // 1. Balance replenished! Exit grace period and deduct next minute
    if (numericCoins >= numericRate) {
      inGracePeriodRef.current = false;
      const minToDeduct = pendingMinuteRef.current || 1;
      setGraceSecondsLeft(null);
      setIsDemoActive(false);
      isDemoActiveRef.current = false;
      hasDeductedFirstMinuteRef.current = true;
      try {
        expertVideoRef.current?.play().catch(() => {});
      } catch (_) {}
      (async () => {
        await onDeductCoins?.(numericRate, {
          type: 'call',
          title: `Call with ${expert?.name || 'Expert'} (Min ${minToDeduct})`,
          expertId: expert?.id,
          expertName: expert?.name,
        });
        onToast?.(`✅ Recharged! Continuing call with ${expert?.name || 'Expert'}.`);
      })();
      return;
    }

    // 2. Grace period expired without recharging: end call gracefully
    if (graceSecondsLeft <= 0) {
      inGracePeriodRef.current = false;
      setGraceSecondsLeft(null);
      onToast?.('Call ended: Free preview ended & recharge expired.');
      handleEnd();
      return;
    }

    // 3. Decrement 1 second
    const timer = setTimeout(() => {
      setGraceSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [graceSecondsLeft, coins, callRate, callDuration, onDeductCoins, expert]);

  // D. Resume call if user recharges while waiting for recharge at 10s preview end
  useEffect(() => {
    if (!isWaitingForRecharge) return;
    const currentCoins = Number(coinsRef.current ?? coins) || 0;
    const numericRate = Number(callRate) || 30;
    if (currentCoins >= numericRate) {
      isWaitingForRechargeRef.current = false;
      setIsWaitingForRecharge(false);
      setIsDemoActive(false);
      isDemoActiveRef.current = false;
      hasDeductedFirstMinuteRef.current = true;
      try {
        expertVideoRef.current?.play().catch(() => {});
      } catch (_) {}
      (async () => {
        await onDeductCoins?.(numericRate, {
          type: 'call',
          title: `Call with ${expert?.name || 'Expert'} (Min 1)`,
          expertId: expert?.id,
          expertName: expert?.name,
        });
        onToast?.(`✅ Recharged! Continuing call with ${expert?.name || 'Expert'}.`);
      })();
    }
  }, [coins, isWaitingForRecharge, callRate, onDeductCoins, expert]);

  /* ── Confirm or Decline Continuing Call with Coins ── */
  const handleConfirmContinueCall = async () => {
    const currentCoins = Number(coinsRef.current ?? coins) || 0;
    const numericRate = Number(callRate) || 30;

    if (currentCoins < numericRate) {
      showContinuePromptRef.current = false;
      setShowContinuePrompt(false);
      try {
        expertVideoRef.current?.pause();
      } catch (_) {}
      isWaitingForRechargeRef.current = true;
      setIsWaitingForRecharge(true);
      onToast?.('⚠️ Insufficient coins! Please recharge to continue the call.');
      onOpenRecharge?.();
      return;
    }

    hasUserContinuedRef.current = true;
    showContinuePromptRef.current = false;
    setShowContinuePrompt(false);
    setIsDemoActive(false);
    isDemoActiveRef.current = false;
    hasDeductedFirstMinuteRef.current = true;

    // Resume video from where it was cut
    try {
      expertVideoRef.current?.play().catch(() => {});
    } catch (_) {}

    // Deduct Minute 1 coins
    try {
      const success = onDeductCoins
        ? await onDeductCoins(numericRate, {
            type: 'call',
            title: `Call with ${expert?.name || 'Expert'} (Min 1)`,
            expertId: expert?.id,
            expertName: expert?.name,
          })
        : true;

      if (success) {
        onToast?.(`✅ Call continued! -${numericRate} Coins`);
      }
    } catch (e) {
      console.warn('Failed to deduct coins on continue:', e);
    }
  };

  const handleDeclineContinueCall = () => {
    showContinuePromptRef.current = false;
    setShowContinuePrompt(false);
    handleEnd();
  };

  /* ── 4. User Camera & Mic (PiP) Setup ── */
  const setupUserCamera = async (isFront = isFrontCamera) => {
    setCameraLoading(true);
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        setCameraLoading(false);
        onToast?.('Camera not supported in this browser.');
        return;
      }

      // 1. Initial permission acquisition
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: isFront ? 'user' : 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: true,
        });
      } catch (audioErr) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: isFront ? 'user' : 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
      }

      // 2. Enumerate devices now that permission is granted
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');

      // Detect virtual / inactive software cameras (e.g., OBS Virtual Camera, Droidcam, Iriun)
      const isVirtualCam = (label) => {
        const l = (label || '').toLowerCase();
        return (
          l.includes('obs') ||
          l.includes('virtual') ||
          l.includes('vysor') ||
          l.includes('droidcam') ||
          l.includes('iriun') ||
          l.includes('screen')
        );
      };

      const physicalCameras = videoDevices.filter((d) => !isVirtualCam(d.label));
      availableCamerasRef.current = physicalCameras.length > 0 ? physicalCameras : videoDevices;

      // Check current active track's device
      const currentTrack = stream.getVideoTracks()[0];
      const currentLabel = currentTrack?.label || '';

      // If current track is an inactive OBS/virtual camera and we have real physical cameras:
      if (isVirtualCam(currentLabel) && physicalCameras.length > 0) {
        const preferredCam = physicalCameras[0];
        stream.getTracks().forEach((t) => t.stop());

        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: preferredCam.deviceId },
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: true,
          });
        } catch (e) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: preferredCam.deviceId },
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: false,
          });
        }
      }

      mediaStreamRef.current = stream;
      setHasCamera(true);
      setCameraLoading(false);

      // Apply current mic mute status to audio track
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });

      // Apply current camera off status to video track
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoOff;
      });

      if (userCamVideoRef.current) {
        userCamVideoRef.current.srcObject = stream;
        userCamVideoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Camera permission denied or camera unavailable:', err);
      setHasCamera(false);
      setCameraLoading(false);
    }
  };

  // Start requesting camera permission as soon as the video call screen opens
  useEffect(() => {
    setupUserCamera(isFrontCamera);

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [isFrontCamera]);

  // Ensure stream stays attached whenever active screen mounts userCamVideoRef
  useEffect(() => {
    if (callState === 'active' && userCamVideoRef.current && mediaStreamRef.current) {
      if (userCamVideoRef.current.srcObject !== mediaStreamRef.current) {
        userCamVideoRef.current.srcObject = mediaStreamRef.current;
        userCamVideoRef.current.play().catch(() => {});
      }
    }
  }, [callState, hasCamera]);

  /* ── Clean Up on End Call ── */
  const handleEnd = () => {
    savePlaybackPosition();
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    inGracePeriodRef.current = false;
    isWaitingForRechargeRef.current = false;
    setIsWaitingForRecharge(false);
    setGraceSecondsLeft(null);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (expertVideoRef.current) {
      expertVideoRef.current.pause();
      expertVideoRef.current.src = '';
    }
    onEndCall?.(callDuration);
  };

  /* ── Controls Handlers ── */
  // 1. Flip: Switches User's Camera between available physical cameras or Front/Back
  const toggleCameraFlip = async () => {
    const cameras = availableCamerasRef.current;
    if (cameras && cameras.length > 1) {
      const nextIdx = (activeCameraIndexRef.current + 1) % cameras.length;
      activeCameraIndexRef.current = nextIdx;
      const targetCam = cameras[nextIdx];

      setCameraLoading(true);
      try {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        }

        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: targetCam.deviceId },
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: true,
          });
        } catch (e) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: targetCam.deviceId },
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: false,
          });
        }

        mediaStreamRef.current = stream;
        setHasCamera(true);
        setCameraLoading(false);

        if (userCamVideoRef.current) {
          userCamVideoRef.current.srcObject = stream;
          userCamVideoRef.current.play().catch(() => {});
        }
        onToast?.(`Switched camera: ${targetCam.label || 'Camera ' + (nextIdx + 1)}`);
        return;
      } catch (err) {
        console.warn('Switch camera error:', err);
      }
    }

    // Default mobile fallback facingMode toggle
    setIsFrontCamera((prev) => {
      const next = !prev;
      onToast?.(next ? 'Switched to Front Camera' : 'Switched to Back Camera');
      return next;
    });
  };

  // 2. Mute: Mutes User's Microphone (Never mutes the expert's video audio)
  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !next;
        });
      }
      onToast?.(next ? 'Your Microphone Muted 🔇' : 'Your Microphone Unmuted 🎙️');
      return next;
    });
  };

  // 4. Speaker: Toggles Expert's Video Audio (Out loud vs silent)
  const toggleSpeaker = () => {
    setIsSpeakerOn((prev) => {
      const next = !prev;
      if (expertVideoRef.current) {
        expertVideoRef.current.muted = !next;
      }
      onToast?.(next ? 'Speaker Sound On 🔊' : 'Speaker Muted 🔈');
      return next;
    });
  };

  // 5. Video: Turns User's Camera On/Off (Never hides or pauses the expert video)
  const toggleVideo = () => {
    setIsVideoOff((prev) => {
      const next = !prev;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = !next;
        });
      }
      onToast?.(next ? 'Your Camera Turned Off' : 'Your Camera Turned On');
      return next;
    });
  };

  const handleSendGift = async (gift) => {
    const currentBalance = coinsRef.current !== undefined ? coinsRef.current : coins;
    // 1. Check if user has sufficient coins for this specific gift
    if (currentBalance < gift.cost) {
      setShowGiftModal(false);
      onToast?.(`⚠️ You need ${gift.cost} Coins to send ${gift.name}! Your balance: ${currentBalance} Coins. Please recharge.`);
      if (onOpenRecharge) {
        onOpenRecharge();
      }
      return;
    }

    // 2. User has enough coins -> attempt deduction
    const success = onDeductCoins
      ? await onDeductCoins(gift.cost, {
          type: 'gift',
          title: `Gift: ${gift.name} (${gift.emoji}) to ${expert?.name || 'Expert'}`,
          giftKey: gift.key,
          giftName: gift.name,
          giftEmoji: gift.emoji,
          cost: gift.cost,
          expertId: expert?.id || 'expert',
          expertName: expert?.name || 'Expert',
        })
      : true;

    if (success) {
      setShowGiftModal(false);
      setActiveGiftAnim(gift);
      onToast?.(`🎁 Sent ${gift.name} (${gift.emoji}) to ${expert?.name || 'Expert'}! (-${gift.cost} Coins)`);
    } else {
      setShowGiftModal(false);
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
          className={`video-call-fullscreen ${callState === 'active' ? 'visible' : 'hidden'}`}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleVideoCanPlay}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnded}
          onError={handleVideoError}
          muted={!isSpeakerOn}
        />

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

            {/* Top Center: Active In-Call Status & Duration Badge */}
            <div className="call-timer-badge">
              <span className="call-live-dot" />
              <Phone size={11} fill="#22c55e" color="#22c55e" strokeWidth={0} />
              <span className="timer-text">{formatTime(callDuration)}</span>
            </div>

            {/* Low Coin Warning or Grace Countdown Alert Banner - Prompts user to recharge without screen going black */}
            {(graceSecondsLeft !== null || (!isDemoActive && numericCoins < callRate)) && (
              <div
                className="call-low-balance-banner"
                onClick={() => onOpenRecharge?.()}
                style={{
                  position: 'absolute',
                  top: '64px',
                  left: '12px',
                  right: '12px',
                  background: graceSecondsLeft !== null
                    ? 'linear-gradient(90deg, rgba(235, 20, 90, 0.98), rgba(180, 10, 70, 0.98))'
                    : 'linear-gradient(90deg, rgba(255, 42, 141, 0.95), rgba(180, 20, 100, 0.95))',
                  borderRadius: '14px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  zIndex: 25,
                  boxShadow: graceSecondsLeft !== null
                    ? '0 4px 22px rgba(255, 30, 100, 0.75)'
                    : '0 4px 18px rgba(255, 42, 141, 0.55)',
                  cursor: 'pointer',
                  border: graceSecondsLeft !== null
                    ? '1.5px solid rgba(255, 215, 0, 0.9)'
                    : '1px solid rgba(255, 215, 0, 0.5)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontSize: '11.5px', fontWeight: 600 }}>
                  <span style={{ fontSize: '14px' }}>{graceSecondsLeft !== null ? '⏳' : '⚠️'}</span>
                  <span>
                    {graceSecondsLeft !== null
                      ? `Recharge in ${graceSecondsLeft}s to keep talking!`
                      : `Low Coins (${numericCoins}) • Need ${callRate} for next min`}
                  </span>
                </div>
                <button
                  type="button"
                  style={{
                    background: 'linear-gradient(90deg, #ffd700, #ffae00)',
                    color: '#1a0026',
                    fontWeight: 800,
                    fontSize: '11px',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '4px 11px',
                    cursor: 'pointer',
                  }}
                >
                  + Recharge
                </button>
              </div>
            )}

            {/* Top Right: User Camera Preview (Picture-in-Picture) */}
            <div className="user-cam-pip" onClick={toggleCameraFlip} title="Tap to flip camera">
              <video
                ref={(el) => {
                  userCamVideoRef.current = el;
                  if (el && mediaStreamRef.current && el.srcObject !== mediaStreamRef.current) {
                    el.srcObject = mediaStreamRef.current;
                    el.play().catch(() => {});
                  }
                }}
                autoPlay
                playsInline
                muted
                className={`user-pip-video ${isFrontCamera ? 'mirror' : ''}`}
              />

              {/* Overlays: Video Off, Loading, or Permission Prompt */}
              {isVideoOff ? (
                <div className="pip-state-overlay pip-off">
                  <VideoOff size={18} color="#ff2a8d" />
                  <span>{t('camera_off', 'Camera Off')}</span>
                </div>
              ) : cameraLoading ? (
                <div className="pip-state-overlay pip-loading">
                  <div className="pip-spinner" />
                  <span>Starting...</span>
                </div>
              ) : !hasCamera ? (
                <div
                  className="pip-state-overlay pip-denied"
                  onClick={(e) => {
                    e.stopPropagation();
                    setupUserCamera();
                  }}
                  title="Click to allow camera"
                >
                  <VideoOff size={18} color="#ffd700" />
                  <span>{t('allow_camera', 'Allow Camera')}</span>
                </div>
              ) : null}

              <button
                type="button"
                className="pip-flip-btn"
                aria-label="Flip camera"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCameraFlip();
                }}
              >
                <RefreshCw size={12} color="#fff" />
              </button>
            </div>
          </div>

          {/* ── Floating Gift Animation Overlay ── */}
          {activeGiftAnim && (
            <GiftAnimationOverlay
              gift={activeGiftAnim}
              expertName={expert.name}
              onComplete={() => setActiveGiftAnim(null)}
            />
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
                    <div className="gift-balance-row">
                      <span className="gift-balance-sub">🪙 {t('your_balance_label', 'Your Balance:')} <strong>{coins} {t('coins', 'Coins')}</strong></span>
                    </div>
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
                      <div className="gift-emoji-wrap">
                        <span className="gift-emoji">{g.emoji}</span>
                      </div>
                      <span className="gift-name">{g.name}</span>
                      <div className="gift-cost-pill">
                        <span className="gift-coin-icon">🪙</span>
                        <span className="gift-cost-val">{g.cost}</span>
                      </div>
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

          {/* ── Continue Call With Coins Modal ── */}
          {showContinuePrompt && (
            <div className="continue-call-modal-overlay">
              <div className="continue-call-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="continue-call-icon-circle">
                  <span>🪙</span>
                </div>
                <h3 className="continue-call-title">Continue Call with Coins?</h3>
                <p className="continue-call-desc">
                  Your 10s free preview with <strong>{expert?.name || 'Expert'}</strong> has ended. Keep talking using your coin balance?
                </p>

                <div className="continue-call-rate-box">
                  <div className="continue-rate-row">
                    <span className="continue-rate-label">Call Rate:</span>
                    <span className="continue-rate-val">🪙 {callRate} Coins / min</span>
                  </div>
                  <div className="continue-rate-row">
                    <span className="continue-rate-label">Your Balance:</span>
                    <span className="continue-balance-val">🪙 {coins} Coins</span>
                  </div>
                </div>

                <div className="continue-call-actions">
                  <button
                    type="button"
                    className="continue-call-confirm-btn"
                    onClick={handleConfirmContinueCall}
                  >
                    <span>Continue Call (-{callRate} Coins)</span>
                  </button>
                  <button
                    type="button"
                    className="continue-call-decline-btn"
                    onClick={handleDeclineContinueCall}
                  >
                    <span>End Call</span>
                  </button>
                </div>
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

