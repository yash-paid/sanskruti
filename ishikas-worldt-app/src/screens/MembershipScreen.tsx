import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Crown, CheckCircle2, Sparkles, X, ShieldCheck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../components/Header';
import { MembershipCard } from '../components/MembershipCard';
import { COLORS } from '../theme/colors';
import { MOCK_PLANS } from '../data/mockData';
import { MembershipPlan } from '../types';
import { useApp } from '../context/AppContext';

export const MembershipScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, upgradeMembership } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  const handleSubscribe = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
  };

  const confirmSubscription = () => {
    if (!selectedPlan) return;
    upgradeMembership(selectedPlan.id);
    setSelectedPlan(null);
    setShowSuccessModal(true);
  };

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
        {/* Banner */}
        <View style={styles.headerHero}>
          <Crown size={32} color="#d4a853" />
          <Text style={styles.heroTitle}>Ishq Army Memberships</Text>
          <Text style={styles.heroSub}>
            Directly support Ishika's romantic audio productions and unlock uncut episodes, private lounges, and producer credits.
          </Text>
        </View>

        {/* Plans List */}
        <View style={styles.plansList}>
          {MOCK_PLANS.map((plan) => (
            <MembershipCard
              key={plan.id}
              plan={plan}
              isCurrentTier={user.memberTier === plan.id}
              onSubscribe={handleSubscribe}
            />
          ))}
        </View>

        {/* Security & Guarantee Note */}
        <View style={styles.securityNote}>
          <ShieldCheck size={18} color="#10b981" />
          <Text style={styles.securityText}>
            Official creator subscription. Cancel anytime from your account settings.
          </Text>
        </View>
      </ScrollView>

      {/* Checkout Confirmation Modal */}
      <Modal
        visible={!!selectedPlan}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPlan(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Confirm Membership</Text>
              <TouchableOpacity onPress={() => setSelectedPlan(null)}>
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {selectedPlan && (
              <View style={styles.modalBody}>
                <View style={styles.modalTierBox}>
                  <Text style={styles.modalTierName}>{selectedPlan.name}</Text>
                  <Text style={styles.modalTierPrice}>
                    ₹{selectedPlan.price} / {selectedPlan.period}
                  </Text>
                </View>

                <Text style={styles.modalDesc}>{selectedPlan.description}</Text>

                <View style={styles.featurePreviewList}>
                  {selectedPlan.features.slice(0, 3).map((f, i) => (
                    <View key={i} style={styles.previewFeatureItem}>
                      <CheckCircle2 size={14} color="#10b981" />
                      <Text style={styles.previewFeatureText}>{f}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.confirmPayBtn, { backgroundColor: selectedPlan.color }]}
                  onPress={confirmSubscription}
                  activeOpacity={0.88}
                >
                  <Text
                    style={[
                      styles.confirmPayText,
                      { color: selectedPlan.id === 'elite' ? '#000' : '#fff' },
                    ]}
                  >
                    ⚡ ACTIVATE FOR ₹{selectedPlan.price}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, styles.successSheet]}>
            <View style={styles.successIconCircle}>
              <Sparkles size={36} color="#d4a853" />
            </View>
            <Text style={styles.successTitle}>Welcome to the Circle! 👑</Text>
            <Text style={styles.successSub}>
              Your membership has been activated successfully! All VIP vault episodes and private community lounge are now unlocked.
            </Text>
            <TouchableOpacity
              style={styles.goToVaultBtn}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.navigate('MyMembership');
              }}
            >
              <Text style={styles.goToVaultText}>VIEW MY MEMBERSHIP PERKS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 40,
  },
  headerHero: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  heroSub: {
    color: COLORS.text.secondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
  plansList: {
    paddingHorizontal: 16,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    backgroundColor: COLORS.black.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.black.border,
    marginTop: 8,
  },
  securityText: {
    color: COLORS.text.muted,
    fontSize: 11,
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.black.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.black.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.black.border,
  },
  modalHeading: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  modalBody: {
    gap: 12,
  },
  modalTierBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.black.surface,
    padding: 14,
    borderRadius: 12,
  },
  modalTierName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  modalTierPrice: {
    color: COLORS.gold.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  modalDesc: {
    color: COLORS.text.secondary,
    fontSize: 12,
    lineHeight: 16,
  },
  featurePreviewList: {
    gap: 8,
    marginVertical: 6,
  },
  previewFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewFeatureText: {
    color: COLORS.text.primary,
    fontSize: 12,
    flex: 1,
  },
  confirmPayBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  confirmPayText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  successSheet: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(212, 168, 83, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gold.primary,
  },
  successTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  successSub: {
    color: COLORS.text.secondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  goToVaultBtn: {
    backgroundColor: COLORS.gold.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  goToVaultText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
