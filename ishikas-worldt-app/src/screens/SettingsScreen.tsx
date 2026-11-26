import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import {
  ChevronLeft,
  ShieldCheck,
  Bell,
  Smartphone,
  Eye,
  Lock,
  Info,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, BRAND } from '../theme/colors';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [autoplayNext, setAutoplayNext] = useState<boolean>(true);
  const [highQualityAudio, setHighQualityAudio] = useState<boolean>(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [downloadOverWifiOnly, setDownloadOverWifiOnly] = useState<boolean>(true);

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
        <Text style={styles.headerTitle}>Settings & Preferences</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Playback Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Streaming & Playback</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Autoplay Next Episode</Text>
                <Text style={styles.settingSub}>
                  Play next series chapter automatically with countdown
                </Text>
              </View>
              <Switch
                value={autoplayNext}
                onValueChange={setAutoplayNext}
                trackColor={{ false: '#333', true: COLORS.rose.primary }}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>High-Bitrate Studio Audio</Text>
                <Text style={styles.settingSub}>
                  Stream lossless uncompressed narration by Ishika
                </Text>
              </View>
              <Switch
                value={highQualityAudio}
                onValueChange={setHighQualityAudio}
                trackColor={{ false: '#333', true: COLORS.rose.primary }}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Stream on Wi-Fi Only</Text>
                <Text style={styles.settingSub}>
                  Save cellular mobile data when listening on the go
                </Text>
              </View>
              <Switch
                value={downloadOverWifiOnly}
                onValueChange={setDownloadOverWifiOnly}
                trackColor={{ false: '#333', true: COLORS.rose.primary }}
              />
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Notifications & Alerts</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>New Episode Premieres</Text>
                <Text style={styles.settingSub}>
                  Receive instant alerts when Shiddat or Not My Type drops
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#333', true: COLORS.rose.primary }}
              />
            </View>
          </View>
        </View>

        {/* Security & Integrity Disclosure (Section 6 Requirements) */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Privacy & Android Security</Text>
          <View style={styles.securityCard}>
            <View style={styles.securityItem}>
              <ShieldCheck size={18} color="#10b981" />
              <View style={styles.securityTextWrap}>
                <Text style={styles.securityItemTitle}>Official Package Security</Text>
                <Text style={styles.securityItemSub}>
                  Package: com.ishikasworldt.app • No hidden background tracking, zero malware, zero spyware.
                </Text>
              </View>
            </View>

            <View style={styles.securityItem}>
              <Lock size={18} color="#d4a853" />
              <View style={styles.securityTextWrap}>
                <Text style={styles.securityItemTitle}>Minimal Permissions</Text>
                <Text style={styles.securityItemSub}>
                  Strictly internet network access only. No contact access, no microphone or storage interception.
                </Text>
              </View>
            </View>

            <View style={styles.securityItem}>
              <Smartphone size={18} color="#3b82f6" />
              <View style={styles.securityTextWrap}>
                <Text style={styles.securityItemTitle}>Encrypted Communications</Text>
                <Text style={styles.securityItemSub}>
                  All API endpoints communicate securely over HTTPS TLS 1.3 protocol.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfoSection}>
          <Text style={styles.appNameText}>{BRAND.name}</Text>
          <Text style={styles.versionText}>
            Version {BRAND.version} (Build 1) • Android Native
          </Text>
          <Text style={styles.copyrightText}>
            © 2026 Ishika's World • Official Universe of Ishq Army 💚
          </Text>
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
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeading: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  card: {
    backgroundColor: COLORS.black.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.black.border,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  settingSub: {
    color: COLORS.text.muted,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 10,
  },
  securityCard: {
    backgroundColor: COLORS.black.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.black.border,
    gap: 14,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  securityTextWrap: {
    flex: 1,
  },
  securityItemTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  securityItemSub: {
    color: COLORS.text.secondary,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  appInfoSection: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  appNameText: {
    color: COLORS.text.primary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  versionText: {
    color: COLORS.text.muted,
    fontSize: 11,
  },
  copyrightText: {
    color: COLORS.text.muted,
    fontSize: 10,
    marginTop: 4,
  },
});
