import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { ChevronLeft, Play, Trash2, History } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { useApp } from '../context/AppContext';

export const WatchHistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { watchHistory, clearWatchHistory } = useApp();

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Listening History</Text>
        {watchHistory.length > 0 ? (
          <TouchableOpacity style={styles.backBtn} onPress={clearWatchHistory}>
            <Trash2 size={16} color={COLORS.text.muted} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {watchHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <History size={48} color={COLORS.text.muted} />
          <Text style={styles.emptyTitle}>No History Yet</Text>
          <Text style={styles.emptySub}>
            Start listening to romantic episodes and your resume progress will appear here.
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => navigation.navigate('Videos')}
          >
            <Text style={styles.browseBtnText}>BROWSE EPISODES</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.historyCount}>
            {watchHistory.length} Episodes in your listening log
          </Text>

          {watchHistory.map((item) => (
            <TouchableOpacity
              key={item.videoId}
              style={styles.historyCard}
              onPress={() =>
                navigation.navigate('VideoPlayer', {
                  video: item.video,
                  initialTimeSec: item.progressSec,
                })
              }
              activeOpacity={0.88}
            >
              <View style={styles.thumbWrap}>
                <Image
                  source={{ uri: item.video.thumbnail }}
                  style={styles.thumb}
                  resizeMode="cover"
                />
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${item.percentage}%` },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.categoryText}>{item.video.category}</Text>
                <Text style={styles.title} numberOfLines={2}>
                  {item.video.title}
                </Text>
                <View style={styles.progressRow}>
                  <Text style={styles.progressPercent}>
                    {item.percentage}% finished
                  </Text>
                  <View style={styles.resumePill}>
                    <Play size={10} color="#fff" fill="#fff" />
                    <Text style={styles.resumeText}>Resume</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  emptySub: {
    color: COLORS.text.secondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  browseBtn: {
    backgroundColor: COLORS.rose.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  browseBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  historyCount: {
    color: COLORS.text.muted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 12,
  },
  historyCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.black.card,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.black.border,
    marginBottom: 12,
  },
  thumbWrap: {
    width: 120,
    aspectRatio: 16 / 9,
    position: 'relative',
    backgroundColor: COLORS.black.surface,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  progressBarBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.rose.primary,
  },
  cardInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  categoryText: {
    color: COLORS.rose.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressPercent: {
    color: COLORS.text.muted,
    fontSize: 10,
  },
  resumePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.rose.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  resumeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
});
