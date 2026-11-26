import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize2,
  Minimize2,
  Settings,
  MessageSquare,
  Volume2,
  Tv,
  SkipForward,
  Check,
  X,
  Sparkles,
} from 'lucide-react-native';
import { Video } from '../types';
import { COLORS } from '../theme/colors';

interface CustomVideoPlayerProps {
  video: Video;
  nextVideo?: Video;
  onNextVideo?: () => void;
  isTheaterMode?: boolean;
  onToggleTheater?: () => void;
  onProgressUpdate?: (progressSec: number, durationSec: number) => void;
  initialTimeSec?: number;
}

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const QUALITY_OPTIONS = ['Auto (1080p)', '1080p Full HD', '720p HD', '480p SD'];
const SUBTITLE_OPTIONS = [
  { id: 'off', label: 'Off' },
  { id: 'en', label: 'English (Original Subtitles)' },
  { id: 'hi', label: 'हिंदी (Hindi Captions)' },
];

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  video,
  nextVideo,
  onNextVideo,
  isTheaterMode = false,
  onToggleTheater,
  onProgressUpdate,
  initialTimeSec = 0,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(initialTimeSec);
  const [duration, setDuration] = useState<number>(video.durationSec || 600);
  const [isControlsVisible, setIsControlsVisible] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [selectedQuality, setSelectedQuality] = useState<string>('Auto (1080p)');
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('hi');
  const [audioTrack, setAudioTrack] = useState<string>('Original Hindi (Ishika)');
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'speed' | 'quality' | 'audio' | 'subtitles'>('speed');
  const [resumeToast, setResumeToast] = useState<string | null>(
    initialTimeSec > 5 ? `Resumed at ${formatTime(initialTimeSec)}` : null
  );
  const [showNextOverlay, setShowNextOverlay] = useState<boolean>(false);
  const [nextCountdown, setNextCountdown] = useState<number>(5);

  const controlsTimeoutRef = useRef<any>(null);

  // Initialize expo-video player
  const player = useVideoPlayer(video.videoUrl || '', (p) => {
    p.loop = false;
    p.playbackRate = playbackSpeed;
    if (initialTimeSec > 0) {
      p.currentTime = initialTimeSec;
    }
    p.play();
  });

  // Listen to player status
  useEffect(() => {
    if (!player) return;

    const subscription = player.addListener('playingChange', (payload) => {
      setIsPlaying(payload.isPlaying);
    });

    const timeSub = player.addListener('timeUpdate', (payload) => {
      setCurrentTime(payload.currentTime);
      if (player.duration > 0) {
        setDuration(player.duration);
      }
      if (onProgressUpdate) {
        onProgressUpdate(payload.currentTime, player.duration || duration);
      }

      // Check if near end (within 10 seconds)
      if (
        player.duration > 0 &&
        payload.currentTime >= player.duration - 8 &&
        nextVideo &&
        !showNextOverlay
      ) {
        setShowNextOverlay(true);
      }
    });

    return () => {
      subscription?.remove();
      timeSub?.remove();
    };
  }, [player, nextVideo, showNextOverlay, duration, onProgressUpdate]);

  // Hide controls after 4 seconds
  const resetControlsTimer = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setIsControlsVisible(true);
    controlsTimeoutRef.current = setTimeout(() => {
      setIsControlsVisible(false);
    }, 4000);
  }, []);

  const toggleControls = () => {
    if (isControlsVisible) {
      setIsControlsVisible(false);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    } else {
      resetControlsTimer();
    }
  };

  // Play / Pause
  const handlePlayPause = () => {
    resetControlsTimer();
    if (!player) return;
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  // 10s Seek
  const handleSeek = (seconds: number) => {
    resetControlsTimer();
    if (!player) return;
    player.seekBy(seconds);
  };

  // Fullscreen Landscape Toggle
  const toggleFullscreen = async () => {
    resetControlsTimer();
    if (isFullscreen) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      setIsFullscreen(false);
      StatusBar.setHidden(false);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
      setIsFullscreen(true);
      StatusBar.setHidden(true);
    }
  };

  // Cleanup orientation on unmount
  useEffect(() => {
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      StatusBar.setHidden(false);
    };
  }, []);

  // Format seconds to mm:ss or hh:mm:ss
  function formatTime(secs: number): string {
    if (isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // Progress percentage
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <View
      style={[
        styles.container,
        isFullscreen && styles.fullscreenContainer,
        isTheaterMode && styles.theaterContainer,
      ]}
    >
      <TouchableWithoutFeedback onPress={toggleControls}>
        <View style={styles.videoWrapper}>
          {/* Native Expo VideoView */}
          <VideoView
            player={player}
            style={styles.nativeVideo}
            allowsPictureInPicture={true}
            contentFit="contain"
          />

          {/* Subtitles Overlay */}
          {selectedSubtitle !== 'off' && (
            <View style={styles.subtitleContainer} pointerEvents="none">
              <Text style={styles.subtitleText}>
                {selectedSubtitle === 'hi'
                  ? '„ इश्क की कोई हद नहीं होती… Vandana, तुम मेरे दिल में हो। ”'
                  : '“When love has no gender… Vandana, you are my forever.”'}
              </Text>
            </View>
          )}

          {/* Resume Toast */}
          {resumeToast && (
            <View style={styles.resumeToast} pointerEvents="none">
              <Sparkles size={14} color="#d4a853" />
              <Text style={styles.resumeToastText}>{resumeToast}</Text>
            </View>
          )}

          {/* Up Next Video Countdown Overlay */}
          {showNextOverlay && nextVideo && (
            <View style={styles.nextOverlay} pointerEvents="box-none">
              <View style={styles.nextCard}>
                <Text style={styles.nextUpLabel}>UP NEXT IN 5 SECONDS</Text>
                <Text style={styles.nextTitle} numberOfLines={1}>
                  {nextVideo.title}
                </Text>
                <View style={styles.nextActions}>
                  <TouchableOpacity
                    style={styles.playNextBtn}
                    onPress={() => {
                      setShowNextOverlay(false);
                      onNextVideo?.();
                    }}
                  >
                    <Play size={14} color="#fff" fill="#fff" />
                    <Text style={styles.playNextText}>Play Now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelNextBtn}
                    onPress={() => setShowNextOverlay(false)}
                  >
                    <X size={14} color="#a1a1aa" />
                    <Text style={styles.cancelNextText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Custom Touch Controls Overlay */}
          {isControlsVisible && (
            <View style={styles.controlsOverlay}>
              {/* Top Controls Bar */}
              <View style={styles.topBar}>
                <Text style={styles.videoTitleBar} numberOfLines={1}>
                  {video.title}
                </Text>
                <View style={styles.topRightControls}>
                  {/* Theater Mode Toggle */}
                  {onToggleTheater && (
                    <TouchableOpacity
                      style={styles.controlIconBtn}
                      onPress={onToggleTheater}
                    >
                      <Tv
                        size={18}
                        color={isTheaterMode ? COLORS.rose.primary : '#fff'}
                      />
                    </TouchableOpacity>
                  )}

                  {/* Settings Modal Toggle */}
                  <TouchableOpacity
                    style={styles.controlIconBtn}
                    onPress={() => setShowSettingsModal(true)}
                  >
                    <Settings size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Center Playback Controls */}
              <View style={styles.centerControls}>
                {/* 10s Backward */}
                <TouchableOpacity
                  style={styles.seekCircleBtn}
                  onPress={() => handleSeek(-10)}
                  activeOpacity={0.7}
                >
                  <RotateCcw size={22} color="#fff" />
                  <Text style={styles.seekBadge}>10</Text>
                </TouchableOpacity>

                {/* Big Play / Pause */}
                <TouchableOpacity
                  style={styles.playPauseCircleBtn}
                  onPress={handlePlayPause}
                  activeOpacity={0.8}
                >
                  {isPlaying ? (
                    <Pause size={30} color="#fff" fill="#fff" />
                  ) : (
                    <Play size={30} color="#fff" fill="#fff" style={{ marginLeft: 3 }} />
                  )}
                </TouchableOpacity>

                {/* 10s Forward */}
                <TouchableOpacity
                  style={styles.seekCircleBtn}
                  onPress={() => handleSeek(10)}
                  activeOpacity={0.7}
                >
                  <RotateCw size={22} color="#fff" />
                  <Text style={styles.seekBadge}>10</Text>
                </TouchableOpacity>
              </View>

              {/* Bottom Scrubber & Time Bar */}
              <View style={styles.bottomBar}>
                {/* Progress Bar Track */}
                <View style={styles.timelineTrack}>
                  <View
                    style={[styles.timelineProgress, { width: `${progressPct}%` }]}
                  />
                  <View
                    style={[
                      styles.timelineScrubber,
                      { left: `${Math.min(progressPct, 98)}%` },
                    ]}
                  />
                </View>

                {/* Bottom Row Elements */}
                <View style={styles.bottomMetaRow}>
                  <View style={styles.timeDisplay}>
                    <Text style={styles.timeCurrent}>{formatTime(currentTime)}</Text>
                    <Text style={styles.timeSeparator}> / </Text>
                    <Text style={styles.timeDuration}>{formatTime(duration)}</Text>
                  </View>

                  <View style={styles.bottomButtons}>
                    {/* Quality / Speed Pill */}
                    <TouchableOpacity
                      style={styles.pillBadge}
                      onPress={() => {
                        setSettingsTab('speed');
                        setShowSettingsModal(true);
                      }}
                    >
                      <Text style={styles.pillText}>{playbackSpeed}x</Text>
                    </TouchableOpacity>

                    {/* Subtitles Quick Toggle */}
                    <TouchableOpacity
                      style={styles.controlIconBtn}
                      onPress={() => {
                        setSettingsTab('subtitles');
                        setShowSettingsModal(true);
                      }}
                    >
                      <MessageSquare
                        size={16}
                        color={selectedSubtitle !== 'off' ? COLORS.rose.primary : '#fff'}
                      />
                    </TouchableOpacity>

                    {/* Next Video Button */}
                    {nextVideo && onNextVideo && (
                      <TouchableOpacity
                        style={styles.controlIconBtn}
                        onPress={onNextVideo}
                      >
                        <SkipForward size={18} color="#fff" />
                      </TouchableOpacity>
                    )}

                    {/* Fullscreen Button */}
                    <TouchableOpacity
                      style={styles.controlIconBtn}
                      onPress={toggleFullscreen}
                    >
                      {isFullscreen ? (
                        <Minimize2 size={18} color="#fff" />
                      ) : (
                        <Maximize2 size={18} color="#fff" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* Settings Modal (Speed, Quality, Subtitles, Audio) */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Player Preferences</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabRow}>
              {(['speed', 'quality', 'subtitles', 'audio'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabButton, settingsTab === tab && styles.tabButtonActive]}
                  onPress={() => setSettingsTab(tab)}
                >
                  <Text
                    style={[styles.tabText, settingsTab === tab && styles.tabTextActive]}
                  >
                    {tab.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Playback Speed */}
              {settingsTab === 'speed' && (
                <View>
                  <Text style={styles.sectionSubtitle}>Select Playback Rate</Text>
                  {SPEED_OPTIONS.map((rate) => (
                    <TouchableOpacity
                      key={rate}
                      style={styles.optionItem}
                      onPress={() => {
                        setPlaybackSpeed(rate);
                        if (player) player.playbackRate = rate;
                        setShowSettingsModal(false);
                      }}
                    >
                      <Text style={styles.optionLabel}>{rate}x {rate === 1.0 ? '(Normal)' : ''}</Text>
                      {playbackSpeed === rate && <Check size={18} color={COLORS.rose.primary} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Quality Selection */}
              {settingsTab === 'quality' && (
                <View>
                  <Text style={styles.sectionSubtitle}>Video Quality Resolution</Text>
                  {QUALITY_OPTIONS.map((q) => (
                    <TouchableOpacity
                      key={q}
                      style={styles.optionItem}
                      onPress={() => {
                        setSelectedQuality(q);
                        setShowSettingsModal(false);
                      }}
                    >
                      <Text style={styles.optionLabel}>{q}</Text>
                      {selectedQuality === q && <Check size={18} color={COLORS.rose.primary} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Subtitles Interface */}
              {settingsTab === 'subtitles' && (
                <View>
                  <Text style={styles.sectionSubtitle}>Subtitle & Caption Track</Text>
                  {SUBTITLE_OPTIONS.map((sub) => (
                    <TouchableOpacity
                      key={sub.id}
                      style={styles.optionItem}
                      onPress={() => {
                        setSelectedSubtitle(sub.id);
                        setShowSettingsModal(false);
                      }}
                    >
                      <Text style={styles.optionLabel}>{sub.label}</Text>
                      {selectedSubtitle === sub.id && (
                        <Check size={18} color={COLORS.rose.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Audio Track Selection */}
              {settingsTab === 'audio' && (
                <View>
                  <Text style={styles.sectionSubtitle}>Audio Stream Selection</Text>
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => setShowSettingsModal(false)}
                  >
                    <View>
                      <Text style={styles.optionLabel}>Original Studio Track (Hindi)</Text>
                      <Text style={styles.optionSub}>Narration by Ishika • High-Bitrate Stereo</Text>
                    </View>
                    <Check size={18} color={COLORS.rose.primary} />
                  </TouchableOpacity>

                  <View style={styles.futureAudioNotice}>
                    <Sparkles size={14} color="#d4a853" />
                    <Text style={styles.futureAudioText}>
                      Multilingual creator dubbing tracks will be released with official voice artists in future seasons.
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  fullscreenContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    aspectRatio: undefined,
  },
  theaterContainer: {
    borderWidth: 2,
    borderColor: 'rgba(233, 30, 140, 0.4)',
    shadowColor: COLORS.rose.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#000',
  },
  nativeVideo: {
    width: '100%',
    height: '100%',
  },
  subtitleContainer: {
    position: 'absolute',
    bottom: 55,
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  subtitleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  resumeToast: {
    position: 'absolute',
    top: 45,
    alignSelf: 'center',
    backgroundColor: 'rgba(10, 10, 15, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 168, 83, 0.4)',
  },
  resumeToastText: {
    color: '#f5e6b8',
    fontSize: 11,
    fontWeight: '700',
  },
  nextOverlay: {
    position: 'absolute',
    bottom: 60,
    right: 16,
    backgroundColor: 'rgba(17, 17, 24, 0.95)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.rose.primary,
    maxWidth: 260,
  },
  nextCard: {
    gap: 4,
  },
  nextUpLabel: {
    color: COLORS.rose.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  nextTitle: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  nextActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  playNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.rose.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  playNextText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  cancelNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  cancelNextText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '600',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
    justifyContent: 'space-between',
    padding: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  videoTitleBar: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    maxWidth: '75%',
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
  },
  seekCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  seekBadge: {
    position: 'absolute',
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    top: 14,
  },
  playPauseCircleBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.rose.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.rose.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  bottomBar: {
    gap: 6,
  },
  timelineTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    position: 'relative',
  },
  timelineProgress: {
    height: '100%',
    backgroundColor: COLORS.rose.primary,
    borderRadius: 2,
  },
  timelineScrubber: {
    position: 'absolute',
    top: -5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: COLORS.rose.primary,
  },
  bottomMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeCurrent: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  timeSeparator: {
    color: '#a1a1aa',
    fontSize: 11,
  },
  timeDuration: {
    color: '#a1a1aa',
    fontSize: 11,
  },
  bottomButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pillBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  controlIconBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.black.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: '60%',
    borderWidth: 1,
    borderColor: COLORS.black.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.black.border,
    marginBottom: 10,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.black.surface,
    borderRadius: 8,
    padding: 3,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: COLORS.rose.primary,
  },
  tabText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
  modalContent: {
    marginBottom: 10,
  },
  sectionSubtitle: {
    color: COLORS.text.muted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  optionLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  optionSub: {
    color: COLORS.text.muted,
    fontSize: 10,
    marginTop: 2,
  },
  futureAudioNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(212, 168, 83, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 168, 83, 0.25)',
  },
  futureAudioText: {
    color: '#f5e6b8',
    fontSize: 10,
    flex: 1,
    lineHeight: 14,
  },
});
