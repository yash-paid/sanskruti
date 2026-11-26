import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
} from 'react-native';
import {
  Play,
  Bookmark,
  Share2,
  Clock,
  Eye,
  Calendar,
  Lock,
  MessageSquare,
  Sparkles,
  ChevronLeft,
} from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video } from '../types';
import { COLORS } from '../theme/colors';
import { MOCK_VIDEOS } from '../data/mockData';
import { VideoCard } from '../components/VideoCard';
import { useApp } from '../context/AppContext';

export const VideoDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 14);
  const { video } = route.params as { video: Video };
  const { isVideoSaved, toggleSaveVideo, isVipUnlocked } = useApp();

  const isSaved = isVideoSaved(video.id);
  const isLocked = video.isPremium && !isVipUnlocked;

  const upNextVideos = MOCK_VIDEOS.filter((v) => v.id !== video.id).slice(0, 3);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Listen to "${video.title}" on Ishika's World app!`,
      });
    } catch (e) {}
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={[styles.topHeader, { paddingTop: topPadding, height: 52 + topPadding }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Episode Details
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={handleShare}>
          <Share2 size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Thumbnail Preview Banner */}
        <TouchableOpacity
          style={styles.previewContainer}
          onPress={() => {
            if (isLocked) {
              navigation.navigate('Membership');
            } else {
              navigation.navigate('VideoPlayer', { video });
            }
          }}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: video.thumbnail }}
            style={styles.previewImage}
            resizeMode="cover"
          />
          <View style={styles.previewOverlay}>
            <View style={styles.playBigCircle}>
              {isLocked ? (
                <Lock size={26} color="#d4a853" />
              ) : (
                <Play size={26} color="#fff" fill="#fff" style={{ marginLeft: 3 }} />
              )}
            </View>
            <Text style={styles.tapToPlayText}>
              {isLocked ? 'VIP MEMBERSHIP REQUIRED' : 'TAP TO PLAY EPISODE'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Video Metadata */}
        <View style={styles.contentWrap}>
          <View style={styles.categoryBadgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{video.category}</Text>
            </View>
            {video.isPremium && (
              <View style={styles.vipBadge}>
                <Sparkles size={11} color="#d4a853" />
                <Text style={styles.vipBadgeText}>VIP VAULT EXCLUSIVE</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{video.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={12} color={COLORS.text.muted} />
              <Text style={styles.metaText}>{video.duration}</Text>
            </View>
            <View style={styles.metaItem}>
              <Eye size={12} color={COLORS.text.muted} />
              <Text style={styles.metaText}>{video.views}</Text>
            </View>
            <View style={styles.metaItem}>
              <Calendar size={12} color={COLORS.text.muted} />
              <Text style={styles.metaText}>{video.date}</Text>
            </View>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.primaryPlayBtn}
              onPress={() => {
                if (isLocked) {
                  navigation.navigate('Membership');
                } else {
                  navigation.navigate('VideoPlayer', { video });
                }
              }}
              activeOpacity={0.85}
            >
              <Play size={16} color="#fff" fill="#fff" />
              <Text style={styles.primaryPlayText}>
                {isLocked ? 'Unlock with VIP' : 'Play Audio Stream'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryActionBtn, isSaved && styles.savedBtn]}
              onPress={() => toggleSaveVideo(video.id)}
              activeOpacity={0.8}
            >
              <Bookmark
                size={18}
                color={isSaved ? COLORS.rose.primary : '#fff'}
                fill={isSaved ? COLORS.rose.primary : 'none'}
              />
            </TouchableOpacity>
          </View>

          {/* Channel Info Card */}
          <View style={styles.channelCard}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.channelAvatar}
            />
            <View style={styles.channelInfo}>
              <Text style={styles.channelName}>{video.channelName}</Text>
              <Text style={styles.channelSub}>Official Ishq Army Series Creator</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionHeading}>About this Episode</Text>
            <Text style={styles.descriptionText}>{video.description}</Text>
          </View>

          {/* Up Next / Recommended */}
          <View style={styles.upNextSection}>
            <Text style={styles.sectionHeading}>Up Next in Series</Text>
            {upNextVideos.map((upNext) => (
              <VideoCard
                key={upNext.id}
                video={upNext}
                compact
                onPress={() => navigation.push('VideoDetail', { video: upNext })}
              />
            ))}
          </View>
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
  topHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.black.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  previewContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playBigCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.rose.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapToPlayText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  contentWrap: {
    padding: 16,
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: 'rgba(233, 30, 140, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: COLORS.rose.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  vipBadge: {
    backgroundColor: 'rgba(212, 168, 83, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vipBadgeText: {
    color: '#d4a853',
    fontSize: 10,
    fontWeight: '800',
  },
  title: {
    color: COLORS.text.primary,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: COLORS.text.muted,
    fontSize: 11,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  primaryPlayBtn: {
    flex: 1,
    backgroundColor: COLORS.rose.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryPlayText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryActionBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.black.surface,
    borderWidth: 1,
    borderColor: COLORS.black.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedBtn: {
    borderColor: COLORS.rose.primary,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.black.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.black.border,
    marginBottom: 20,
  },
  channelAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  channelSub: {
    color: COLORS.text.muted,
    fontSize: 11,
    marginTop: 2,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  sectionHeading: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  descriptionText: {
    color: COLORS.text.secondary,
    fontSize: 13,
    lineHeight: 20,
  },
  upNextSection: {
    marginTop: 8,
  },
});
