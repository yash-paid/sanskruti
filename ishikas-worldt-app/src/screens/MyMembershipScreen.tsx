import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Crown, Sparkles, Check, ChevronLeft, LockOpen, ArrowRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { MOCK_PLANS } from '../data/mockData';

export const MyMembershipScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useApp();

  const activePlan =
    MOCK_PLANS.find((p) => p.id === user.memberTier) || MOCK_PLANS[2];

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
        <Text style={styles.headerTitle}>My Active Membership</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tier Card */}
        <View style={[styles.membershipCard, { borderColor: activePlan.color }]}>
          <View style={styles.tierTopRow}>
            <View>
              <Text style={styles.memberStatusText}>ACTIVE SUBSCRIBER</Text>
              <Text style={styles.tierTitle}>{activePlan.name}</Text>
            </View>
            <Text style={styles.badgeEmoji}>{activePlan.badge}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.memberMetaRow}>
            <View>
              <Text style={styles.metaLabel}>Member Since</Text>
              <Text style={styles.metaVal}>{user.memberSince}</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>Renewal Price</Text>
              <Text style={[styles.metaVal, { color: activePlan.color }]}>
                ₹{activePlan.price} / month
              </Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>Status</Text>
              <Text style={[styles.metaVal, { color: '#10b981' }]}>Verified ✅</Text>
            </View>
          </View>
        </View>

        {/* Unlocked Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Unlocked VIP Privileges</Text>
          <View style={styles.featuresList}>
            {activePlan.features.map((feat, idx) => (
              <View key={idx} style={styles.featureItem}>
                <View style={styles.checkIconWrap}>
                  <Check size={12} color="#10b981" />
                </View>
                <Text style={styles.featureText}>{feat}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Shortcuts */}
        <TouchableOpacity
          style={styles.shortcutCard}
          onPress={() => navigation.navigate('Videos')}
          activeOpacity={0.88}
        >
          <View style={styles.shortcutIconWrap}>
            <LockOpen size={20} color="#d4a853" />
          </View>
          <View style={styles.shortcutContent}>
            <Text style={styles.shortcutTitle}>Listen to VIP Audio Vault</Text>
            <Text style={styles.shortcutSub}>Uncut audio episodes & deleted takes</Text>
          </View>
          <ArrowRight size={18} color="#a1a1aa" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shortcutCard}
          onPress={() => navigation.navigate('Community')}
          activeOpacity={0.88}
        >
          <View style={styles.shortcutIconWrap}>
            <Crown size={20} color={COLORS.rose.primary} />
          </View>
          <View style={styles.shortcutContent}>
            <Text style={styles.shortcutTitle}>Enter VIP Terrace Lounge</Text>
            <Text style={styles.shortcutSub}>Private chat with Ishika and VIP Army</Text>
          </View>
          <ArrowRight size={18} color="#a1a1aa" />
        </TouchableOpacity>
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
    padding: 16,
    paddingBottom: 40,
  },
  membershipCard: {
    backgroundColor: COLORS.black.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 2,
    marginBottom: 20,
  },
  tierTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberStatusText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  tierTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  badgeEmoji: {
    fontSize: 32,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 14,
  },
  memberMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLabel: {
    color: COLORS.text.muted,
    fontSize: 10,
  },
  metaVal: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeading: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  featuresList: {
    backgroundColor: COLORS.black.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.black.border,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    color: COLORS.text.primary,
    fontSize: 12,
    flex: 1,
  },
  shortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.black.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.black.border,
    marginBottom: 12,
    gap: 12,
  },
  shortcutIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.black.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutContent: {
    flex: 1,
  },
  shortcutTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  shortcutSub: {
    color: COLORS.text.muted,
    fontSize: 11,
    marginTop: 2,
  },
});
