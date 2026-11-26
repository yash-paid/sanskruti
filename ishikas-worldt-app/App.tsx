import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AppProvider } from './src/context/AppContext';
import { RootStackNavigator } from './src/navigation/RootStackNavigator';
import { COLORS } from './src/theme/colors';

export default function App() {
  return (
    <SafeAreaProvider style={{ backgroundColor: COLORS.black.deep }}>
      <StatusBar style="light" />
      <AppProvider>
        <NavigationContainer
          theme={{
            dark: true,
            colors: {
              primary: COLORS.rose.primary,
              background: COLORS.black.primary,
              card: COLORS.black.card,
              text: COLORS.text.primary,
              border: COLORS.black.border,
              notification: COLORS.rose.primary,
            },
            fonts: {
              regular: { fontFamily: 'System', fontWeight: '400' },
              medium: { fontFamily: 'System', fontWeight: '500' },
              bold: { fontFamily: 'System', fontWeight: '700' },
              heavy: { fontFamily: 'System', fontWeight: '900' },
            },
          }}
        >
          <RootStackNavigator />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
