import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { useMatchStore } from '../../stores/useMatchStore';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerMenu } from '../../components/DrawerMenu';

function LiveIndicator() {
  const live = useMatchStore(s => s.liveMatch);
  if (!live) return null;
  return <View style={styles.liveDot} />;
}

export default function TabLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const HamburgerBtn = () => (
    <TouchableOpacity onPress={() => setDrawerOpen(true)} style={styles.hamburger} accessibilityLabel="Menu">
      <Ionicons name="menu" size={26} color={Colors.text} />
    </TouchableOpacity>
  );

  return (
    <>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: Colors.bg },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
          headerLeft: () => <HamburgerBtn />,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
            height: 84,
            paddingBottom: 24,
          },
          tabBarActiveTintColor: Colors.accent,
          tabBarInactiveTintColor: Colors.textTertiary,
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Início',
            tabBarLabel: 'Início',
            tabBarIcon: ({ color, size }) => (
              <View>
                <Ionicons name="home" size={size} color={color} />
                <LiveIndicator />
              </View>
            ),
            headerTitle: 'TennisRaptor',
            headerTitleStyle: { fontWeight: '900', fontSize: 20, letterSpacing: -0.5 },
          }}
        />
        <Tabs.Screen
          name="players"
          options={{
            title: 'Jogadores',
            tabBarLabel: 'Jogadores',
            tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarLabel: 'Perfil',
            tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
          }}
        />
      </Tabs>

      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  liveDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.red,
  },
  hamburger: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
