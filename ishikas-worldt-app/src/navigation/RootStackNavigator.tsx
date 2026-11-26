import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabNavigator } from './BottomTabNavigator';
import { VideoDetailScreen } from '../screens/VideoDetailScreen';
import { VideoPlayerScreen } from '../screens/VideoPlayerScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { CartScreen } from '../screens/CartScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { WatchHistoryScreen } from '../screens/WatchHistoryScreen';
import { MyMembershipScreen } from '../screens/MyMembershipScreen';
import { MyOrdersScreen } from '../screens/MyOrdersScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { Video, Product } from '../types';

export type RootStackParamList = {
  MainTabs: undefined;
  VideoDetail: { video: Video };
  VideoPlayer: { video: Video; initialTimeSec?: number };
  ProductDetail: { product: Product };
  Cart: undefined;
  Profile: undefined;
  WatchHistory: undefined;
  MyMembership: undefined;
  MyOrders: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#0a0a0f' },
      }}
    >
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      <Stack.Screen name="VideoDetail" component={VideoDetailScreen} />
      <Stack.Screen
        name="VideoPlayer"
        component={VideoPlayerScreen}
        options={{
          animation: 'fade',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="WatchHistory" component={WatchHistoryScreen} />
      <Stack.Screen name="MyMembership" component={MyMembershipScreen} />
      <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
};
