import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions, Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font } from '../constants/theme';
import { useAuth } from '../lib/AuthContext';
import { useProfileStore } from '../stores/useProfileStore';
import { useMatchStore } from '../stores/useMatchStore';

const { width: SCREEN_W } = Dimensions.get('window');
const DRAWER_W = Math.min(320, SCREEN_W * 0.82);

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface Item {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  badge?: number;
}

export function DrawerMenu({ visible, onClose }: Props) {
  const slide = useRef(new Animated.Value(-DRAWER_W)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const { signOut } = useAuth();
  const me = useProfileStore(s => s.me);
  const matches = useMatchStore(s => s.matches);
  const pendingCount = me ? matches.filter(m => m.player2Id === me.id && m.status === 'pending').length : 0;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: visible ? 0 : -DRAWER_W,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: visible ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  const go = (path: string) => {
    onClose();
    setTimeout(() => router.push(path as any), 220);
  };

  const handleSignOut = async () => {
    onClose();
    try { await signOut(); } catch {}
  };

  const items: Item[] = [
    { icon: 'checkmark-done-circle-outline', label: 'Aprovações', onPress: () => go('/pending'), badge: pendingCount },
    { icon: 'time-outline',     label: 'Histórico de partidas', onPress: () => go('/history') },
    { icon: 'information-circle-outline', label: 'Sobre',           onPress: () => go('/about') },
    { icon: 'log-out-outline',  label: 'Sair',                  onPress: handleSignOut, destructive: true },
  ];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.drawer, { transform: [{ translateX: slide }] }]}>
        <View style={styles.header}>
          {me?.avatarUrl ? (
            <Image source={{ uri: me.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={styles.avatarInitial}>{(me?.name?.[0] ?? '?').toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.name}>{me?.name ?? 'Jogador'}</Text>
          {me?.handle && <Text style={styles.handle}>@{me.handle}</Text>}
        </View>

        <View style={styles.menu}>
          {items.map(it => (
            <TouchableOpacity key={it.label} style={styles.item} onPress={it.onPress}>
              <Ionicons
                name={it.icon}
                size={22}
                color={it.destructive ? Colors.red : Colors.text}
              />
              <Text style={[styles.itemLabel, it.destructive && { color: Colors.red }]}>
                {it.label}
              </Text>
              {it.badge && it.badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{it.badge}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000B0' },
  drawer: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: DRAWER_W,
    backgroundColor: Colors.surface,
    borderRightWidth: 1, borderRightColor: Colors.border,
  },
  header: {
    paddingTop: Spacing.xxl + 12, padding: Spacing.lg,
    gap: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarInitial: { fontSize: Font.xl, fontWeight: '900', color: Colors.bg },
  name: { fontSize: Font.lg, fontWeight: '900', color: Colors.text },
  handle: { fontSize: Font.sm, color: Colors.textSecondary, marginTop: -4 },
  menu: { padding: Spacing.sm, gap: 2 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: Radius.md,
  },
  itemLabel: { fontSize: Font.md, fontWeight: '700', color: Colors.text, flex: 1 },
  badge: {
    backgroundColor: Colors.orange, borderRadius: Radius.full,
    minWidth: 22, height: 22, paddingHorizontal: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: Font.xs, fontWeight: '900', color: Colors.bg },
});
