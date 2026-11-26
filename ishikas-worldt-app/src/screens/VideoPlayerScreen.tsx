import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { ChevronLeft, Share2, Bookmark, Sparkles, Tv } from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { CustomVideoPlayer } from '../components/CustomVideoPlayer';
import { Video } from '../types';
import { COLORS } from '../theme/colors';
import { MOCK_VIDEOS } from '../data/mockData';
import { VideoCard } from '../components/VideoCard';
import { useApp } from '../context/AppContext';

export const VideoPlayerScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { video, initialTimeSec } = route.params as {
    video: Video;
    initialTimeSec?: number;
  };

  const { saveWatchProgress, isVideoSaved, toggleSaveVideo } = useApp();
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);

  const isSaved = isVideoSaved(video.id);

  // Up next videos in playlist
  const currentIndex = MOCK_VIDEOS.findIndex((v) => v.id === video.id);
  const nextVideo =
    currentIndex >= 0 && currentIndex < MOCK_VIDEOS.length - 1
      ? MOCK_VIDEOS[currentIndex + 1]
      : MOCK_VIDEOS[0];

  const upNextList = MOCK_VIDEOS.filter((v) => v.id !== video.id);

  const handleNextVideo = () => {
    navigation.replace('VideoPlayer', { video: nextVideo });
  };

  const handleProgressUpdate = (progressSec: number, durationSec: number) => {
    saveWatchProgress(video, progressSec, durationSec);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Listening to "${video.title}" on ISHIKA'S WORLDT app!`,
      });
    } catch (e) {}
  };

  return (
    <View style={[styles.container, isTheaterMode && styles.theaterBackground]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {video.title}
        </Text>
        <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
          <Share2 size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Custom Native Video Player */}
      <CustomVideoPlayer
        video={video}
        nextVideo={nextVideo}
        onNextVideo={handleNextVideo}
        isTheaterMode={isTheaterMode}
        onToggleTheater={() => setIsTheaterMode((prev) => !prev)}
        onProgressUpdate={handleProgressUpdate}
        initialTimeSec={initialTimeSec}
      />

      {/* Playlist & Info Container */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Interactive Title & Action Bar */}
        <View style={styles.infoSection}>
          <View style={styles.badgeRow}>
            <Text style={styles.categoryBadge}>{video.category}</Text>
            {video.isPremium && (
              <View style={styles.vipTag}>
                <Sparkles size={11} color="#d4a853" />
                <Text style={styles.vipTagText}>VIP VAULT</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.theaterPill, isTheaterMode && styles.theaterPillActive]}
              onPress={() => setIsTheaterMode((prev) => !prev)}
            >
              <Tv size={12} color={isTheaterMode ? '#fff' : COLORS.text.muted} />
              <Text
                style={[
                  styles.theaterPillText,
                  isTheaterMode && styles.theaterPillTextActive,
                ]}
              >
                {isTheaterMode ? 'Theater Active' : 'Theater Mode'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.videoTitle}>{video.title}</Text>
          <Text style={styles.channelSubtitle}>{video.channelName}</Text>

          {/* Quick Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, isSaved && styles.actionBtnActive]}
              onPress={() => toggleSaveVideo(video.id)}
            >
              <Bookmark
                size={16}
                color={isSaved ? COLORS.rose.primary : '#fff'}
                fill={isSaved ? COLORS.rose.primary : 'none'}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  isSaved && { color: COLORS.rose.primary },
                ]}
              >
                {isSaved ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Share2 size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Up Next Queue */}
        <View style={styles.queueSection}>
          <Text style={styles.queueHeading}>Up Next in Ishq Universe</Text>
          {upNextList.map((item) => (
            <VideoCard
              key={item.id}
              video={item}
              compact
              onPress={() => navigation.replace('VideoPlayer', { video: item })}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black.primary,
  },
  theaterBackground: {
    backgroundColor: '#030305',
  },
  topBar: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: COLORS.black.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.black.border,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    maxWidth: '75%',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  infoSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  categoryBadge: {
    color: COLORS.rose.primary,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(233, 30, 140, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  vipTag: {
    backgroundColor: 'rgba(212, 168, 83, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  vipTagText: {
    color: '#d4a853',
    fontSize: 10,
    fontWeight: '800',
  },
  theaterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.black.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.black.border,
    marginLeft: 'auto',
  },
  theaterPillActive: {
    backgroundColor: COLORS.rose.primary,
    borderColor: COLORS.rose.primary,
  },
  theaterPillText: {
    color: COLORS.text.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  theaterPillTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
  videoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 4,
  },
  channelSubtitle: {
    color: COLORS.text.muted,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 14,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.black.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.black.border,
  },
  actionBtnActive: {
    borderColor: COLORS.rose.primary,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  queueSection: {
    padding: 16,
  },
  queueHeading: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 14,
  },
});
