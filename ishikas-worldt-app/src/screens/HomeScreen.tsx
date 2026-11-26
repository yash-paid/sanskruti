import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import {
  Play,
  Sparkles,
  Crown,
  ChevronRight,
  TrendingUp,
  ShoppingBag,
  MessageCircle,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../components/Header';
import { VideoCard } from '../components/VideoCard';
import { ProductCard } from '../components/ProductCard';
import { COLORS } from '../theme/colors';
import { MOCK_VIDEOS, MOCK_PRODUCTS, MOCK_PLAYLISTS } from '../data/mockData';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { addToCart, watchHistory, user } = useApp();

  const featuredVideo = MOCK_VIDEOS[0];
  const recentVideos = MOCK_VIDEOS.slice(1, 5);
  const featuredMerch = MOCK_PRODUCTS.slice(0, 3);

  return (
    <View style={styles.container}>
      <Header
        onCartPress={() => navigation.navigate('Cart')}
        onProfilePress={() => navigation.navigate('Profile')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Featured Video Banner */}
        <TouchableOpacity
          style={styles.heroBanner}
          onPress={() => navigation.navigate('VideoDetail', { video: featuredVideo })}
          activeOpacity={0.92}
        >
          <Image
            source={{ uri: featuredVideo.thumbnail }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroGradient}>
            <View style={styles.heroBadgeRow}>
              <View style={styles.featuredTag}>
                <Sparkles size={10} color="#fff" />
                <Text style={styles.featuredTagText}>FRESH PREMIERE</Text>
              </View>
              <Text style={styles.durationPill}>{featuredVideo.duration}</Text>
            </View>

            <Text style={styles.heroTitle} numberOfLines={2}>
              {featuredVideo.title}
            </Text>

            <View style={styles.heroFooter}>
              <View style={styles.playHeroBtn}>
                <Play size={14} color="#fff" fill="#fff" />
                <Text style={styles.playHeroText}>WATCH EPISODE</Text>
              </View>
              <Text style={styles.heroCategory}>{featuredVideo.category}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Continue Watching Section */}
        {watchHistory.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <TrendingUp size={16} color={COLORS.rose.primary} />
                <Text style={styles.sectionTitle}>Continue Listening</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('WatchHistory')}
                style={styles.seeAllBtn}
              >
                <Text style={styles.seeAllText}>History</Text>
                <ChevronRight size={14} color={COLORS.rose.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
              {watchHistory.map((item) => (
                <TouchableOpacity
                  key={item.videoId}
                  style={styles.continueCard}
                  onPress={() =>
                    navigation.navigate('VideoPlayer', {
                      video: item.video,
                      initialTimeSec: item.progressSec,
                    })
                  }
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: item.video.thumbnail }} style={styles.continueThumb} />
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${item.percentage}%` }]} />
                  </View>
                  <Text style={styles.continueTitle} numberOfLines={1}>
                    {item.video.title}
                  </Text>
                  <Text style={styles.continueProgress}>
                    {item.percentage}% completed
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Series Playlists Spotlight */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Iconic Audio Series</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Videos')}>
              <Text style={styles.seeAllText}>Explore</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
            {MOCK_PLAYLISTS.map((pl) => (
              <TouchableOpacity
                key={pl.id}
                style={styles.playlistCard}
                onPress={() => navigation.navigate('Videos')}
                activeOpacity={0.88}
              >
                <Image source={{ uri: pl.thumbnail }} style={styles.playlistImage} />
                <View style={styles.playlistOverlay}>
                  <Text style={styles.playlistTitle} numberOfLines={1}>
                    {pl.title}
                  </Text>
                  <Text style={styles.playlistCount}>{pl.videoCount} Episodes</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Latest Episodes List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending & New Releases</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Videos')}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentVideos.map((vid) => (
            <VideoCard
              key={vid.id}
              video={vid}
              onPress={() => navigation.navigate('VideoDetail', { video: vid })}
            />
          ))}
        </View>

        {/* Membership Promo Card */}
        <TouchableOpacity
          style={styles.membershipBanner}
          onPress={() => navigation.navigate('Membership')}
          activeOpacity={0.9}
        >
          <View style={styles.vipPromoLeft}>
            <Crown size={24} color="#d4a853" />
            <Text style={styles.vipPromoTitle}>Unlock Ishq Army VIP 👑</Text>
            <Text style={styles.vipPromoSub}>
              Uncut romantic episodes, private voice stream Q&As, and exclusive character insights.
            </Text>
            <View style={styles.joinTierPill}>
              <Text style={styles.joinTierPillText}>VIEW MEMBERSHIPS (FROM ₹1)</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Featured Merch Store Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <ShoppingBag size={16} color={COLORS.rose.primary} />
              <Text style={styles.sectionTitle}>Official Creator Merch</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Store')}>
              <Text style={styles.seeAllText}>Store</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.merchGrid}>
            {featuredMerch.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onPress={() => navigation.navigate('ProductDetail', { product: prod })}
                onQuickAdd={() =>
                  addToCart(prod, prod.sizes[0], prod.colors[0], 1)
                }
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  heroBanner: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: COLORS.black.surface,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 5, 7, 0.65)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  featuredTag: {
    backgroundColor: COLORS.rose.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featuredTagText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  durationPill: {
    color: '#fff',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 10,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.rose.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  playHeroText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroCategory: {
    color: COLORS.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginTop: 22,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: COLORS.text.primary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    color: COLORS.rose.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  horizontalList: {
    marginLeft: -16,
    paddingLeft: 16,
  },
  continueCard: {
    width: 170,
    backgroundColor: COLORS.black.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.black.border,
  },
  continueThumb: {
    width: '100%',
    height: 95,
  },
  progressBarBg: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.rose.primary,
  },
  continueTitle: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  continueProgress: {
    color: COLORS.text.muted,
    fontSize: 9,
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  playlistCard: {
    width: 200,
    height: 115,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.black.border,
  },
  playlistImage: {
    width: '100%',
    height: '100%',
  },
  playlistOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 5, 7, 0.70)',
    justifyContent: 'flex-end',
    padding: 10,
  },
  playlistTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  playlistCount: {
    color: COLORS.gold.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  membershipBanner: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#161014',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 168, 83, 0.4)',
  },
  vipPromoLeft: {
    gap: 6,
  },
  vipPromoTitle: {
    color: '#d4a853',
    fontSize: 16,
    fontWeight: '800',
  },
  vipPromoSub: {
    color: COLORS.text.secondary,
    fontSize: 12,
    lineHeight: 16,
  },
  joinTierPill: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.gold.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 6,
  },
  joinTierPillText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  merchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
});
