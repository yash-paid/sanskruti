import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import {
  Crown,
  History,
  ShoppingBag,
  Settings,
  ChevronRight,
  ShieldCheck,
  Bookmark,
  Sparkles,
  HelpCircle,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../components/Header';
import { COLORS } from '../theme/colors';
import { useApp } from '../context/AppContext';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, watchHistory, orders, savedVideoIds } = useApp();

  const menuItems = [
    {
      icon: Crown,
      label: 'My Membership Privileges',
      sub: `${user.memberTier.toUpperCase()} • Active`,
      color: '#d4a853',
      screen: 'MyMembership',
    },
    {
      icon: History,
      label: 'Watch & Listening History',
      sub: `${watchHistory.length} episodes tracked`,
      color: COLORS.rose.primary,
      screen: 'WatchHistory',
    },
    {
      icon: ShoppingBag,
      label: 'My Orders & Tracking',
      sub: `${orders.length} orders placed`,
      color: '#10b981',
      screen: 'MyOrders',
    },
    {
      icon: Bookmark,
      label: 'Saved & Favorite Episodes',
      sub: `${savedVideoIds.length} episodes saved`,
      color: '#3b82f6',
      screen: 'Videos',
    },
    {
      icon: Settings,
      label: 'App Settings & Streaming',
      sub: 'Audio quality, subtitles, security',
      color: '#a1a1aa',
      screen: 'Settings',
    },
  ];

  return (
    <View style={styles.container}>
      <Header
        onCartPress={() => navigation.navigate('Cart')}
        onProfilePress={() => {}}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarWrap}>
            <Image
              source={{ uri: user.avatarUrl }}
              style={styles.avatar}
            />
            <View style={styles.avatarBadge}>
              <Crown size={12} color="#000" />
            </View>
          </View>

          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userPhone}>{user.phone}</Text>

          <View style={styles.tierPill}>
            <Sparkles size={12} color="#d4a853" />
            <Text style={styles.tierPillText}>
              {user.memberTier.toUpperCase()} CIRCLE MEMBER
            </Text>
          </View>
        </View>

        {/* Menu Navigation Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={idx}
                style={styles.menuItem}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.85}
              >
                <View
                  style={[styles.menuIconCircle, { backgroundColor: `${item.color}15` }]}
                >
                  <Icon size={18} color={item.color} />
                </View>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSub}>{item.sub}</Text>
                </View>
                <ChevronRight size={18} color={COLORS.text.muted} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Official Platform Security Badge */}
        <View style={styles.securityBox}>
          <ShieldCheck size={20} color="#10b981" />
          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>Secure Mobile Architecture</Text>
            <Text style={styles.securityText}>
              100% encrypted HTTPS traffic. No background tracking or intrusive permissions.
            </Text>
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
    padding: 16,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: COLORS.black.card,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.black.border,
    marginBottom: 20,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: COLORS.gold.primary,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.gold.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  userEmail: {
    color: COLORS.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  userPhone: {
    color: COLORS.text.muted,
    fontSize: 11,
    marginTop: 1,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212, 168, 83, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 168, 83, 0.4)',
    marginTop: 10,
  },
  tierPillText: {
    color: '#d4a853',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  menuSection: {
    backgroundColor: COLORS.black.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.black.border,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuInfo: {
    flex: 1,
  },
  menuLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  menuSub: {
    color: COLORS.text.muted,
    fontSize: 11,
    marginTop: 2,
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    gap: 12,
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: '800',
  },
  securityText: {
    color: COLORS.text.secondary,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
});
