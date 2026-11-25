'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import Image from 'next/image';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Subtitles,
  PictureInPicture2,
  Tv,
  SkipBack,
  SkipForward,
  Sparkles,
  Lock,
} from 'lucide-react';
import type { Video } from '@/types';
import type { PlayerSettingsState } from '@/types/player';
import { SubtitleOverlay } from './SubtitleOverlay';
import { NextVideoOverlay } from './NextVideoOverlay';
import { PlayerSettingsModal } from './PlayerSettingsModal';

interface CustomVideoPlayerProps {
  video: Video;
  nextVideo?: Video;
  prevVideo?: Video;
  onNextVideo?: () => void;
  onPrevVideo?: () => void;
  isTheaterMode?: boolean;
  onToggleTheater?: () => void;
  isLocked?: boolean;
  onUnlockClick?: () => void;
}

const DEFAULT_SETTINGS: PlayerSettingsState = {
  speed: 1,
  quality: 'Auto (360p Original)',
  audioTrack: 'original',
  subtitleTrack: 'hi',
  subtitleStyle: {
    fontSize: 'md',
    backgroundOpacity: 75,
    position: 'bottom',
  },
  autoPlayNext: true,
};

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  video,
  nextVideo,
  prevVideo,
  onNextVideo,
  onPrevVideo,
  isTheaterMode = false,
  onToggleTheater,
  isLocked = false,
  onUnlockClick,
}) => {
  // Video & Container Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Core Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [bufferedTime, setBufferedTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [prevVolume, setPrevVolume] = useState<number>(1);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isControlsVisible, setIsControlsVisible] = useState<boolean>(true);

  // Settings & Overlays State
  const [settings, setSettings] = useState<PlayerSettingsState>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showNextOverlay, setShowNextOverlay] = useState<boolean>(false);
  const [nextCountdown, setNextCountdown] = useState<number>(5);
  const [resumeToast, setResumeToast] = useState<string | null>(null);
  const [hudMessage, setHudMessage] = useState<string | null>(null);

  // Timeline hover state
  const [timelineHoverTime, setTimelineHoverTime] = useState<number | null>(null);
  const [timelineHoverPos, setTimelineHoverPos] = useState<number>(0);

  // Double tap ripple animation state
  const [gestureFeedback, setGestureFeedback] = useState<{
    side: 'left' | 'right';
    active: boolean;
  } | null>(null);

  // Double tap vs single tap timer refs
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

  // Safe video source
  const videoSrc = useMemo(() => {
    return video.videoUrl || `/videos/${video.id}.mp4`;
  }, [video]);

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = useCallback((secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }, []);

  // Show and reset auto-hide controls timer
  const resetControlsTimeout = useCallback(() => {
    setIsControlsVisible(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    if (isPlaying && !isSettingsOpen && !showNextOverlay) {
      hideControlsTimerRef.current = setTimeout(() => {
        setIsControlsVisible(false);
      }, 3500);
    }
  }, [isPlaying, isSettingsOpen, showNextOverlay]);

  // Load saved settings & saved watch progress
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('ishika_audio_lang');
      if (savedLang) {
        setSettings((prev) => ({ ...prev, audioTrack: savedLang }));
      }
      const savedProgress = localStorage.getItem(`ishika_progress_${video.id}`);
      if (savedProgress && videoRef.current) {
        const time = parseFloat(savedProgress);
        if (time > 6 && time < (videoRef.current.duration || 300) - 10) {
          videoRef.current.currentTime = time;
          setCurrentTime(time);
          setResumeToast(`Resumed from ${formatTime(time)}`);
          setTimeout(() => setResumeToast(null), 4000);
        }
      }
    } catch {
      // ignore localStorage disabled
    }
  }, [video.id, formatTime]);

  // Handle Play/Pause Toggle
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  // Seek backward/forward by seconds
  const seekRelative = useCallback((seconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(videoRef.current.duration || 300, videoRef.current.currentTime + seconds));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  // Volume Change
  const handleVolumeChange = useCallback((newVol: number) => {
    if (!videoRef.current) return;
    const clamped = Math.max(0, Math.min(1, newVol));
    videoRef.current.volume = clamped;
    setVolume(clamped);
    if (clamped === 0) {
      videoRef.current.muted = true;
      setIsMuted(true);
    } else {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    if (isMuted) {
      const target = prevVolume > 0 ? prevVolume : 1;
      videoRef.current.muted = false;
      videoRef.current.volume = target;
      setVolume(target);
      setIsMuted(false);
      setHudMessage('Sound Unmuted');
      setTimeout(() => setHudMessage(null), 1400);
    } else {
      setPrevVolume(volume > 0 ? volume : 1);
      videoRef.current.muted = true;
      setIsMuted(true);
      setHudMessage('Muted');
      setTimeout(() => setHudMessage(null), 1400);
    }
    resetControlsTimeout();
  }, [isMuted, prevVolume, volume, resetControlsTimeout]);

  // Fullscreen Toggle (Standard HTML5 + WebKit + Mozilla + iOS Safari + CSS In-Window Fallback)
  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current as any;
    const video = videoRef.current as any;
    const doc = (typeof document !== 'undefined' ? document : null) as any;

    if (!container || !doc) return;

    const isNativeFs = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement ||
      doc.webkitCurrentFullScreenElement
    );

    const currentlyFullscreen = isNativeFs || isFullscreen;

    if (!currentlyFullscreen) {
      // 1. Activate CSS Fullscreen state immediately so UI fills screen instantly
      setIsFullscreen(true);

      // 2. Try Native Fullscreen API with vendor prefixes
      try {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          await container.webkitRequestFullscreen();
        } else if (container.mozRequestFullScreen) {
          await container.mozRequestFullScreen();
        } else if (container.msRequestFullscreen) {
          await container.msRequestFullscreen();
        } else if (video && video.webkitEnterFullscreen) {
          // iOS Safari iPhone fallback
          video.webkitEnterFullscreen();
        }
      } catch (err) {
        console.warn('Native Fullscreen denied or unsupported, using CSS window fullscreen:', err);
        // CSS fallback already activated (fixed inset-0 z-[999999] w-screen h-screen)
      }
    } else {
      // Exit fullscreen
      setIsFullscreen(false);
      try {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        } else if (video && video.webkitExitFullscreen) {
          video.webkitExitFullscreen();
        }
      } catch (err) {
        console.warn('Native exit fullscreen error:', err);
      }
    }
    resetControlsTimeout();
  }, [isFullscreen, resetControlsTimeout]);

  // Picture in Picture
  const togglePiP = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PiP not supported or failed:', e);
    }
  }, []);

  // Update Settings (Speed, Subtitles, Audio, etc.)
  const handleUpdateSettings = useCallback(
    (newSettings: Partial<PlayerSettingsState>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...newSettings };
        if (newSettings.speed && videoRef.current) {
          videoRef.current.playbackRate = newSettings.speed;
        }
        if (newSettings.audioTrack) {
          try {
            localStorage.setItem('ishika_audio_lang', newSettings.audioTrack);
          } catch {}
        }
        return updated;
      });
    },
    []
  );

  // Timeline Scrubbing Handlers
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !videoRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = pos * (duration || 300);
    videoRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
    resetControlsTimeout();
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setTimelineHoverPos(pos);
    setTimelineHoverTime(pos * (duration || 300));
  };

  // Keyboard Shortcuts (Space, Arrows, M, F, C, T)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        ['INPUT', 'TEXTAREA'].includes(
          (document.activeElement?.tagName || '').toUpperCase()
        )
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
        case 'KeyJ':
          e.preventDefault();
          seekRelative(-10);
          break;
        case 'ArrowRight':
        case 'KeyL':
          e.preventDefault();
          seekRelative(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(volume + 0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(volume - 0.1);
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyC':
          e.preventDefault();
          const nextTrack = settings.subtitleTrack === 'off' ? 'hi' : settings.subtitleTrack === 'hi' ? 'en' : 'off';
          handleUpdateSettings({ subtitleTrack: nextTrack });
          setHudMessage(nextTrack === 'hi' ? '📝 Subtitles: हिंदी (Original)' : nextTrack === 'en' ? '📝 Subtitles: English (CC)' : '📝 Subtitles: OFF');
          setTimeout(() => setHudMessage(null), 1800);
          break;
        case 'KeyT':
          e.preventDefault();
          onToggleTheater?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay,
    seekRelative,
    handleVolumeChange,
    volume,
    toggleMute,
    toggleFullscreen,
    handleUpdateSettings,
    settings.subtitleTrack,
    onToggleTheater,
  ]);

  // Fullscreen change listener & body overflow prevention
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const doc = document as any;

    const onFsChange = () => {
      const isNativeFs = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement ||
        doc.webkitCurrentFullScreenElement
      );
      if (!isNativeFs) {
        setIsFullscreen(false);
      }
    };

    doc.addEventListener('fullscreenchange', onFsChange);
    doc.addEventListener('webkitfullscreenchange', onFsChange);
    doc.addEventListener('mozfullscreenchange', onFsChange);
    doc.addEventListener('MSFullscreenChange', onFsChange);

    // Escape key listener for CSS fullscreen
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    // Lock body scroll when in fullscreen
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      doc.removeEventListener('fullscreenchange', onFsChange);
      doc.removeEventListener('webkitfullscreenchange', onFsChange);
      doc.removeEventListener('mozfullscreenchange', onFsChange);
      doc.removeEventListener('MSFullscreenChange', onFsChange);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isFullscreen, toggleFullscreen]);

  // Next Video Countdown Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showNextOverlay && nextCountdown > 0) {
      timer = setTimeout(() => {
        setNextCountdown((prev) => prev - 1);
      }, 1000);
    } else if (showNextOverlay && nextCountdown === 0) {
      onNextVideo?.();
    }
    return () => clearTimeout(timer);
  }, [showNextOverlay, nextCountdown, onNextVideo]);

  // Mobile & Desktop Double-Tap/Double-Click Gestures (Never pauses on double-tap!)
  const processTapOrClick = (clientX: number) => {
    if (!containerRef.current || !videoRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const width = rect.width;
    const now = Date.now();
    const timeDiff = now - lastTapRef.current.time;
    const distDiff = Math.abs(relX - lastTapRef.current.x);

    if (timeDiff < 320 && distDiff < 100) {
      // === DOUBLE TAP DETECTED ===
      // 1. Instantly cancel pending single-tap play/pause toggle!
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }

      // 2. Seek 10s based on screen third
      if (relX < width * 0.38) {
        // Left side -> Rewind 10s
        seekRelative(-10);
        setGestureFeedback({ side: 'left', active: true });
        setTimeout(() => setGestureFeedback(null), 700);
      } else if (relX > width * 0.62) {
        // Right side -> Fast-Forward 10s
        seekRelative(10);
        setGestureFeedback({ side: 'right', active: true });
        setTimeout(() => setGestureFeedback(null), 700);
      } else {
        // Center double-tap -> Toggle Fullscreen
        toggleFullscreen();
      }

      // 3. Guarantee that the video continues streaming without pausing!
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      // === FIRST TAP (WAIT 260ms TO DISTINGUISH FROM DOUBLE TAP) ===
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
      clickTimerRef.current = setTimeout(() => {
        togglePlay();
        clickTimerRef.current = null;
      }, 260);
    }

    lastTapRef.current = { time: now, x: relX };
  };

  const handleSurfaceClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (Date.now() - lastTapRef.current.time < 50) return;
    processTapOrClick(e.clientX);
  };

  const handleSurfaceTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    if (!touch) return;
    processTapOrClick(touch.clientX);
  };

  // HTML5 Video Event Listeners
  const onTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);
    // Track buffer
    if (videoRef.current.buffered.length > 0) {
      setBufferedTime(
        videoRef.current.buffered.end(videoRef.current.buffered.length - 1)
      );
    }
    // Save watch progress to localStorage
    try {
      localStorage.setItem(`ishika_progress_${video.id}`, curr.toString());
    } catch {}
  };

  const onLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 300);
    videoRef.current.playbackRate = settings.speed;
  };

  const onEnded = () => {
    setIsPlaying(false);
    if (settings.autoPlayNext && nextVideo) {
      setShowNextOverlay(true);
      setNextCountdown(5);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => isPlaying && !isSettingsOpen && setIsControlsVisible(false)}
      className={`bg-[#000000] select-none group/player transition-all duration-150 ${
        isFullscreen
          ? 'fixed inset-0 z-[999999] w-screen h-screen !max-w-none !max-h-none !aspect-auto !rounded-none !border-none overflow-hidden'
          : 'relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border border-border/60'
      }`}
    >
      {/* ===================== HTML5 REAL VIDEO ELEMENT ===================== */}
      <video
        ref={videoRef}
        src={videoSrc}
        poster={video.thumbnail}
        playsInline
        preload="metadata"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        className="w-full h-full object-contain bg-black"
      />

      {/* ===================== GESTURE SURFACE (HANDLES DOUBLE-TAP WITHOUT PAUSING) ===================== */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={handleSurfaceClick}
        onTouchEnd={handleSurfaceTouchEnd}
      />

      {/* ===================== SUBTITLE OVERLAY ===================== */}
      <SubtitleOverlay
        videoId={video.youtubeId || video.id}
        currentTime={currentTime}
        subtitleTrack={settings.subtitleTrack}
        style={settings.subtitleStyle}
      />

      {/* ===================== ON-SCREEN HUD TOAST (MUTE & AUDIO) ===================== */}
      {hudMessage && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 px-5 py-2.5 rounded-2xl bg-black/90 backdrop-blur-md border border-rose/40 text-sm font-bold text-white shadow-2xl flex items-center gap-2.5 animate-fadeIn pointer-events-none">
          {hudMessage.includes('Muted') ? (
            <VolumeX className="w-5 h-5 text-rose animate-bounce" />
          ) : (
            <Volume2 className="w-5 h-5 text-emerald-400 animate-bounce" />
          )}
          <span className="tracking-wide">{hudMessage}</span>
        </div>
      )}

      {/* ===================== FULLSCREEN QUICK EXIT BUTTON ===================== */}
      {isFullscreen && (
        <button
          type="button"
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-40 px-3.5 py-2 rounded-full bg-black/80 hover:bg-black text-white border border-white/20 transition-all flex items-center gap-2 text-xs font-bold backdrop-blur-md shadow-2xl hover:scale-105 active:scale-95"
          title="Exit Fullscreen (Esc or F)"
        >
          <Minimize className="w-4 h-4 text-rose-light" />
          <span>Exit Fullscreen</span>
        </button>
      )}

      {/* ===================== RESUME WATCHING TOAST ===================== */}
      {resumeToast && (
        <div className="absolute top-16 left-6 z-40 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-rose/30 text-xs font-semibold text-rose-light flex items-center gap-1.5 shadow-xl animate-fadeIn">
          <Sparkles className="w-3.5 h-3.5 text-rose" />
          <span>{resumeToast}</span>
        </div>
      )}

      {/* ===================== BUFFERING SPINNER ===================== */}
      {isBuffering && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 pointer-events-none">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-rose/20 border-t-rose animate-spin" />
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-rose to-gold opacity-75 blur-xs" />
          </div>
        </div>
      )}

      {/* ===================== DOUBLE-TAP GESTURE RIPPLE ===================== */}
      {gestureFeedback?.active && (
        <div
          className={`absolute inset-y-0 ${
            gestureFeedback.side === 'left' ? 'left-0' : 'right-0'
          } w-1/3 flex items-center justify-center z-40 pointer-events-none animate-fadeIn`}
        >
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-1 shadow-2xl">
            {gestureFeedback.side === 'left' ? (
              <>
                <RotateCcw className="w-7 h-7 text-rose" />
                <span className="text-[11px] font-black tracking-wider">10s</span>
              </>
            ) : (
              <>
                <RotateCw className="w-7 h-7 text-rose" />
                <span className="text-[11px] font-black tracking-wider">10s</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===================== NEXT VIDEO COUNTDOWN OVERLAY ===================== */}
      {showNextOverlay && nextVideo && (
        <NextVideoOverlay
          nextVideo={nextVideo}
          countdown={nextCountdown}
          onPlayNow={() => {
            setShowNextOverlay(false);
            onNextVideo?.();
          }}
          onCancel={() => setShowNextOverlay(false)}
        />
      )}

      {/* ===================== LOCKED PREMIUM CONTENT OVERLAY ===================== */}
      {isLocked && (
        <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose/20 border border-rose/40 flex items-center justify-center">
            <Lock className="w-8 h-8 text-rose" />
          </div>
          <div className="space-y-1 max-w-md">
            <span className="text-xs font-bold uppercase tracking-widest text-gold">
              👑 VIP Tier Exclusive
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground">
              VIP Membership Required
            </h3>
            <p className="text-xs sm:text-secondary leading-relaxed">
              Unlock the uncut romantic audios, high-bitrate streaming, and intimate backstage moments.
            </p>
          </div>
          <button
            onClick={onUnlockClick}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose to-rose-dark hover:from-rose-light hover:to-rose text-white text-sm font-bold shadow-lg shadow-rose/30 transition-all hover:scale-105"
          >
            Join VIP Army
          </button>
        </div>
      )}

      {/* ===================== TOP HEADER OVERLAY ===================== */}
      <div
        className={`absolute top-0 inset-x-0 z-30 p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent transition-opacity duration-300 flex items-center justify-between pointer-events-none ${
          isControlsVisible || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose/20 text-rose-light border border-rose/40">
                {video.category}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Proprietary 5-Min HD Stream</span>
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide line-clamp-1 drop-shadow-md">
              {video.title}
            </h2>
          </div>
        </div>
      </div>

      {/* ===================== CENTER PLAY/PAUSE TRIGGER ===================== */}
      {!isPlaying && !isLocked && !showNextOverlay && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/25 pointer-events-none">
          <button
            onClick={togglePlay}
            className="w-20 h-20 rounded-full bg-rose/90 hover:bg-rose text-white flex items-center justify-center shadow-2xl shadow-rose/50 hover:scale-110 transition-all duration-300 pointer-events-auto group"
            title="Play Video"
          >
            <Play className="w-8 h-8 fill-white ml-1 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )}

      {/* ===================== BOTTOM CONTROLS PANEL ===================== */}
      <div
        className={`absolute bottom-0 inset-x-0 z-30 pt-10 pb-3 px-4 sm:px-6 bg-gradient-to-t from-black via-black/80 to-transparent transition-opacity duration-300 space-y-2.5 ${
          isControlsVisible || !isPlaying || isSettingsOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* =================== PROGRESS TIMELINE =================== */}
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          onMouseMove={handleTimelineMouseMove}
          onMouseLeave={() => setTimelineHoverTime(null)}
          className="relative w-full h-1.5 hover:h-3 transition-all cursor-pointer rounded-full bg-white/20 overflow-visible group/timeline flex items-center"
        >
          {/* Buffered Bar */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-white/30 rounded-full transition-all"
            style={{ width: `${bufferedPercent}%` }}
          />

          {/* Played Progress Bar with Rose-to-Gold gradient */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-rose to-gold rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Scrubber Thumb Knob */}
          <div
            className="absolute -top-1 w-3.5 h-3.5 rounded-full bg-white shadow-lg border-2 border-rose transition-transform group-hover/timeline:scale-125"
            style={{ left: `calc(${progressPercent}% - 7px)` }}
          />

          {/* Time Hover Tooltip */}
          {timelineHoverTime !== null && (
            <div
              className="absolute -top-8 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/90 border border-border/80 text-[10px] font-bold text-white shadow-xl pointer-events-none"
              style={{ left: `${timelineHoverPos * 100}%` }}
            >
              {formatTime(timelineHoverTime)}
            </div>
          )}
        </div>

        {/* =================== CONTROL BUTTONS BAR =================== */}
        <div className="flex items-center justify-between text-white text-xs">
          {/* Left Controls: Play/Pause, Replay 10s, Forward 10s, Prev, Next, Volume, Time */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Prev Video Button */}
            {onPrevVideo && (
              <button
                onClick={onPrevVideo}
                className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors"
                title="Previous Episode"
              >
                <SkipBack className="w-4 h-4" />
              </button>
            )}

            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white hover:text-rose-light transition-colors"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            {/* 10s Rewind */}
            <button
              onClick={() => seekRelative(-10)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white hover:text-rose transition-colors relative group/10s"
              title="Rewind 10s (Left Arrow)"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold opacity-0 group-hover/10s:opacity-100 transition-opacity">
                -10
              </span>
            </button>

            {/* 10s Forward */}
            <button
              onClick={() => seekRelative(10)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white hover:text-rose transition-colors relative group/10s"
              title="Forward 10s (Right Arrow)"
            >
              <RotateCw className="w-4 h-4" />
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold opacity-0 group-hover/10s:opacity-100 transition-opacity">
                +10
              </span>
            </button>

            {/* Next Video Button */}
            {onNextVideo && (
              <button
                onClick={onNextVideo}
                className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors"
                title="Next Episode"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            )}

            {/* Unique Sound & Instant Mute Icon Button */}
            <button
              onClick={toggleMute}
              className={`px-2.5 py-1.5 rounded-xl transition-all duration-300 flex items-center gap-1.5 group/sound border ${
                isMuted || volume === 0
                  ? 'bg-rose/20 text-rose border-rose/40 shadow-lg shadow-rose/20 animate-pulse'
                  : 'bg-white/5 hover:bg-white/10 text-white border-white/10 hover:border-rose/40 hover:text-rose-light'
              }`}
              title={isMuted ? 'Unmute Sound (M)' : 'Mute Sound (M)'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose shrink-0" />
              ) : (
                <Volume2 className="w-4 h-4 group-hover/sound:scale-110 transition-transform shrink-0" />
              )}

              {/* Animated Luxury Audio Equalizer Bars when playing & unmuted */}
              {isMuted || volume === 0 ? (
                <span className="text-[10px] font-black uppercase tracking-wider text-rose">
                  Muted
                </span>
              ) : (
                <div className="flex items-end gap-0.5 h-3 px-0.5">
                  <span
                    className={`w-0.5 rounded-full bg-gradient-to-t from-rose to-gold transition-all duration-300 ${
                      isPlaying ? 'h-3 animate-pulse' : 'h-1.5'
                    }`}
                  />
                  <span
                    className={`w-0.5 rounded-full bg-gradient-to-t from-rose to-gold transition-all duration-300 delay-75 ${
                      isPlaying ? 'h-2 animate-pulse' : 'h-2'
                    }`}
                  />
                  <span
                    className={`w-0.5 rounded-full bg-gradient-to-t from-rose to-gold transition-all duration-300 delay-150 ${
                      isPlaying ? 'h-3.5 animate-pulse' : 'h-1'
                    }`}
                  />
                </div>
              )}
            </button>

            {/* Current / Duration Time Display */}
            <div className="text-[11px] font-medium text-secondary whitespace-nowrap hidden sm:block">
              <span className="text-foreground font-semibold">
                {formatTime(currentTime)}
              </span>
              <span className="text-muted mx-1">/</span>
              <span>{formatTime(duration || 300)}</span>
            </div>
          </div>

          {/* Right Controls: Subtitles, Settings, PiP, Theater, Fullscreen */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Quick Subtitle Toggle */}
            <button
              onClick={() => {
                const nextTrack = settings.subtitleTrack === 'off' ? 'hi' : settings.subtitleTrack === 'hi' ? 'en' : 'off';
                handleUpdateSettings({ subtitleTrack: nextTrack });
                setHudMessage(nextTrack === 'hi' ? '📝 Subtitles: हिंदी (Original)' : nextTrack === 'en' ? '📝 Subtitles: English (CC)' : '📝 Subtitles: OFF');
                setTimeout(() => setHudMessage(null), 1800);
              }}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                settings.subtitleTrack !== 'off'
                  ? 'bg-rose/25 text-rose-light font-bold border border-rose/40'
                  : 'text-secondary hover:text-white hover:bg-white/10'
              }`}
              title="Toggle Subtitles (Hindi / English / Off) - Hotkey C"
            >
              <Subtitles className="w-4 h-4" />
              {settings.subtitleTrack !== 'off' && (
                <span className="text-[9px] uppercase font-black">
                  {settings.subtitleTrack}
                </span>
              )}
            </button>

            {/* Settings Modal Toggle */}
            <div className="relative">
              <button
                onClick={() => setIsSettingsOpen((prev) => !prev)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isSettingsOpen
                    ? 'bg-rose text-white shadow-md shadow-rose/30'
                    : 'text-secondary hover:text-white hover:bg-white/10'
                }`}
                title="Settings (Speed, Quality, Audio, Subtitles)"
              >
                <Settings
                  className={`w-4 h-4 transition-transform duration-300 ${
                    isSettingsOpen ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {/* Pop-up Settings Modal */}
              <PlayerSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onChangeSettings={handleUpdateSettings}
              />
            </div>

            {/* Picture-in-Picture */}
            <button
              onClick={togglePiP}
              className="p-1.5 rounded-lg text-secondary hover:text-white hover:bg-white/10 transition-colors hidden sm:block"
              title="Picture-in-Picture"
            >
              <PictureInPicture2 className="w-4 h-4" />
            </button>

            {/* Theater Mode Toggle */}
            {onToggleTheater && (
              <button
                onClick={onToggleTheater}
                className={`p-1.5 rounded-lg transition-colors hidden md:block ${
                  isTheaterMode
                    ? 'text-gold font-bold bg-gold/15'
                    : 'text-secondary hover:text-white hover:bg-white/10'
                }`}
                title="Theater Mode (T)"
              >
                <Tv className="w-4 h-4" />
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg text-secondary hover:text-white hover:bg-white/10 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4 text-rose-light" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
