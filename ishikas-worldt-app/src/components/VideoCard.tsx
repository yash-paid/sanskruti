import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Play, Lock, Clock, Eye, Sparkles } from 'lucide-react-native';
import { Video } from '../types';
import { COLORS } from '../theme/colors';

interface VideoCardProps {
  video: Video;
  onPress: () => void;
  compact?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onPress, compact = false }) => {
  return (
    <TouchableOpacity
      style={[styles.container, compact && styles.compactContainer]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Thumbnail */}
      <View style={[styles.thumbnailWrap, compact && styles.compactThumbnail]}>
        <Image
          source={{ uri: video.thumbnail }}
          style={styles.thumbnail}
          resizeMode="cover"
        />

        {/* Duration Badge */}
        <View style={styles.durationBadge}>
          <Clock size={10} color="#fff" />
          <Text style={styles.durationText}>{video.duration}</Text>
        </View>

        {/* Premium / VIP Badge */}
        {video.isPremium && (
          <View style={styles.premiumBadge}>
            <Lock size={10} color="#d4a853" />
            <Text style={styles.premiumText}>VIP VAULT</Text>
          </View>
        )}

        {/* Play Icon Overlay */}
        <View style={styles.playButtonOverlay}>
          <Play size={16} color="#fff" fill="#fff" />
        </View>
      </View>

      {/* Meta Content */}
      <View style={styles.infoWrap}>
        <View style={styles.categoryRow}>
          <Text style={styles.categoryText}>{video.category}</Text>
          <View style={styles.viewsRow}>
            <Eye size={11} color={COLORS.text.muted} />
            <Text style={styles.viewsText}>{video.views}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={compact ? 1 : 2}>
          {video.title}
        </Text>

        <Text style={styles.channelName} numberOfLines={1}>
          {video.channelName}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.black.card,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.black.border,
    marginBottom: 14,
  },
  compactContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    height: 88,
  },
  thumbnailWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: COLORS.black.surface,
    position: 'relative',
  },
  compactThumbnail: {
    width: 125,
    height: '100%',
    aspectRatio: undefined,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(10, 10, 15, 0.90)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 168, 83, 0.5)',
  },
  premiumText: {
    color: '#d4a853',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  playButtonOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -18 }, { translateY: -18 }],
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(233, 30, 140, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  infoWrap: {
    padding: 12,
    flex: 1,
    justifyContent: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryText: {
    color: COLORS.rose.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  viewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewsText: {
    color: COLORS.text.muted,
    fontSize: 11,
    fontWeight: '500',
  },
  title: {
    color: COLORS.text.primary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 4,
  },
  channelName: {
    color: COLORS.text.secondary,
    fontSize: 11,
    fontWeight: '500',
  },
});
