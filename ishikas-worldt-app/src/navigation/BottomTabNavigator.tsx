import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Home,
  Film,
  Crown,
  ShoppingBag,
  MessageSquare,
} from 'lucide-react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { VideoLibraryScreen } from '../screens/VideoLibraryScreen';
import { MembershipScreen } from '../screens/MembershipScreen';
import { StoreScreen } from '../screens/StoreScreen';
import { CommunityScreen } from '../screens/CommunityScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';

const Tab = createBottomTabNavigator();

export const BottomTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 12);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 56 + bottomPadding,
            paddingBottom: bottomPadding,
            paddingTop: 6,
          },
        ],
        tabBarActiveTintColor: COLORS.rose.primary,
        tabBarInactiveTintColor: COLORS.text.muted,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Home size={20} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tab.Screen
        name="Videos"
        component={VideoLibraryScreen}
        options={{
          tabBarLabel: 'Series',
          tabBarIcon: ({ color, size, focused }) => (
            <Film size={20} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tab.Screen
        name="Membership"
        component={MembershipScreen}
        options={{
          tabBarLabel: 'VIP Circle',
          tabBarIcon: ({ color, size, focused }) => (
            <Crown size={20} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tab.Screen
        name="Store"
        component={StoreScreen}
        options={{
          tabBarLabel: 'Store',
          tabBarIcon: ({ color, size, focused }) => (
            <ShoppingBag size={20} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          tabBarLabel: 'Community',
          tabBarIcon: ({ color, size, focused }) => (
            <MessageSquare size={20} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.black.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.black.border,
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
