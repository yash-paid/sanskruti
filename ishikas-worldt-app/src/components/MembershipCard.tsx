import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, Crown, Diamond, Sparkles } from 'lucide-react-native';
import { MembershipPlan } from '../types';
import { COLORS } from '../theme/colors';

interface MembershipCardProps {
  plan: MembershipPlan;
  isCurrentTier?: boolean;
  onSubscribe: (plan: MembershipPlan) => void;
}

export const MembershipCard: React.FC<MembershipCardProps> = ({
  plan,
  isCurrentTier = false,
  onSubscribe,
}) => {
  return (
    <View
      style={[
        styles.card,
        plan.highlighted && styles.highlightedCard,
        plan.id === 'elite' && styles.eliteCard,
      ]}
    >
      {/* Header Pill */}
      {plan.highlighted && (
        <View style={styles.popularBadge}>
          <Crown size={12} color="#fff" />
          <Text style={styles.popularText}>MOST POPULAR TIER</Text>
        </View>
      )}

      {plan.id === 'elite' && (
        <View style={styles.eliteHeaderBadge}>
          <Diamond size={12} color="#000" />
          <Text style={styles.eliteHeaderText}>PRODUCER PRIVILEGES • ₹1 PROMO</Text>
        </View>
      )}

      {/* Title & Icon */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planDesc}>{plan.description}</Text>
        </View>
        <Text style={styles.planBadgeIcon}>{plan.badge}</Text>
      </View>

      {/* Pricing */}
      <View style={styles.priceRow}>
        <Text style={[styles.currency, { color: plan.color }]}>₹</Text>
        <Text style={[styles.priceAmount, { color: plan.color }]}>{plan.price}</Text>
        <Text style={styles.period}> / {plan.period}</Text>
      </View>

      {/* Feature Bullet Points */}
      <View style={styles.featuresList}>
        {plan.features.map((feat, idx) => (
          <View key={idx} style={styles.featureItem}>
            <View style={[styles.checkCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Check size={12} color="#10b981" />
            </View>
            <Text style={styles.featureText}>{feat}</Text>
          </View>
        ))}
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          isCurrentTier
            ? styles.currentTierButton
            : { backgroundColor: plan.color },
        ]}
        onPress={() => onSubscribe(plan)}
        disabled={isCurrentTier}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.actionButtonText,
            isCurrentTier ? styles.currentTierText : { color: plan.id === 'elite' ? '#000' : '#fff' },
          ]}
        >
          {isCurrentTier
            ? 'CURRENT ACTIVE MEMBERSHIP'
            : `JOIN ${plan.name.toUpperCase()} (₹${plan.price})`}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.black.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.black.border,
    marginBottom: 16,
    position: 'relative',
  },
  highlightedCard: {
    borderColor: COLORS.rose.primary,
    borderWidth: 2,
    backgroundColor: '#140c14',
  },
  eliteCard: {
    borderColor: COLORS.gold.primary,
    borderWidth: 2,
    backgroundColor: '#14120a',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: COLORS.rose.primary,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  popularText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  eliteHeaderBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: COLORS.gold.primary,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eliteHeaderText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  planName: {
    color: COLORS.text.primary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  planDesc: {
    color: COLORS.text.secondary,
    fontSize: 12,
    lineHeight: 16,
    maxWidth: '85%',
  },
  planBadgeIcon: {
    fontSize: 26,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  currency: {
    fontSize: 18,
    fontWeight: '700',
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  period: {
    color: COLORS.text.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  featuresList: {
    marginBottom: 18,
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    color: COLORS.text.primary,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
  actionButton: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  currentTierButton: {
    backgroundColor: COLORS.black.surface,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  currentTierText: {
    color: COLORS.text.muted,
  },
});
