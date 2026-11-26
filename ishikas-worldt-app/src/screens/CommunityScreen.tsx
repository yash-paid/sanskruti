import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Send,
  Heart,
  Crown,
  Lock,
  Sparkles,
  Users,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../components/Header';
import { COLORS } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { ChatMessage } from '../types';

export const CommunityScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { messages, sendMessage, likeMessage, isVipUnlocked, user } = useApp();
  const [activeRoom, setActiveRoom] = useState<'public' | 'vip'>('public');
  const [inputText, setInputText] = useState<string>('');

  const roomMessages = messages.filter((m) => m.roomId === activeRoom);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(activeRoom, inputText);
    setInputText('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        onCartPress={() => navigation.navigate('Cart')}
        onProfilePress={() => navigation.navigate('Profile')}
      />

      {/* Room Tabs */}
      <View style={styles.roomTabs}>
        <TouchableOpacity
          style={[
            styles.roomTab,
            activeRoom === 'public' && styles.roomTabActive,
          ]}
          onPress={() => setActiveRoom('public')}
        >
          <Users size={14} color={activeRoom === 'public' ? '#fff' : COLORS.text.muted} />
          <Text
            style={[
              styles.roomTabText,
              activeRoom === 'public' && styles.roomTabTextActive,
            ]}
          >
            Public Creator Lounge
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roomTab,
            activeRoom === 'vip' && styles.vipRoomTabActive,
          ]}
          onPress={() => setActiveRoom('vip')}
        >
          {isVipUnlocked ? (
            <Crown size={14} color={activeRoom === 'vip' ? '#d4a853' : COLORS.text.muted} />
          ) : (
            <Lock size={14} color="#d4a853" />
          )}
          <Text
            style={[
              styles.roomTabText,
              activeRoom === 'vip' && styles.vipRoomTabTextActive,
            ]}
          >
            VIP Terrace Lounge 👑
          </Text>
        </TouchableOpacity>
      </View>

      {/* Locked VIP Overlay if Non-Member enters VIP Terrace */}
      {activeRoom === 'vip' && !isVipUnlocked ? (
        <View style={styles.vipLockedContainer}>
          <View style={styles.lockCircle}>
            <Lock size={32} color="#d4a853" />
          </View>
          <Text style={styles.lockTitle}>VIP Terrace Lounge is Locked 👑</Text>
          <Text style={styles.lockSub}>
            This exclusive lounge is reserved for VIP Army and Elite Circle members. Chat directly with Ishika and read exclusive script excerpts.
          </Text>
          <TouchableOpacity
            style={styles.unlockVipBtn}
            onPress={() => navigation.navigate('Membership')}
          >
            <Crown size={16} color="#000" />
            <Text style={styles.unlockVipBtnText}>
              UNLOCK WITH MEMBERSHIP (FROM ₹1)
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Messages Stream */}
          <FlatList
            data={roomMessages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.messageBubble,
                  item.isCreator && styles.creatorBubble,
                  item.isSelf && styles.selfBubble,
                ]}
              >
                {/* Sender Header */}
                <View style={styles.messageHeader}>
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                  <View style={styles.senderInfo}>
                    <View style={styles.senderNameRow}>
                      <Text
                        style={[
                          styles.senderName,
                          item.isCreator && { color: COLORS.rose.primary },
                        ]}
                      >
                        {item.sender}
                      </Text>
                      {item.badge && (
                        <View
                          style={[
                            styles.badgePill,
                            { backgroundColor: `${item.badgeColor || '#e91e8c'}22` },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              { color: item.badgeColor || '#e91e8c' },
                            ]}
                          >
                            {item.badge}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.timestamp}>{item.timestamp}</Text>
                  </View>

                  {/* Heart / Like button */}
                  <TouchableOpacity
                    style={styles.likeBtn}
                    onPress={() => likeMessage(item.id)}
                  >
                    <Heart
                      size={14}
                      color={item.likes ? COLORS.rose.primary : COLORS.text.muted}
                      fill={item.likes ? COLORS.rose.primary : 'none'}
                    />
                    {item.likes ? (
                      <Text style={styles.likesCount}>{item.likes}</Text>
                    ) : null}
                  </TouchableOpacity>
                </View>

                {/* Message Content */}
                <Text style={styles.messageText}>{item.content}</Text>
              </View>
            )}
          />

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder={`Message in ${
                activeRoom === 'vip' ? 'VIP Terrace' : 'Public Lounge'
              }...`}
              placeholderTextColor={COLORS.text.muted}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                !inputText.trim() && styles.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Send size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black.primary,
  },
  roomTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.black.card,
    padding: 6,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.black.border,
    gap: 6,
  },
  roomTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  roomTabActive: {
    backgroundColor: COLORS.rose.primary,
  },
  vipRoomTabActive: {
    backgroundColor: 'rgba(212, 168, 83, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.gold.primary,
  },
  roomTabText: {
    color: COLORS.text.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  roomTabTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
  vipRoomTabTextActive: {
    color: '#d4a853',
    fontWeight: '900',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 20,
    gap: 12,
  },
  messageBubble: {
    backgroundColor: COLORS.black.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.black.border,
  },
  creatorBubble: {
    borderColor: 'rgba(233, 30, 140, 0.4)',
    backgroundColor: '#140c14',
  },
  selfBubble: {
    borderColor: 'rgba(212, 168, 83, 0.3)',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.black.surface,
  },
  senderInfo: {
    flex: 1,
  },
  senderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  senderName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  timestamp: {
    color: COLORS.text.muted,
    fontSize: 9,
    marginTop: 1,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  likesCount: {
    color: COLORS.rose.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  messageText: {
    color: COLORS.text.primary,
    fontSize: 13,
    lineHeight: 18,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.black.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.black.border,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.black.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 13,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: COLORS.black.border,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.rose.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  vipLockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  lockCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 168, 83, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gold.primary,
  },
  lockTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  lockSub: {
    color: COLORS.text.secondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  unlockVipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.gold.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  unlockVipBtnText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
});
