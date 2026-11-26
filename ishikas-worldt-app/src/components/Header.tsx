import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ShoppingBag, Bell, Crown } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onCartPress?: () => void;
  onProfilePress?: () => void;
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onCartPress,
  onProfilePress,
  title,
}) => {
  const { cartCount, user } = useApp();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 14);

  return (
    <View style={[styles.container, { paddingTop: topPadding, height: 60 + topPadding }]}>
      <View style={styles.leftSection}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logoImage}
          resizeMode="cover"
        />
        <View>
          <Text style={styles.brandTitle}>Ishika's World</Text>
          <Text style={styles.tagline}>Official Universe • Ishq Army 💚</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        {/* Tier Badge */}
        <TouchableOpacity
          style={[
            styles.tierBadge,
            user.memberTier === 'elite'
              ? styles.eliteBadge
              : user.memberTier === 'vip'
              ? styles.vipBadge
              : styles.explorerBadge,
          ]}
          onPress={onProfilePress}
          activeOpacity={0.8}
        >
          <Crown
            size={12}
            color={
              user.memberTier === 'elite'
                ? '#d4a853'
                : user.memberTier === 'vip'
                ? '#e91e8c'
                : '#10b981'
            }
          />
          <Text
            style={[
              styles.tierText,
              {
                color:
                  user.memberTier === 'elite'
                    ? '#d4a853'
                    : user.memberTier === 'vip'
                    ? '#fda4ca'
                    : '#6ee7b7',
              },
            ]}
          >
            {user.memberTier.toUpperCase()}
          </Text>
        </TouchableOpacity>

        {/* Cart Icon with Counter */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onCartPress}
          activeOpacity={0.7}
        >
          <ShoppingBag size={20} color={COLORS.text.primary} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: COLORS.black.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.black.border,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: COLORS.rose.primary,
  },
  brandTitle: {
    color: COLORS.text.primary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  tagline: {
    color: COLORS.text.muted,
    fontSize: 10,
    fontWeight: '500',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  eliteBadge: {
    backgroundColor: 'rgba(212, 168, 83, 0.12)',
    borderColor: 'rgba(212, 168, 83, 0.35)',
  },
  vipBadge: {
    backgroundColor: 'rgba(233, 30, 140, 0.12)',
    borderColor: 'rgba(233, 30, 140, 0.35)',
  },
  explorerBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  tierText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.black.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.black.border,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.rose.primary,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
});
