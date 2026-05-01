import React, { useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Font } from '../../constants/theme';
import { useMatchStore } from '../../stores/useMatchStore';
import { useProfileStore } from '../../stores/useProfileStore';
import { usePostStore } from '../../stores/usePostStore';
import { PostCard } from '../../components/PostCard';
import { Profile, ReactionEmoji } from '../../constants/types';

export default function HomeScreen() {
  const matches = useMatchStore(s => s.matches);
  const me = useProfileStore(s => s.me);
  const nearby = useProfileStore(s => s.nearby);
  const posts = usePostStore(s => s.posts);
  const loadFeed = usePostStore(s => s.loadFeed);
  const toggleReaction = usePostStore(s => s.toggleReaction);

  const myId = me?.id ?? null;

  const profilesMap = useMemo(() => {
    const m = new Map<string, Profile>();
    if (me) m.set(me.id, me);
    for (const p of nearby) m.set(p.id, p);
    return m;
  }, [me, nearby]);

  const profilesByHandle = useMemo(() => {
    const m = new Map<string, Profile>();
    for (const p of profilesMap.values()) {
      if (p.handle) m.set(p.handle.toLowerCase(), p);
    }
    return m;
  }, [profilesMap]);

  const matchesById = useMemo(() => {
    const m = new Map<string, typeof matches[number]>();
    for (const match of matches) m.set(match.id, match);
    return m;
  }, [matches]);

  const pendingCount = useMemo(() => (
    myId ? matches.filter(m => m.player2Id === myId && m.status === 'pending').length : 0
  ), [matches, myId]);

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  }, [loadFeed]);

  // Recarrega feed sempre que voltar pra home (cobre confirmação de match em outra tela).
  useFocusEffect(useCallback(() => {
    loadFeed();
  }, [loadFeed]));

  const handleReact = useCallback((postId: string, emoji: ReactionEmoji) => {
    if (!myId) return;
    toggleReaction(postId, emoji, myId);
  }, [myId, toggleReaction]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.accent}
          colors={[Colors.accent]}
        />
      }
    >
      <LinearGradient colors={['#1A2400', '#0D0D0D']} style={styles.hero}>
      </LinearGradient>

      {pendingCount > 0 && (
        <TouchableOpacity
          style={styles.pendingBanner}
          onPress={() => router.push('/pending' as any)}
        >
          <Ionicons name="alert-circle" size={20} color={Colors.orange} />
          <Text style={styles.pendingText}>
            {pendingCount} {pendingCount === 1 ? 'partida pra aprovar' : 'partidas pra aprovar'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.orange} />
        </TouchableOpacity>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, styles.actionPrimary]} onPress={() => router.push('/match/new')}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.bg} />
          <Text style={[styles.actionLabel, styles.actionLabelPrimary]}>Registrar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/players')}>
          <Ionicons name="people-outline" size={20} color={Colors.text} />
          <Text style={styles.actionLabel}>Adversários</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/history')}>
          <Ionicons name="time-outline" size={20} color={Colors.text} />
          <Text style={styles.actionLabel}>Histórico</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.feedHeader}>
        <Text style={styles.feedTitle}>Feed</Text>
        <Text style={styles.feedSubtitle}>Partidas da galera</Text>
      </View>

      <View style={styles.feedList}>
        {posts.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="newspaper-outline" size={56} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>Feed vazio</Text>
            <Text style={styles.emptyText}>
              Quando você ou seus adversários confirmarem partidas, elas aparecem aqui.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/match/new')}>
              <Text style={styles.emptyBtnText}>REGISTRAR PARTIDA</Text>
            </TouchableOpacity>
          </View>
        ) : (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              match={matchesById.get(post.matchId)}
              profiles={profilesMap}
              profilesByHandle={profilesByHandle}
              myId={myId}
              onToggleReaction={(emoji) => handleReact(post.id, emoji)}
            />
          ))
        )}
      </View>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { gap: Spacing.md },

  hero: {
    padding: Spacing.lg, paddingTop: Spacing.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    borderBottomLeftRadius: Radius.xl, borderBottomRightRadius: Radius.xl,
  },
  greeting: { fontSize: Font.sm, color: Colors.textSecondary, fontWeight: '500' },
  heroName: { fontSize: Font.xxl, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 },

  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.orange + '20', borderRadius: Radius.md,
    marginHorizontal: Spacing.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.orange + '40',
  },
  pendingText: { flex: 1, color: Colors.orange, fontWeight: '800', fontSize: Font.sm, letterSpacing: 0.5 },

  actions: {
    flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.md,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
  },
  actionPrimary: { backgroundColor: Colors.accent },
  actionLabel: { fontSize: Font.xs, fontWeight: '700', color: Colors.text },
  actionLabelPrimary: { color: Colors.bg },

  feedHeader: {
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm,
    flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm,
  },
  feedTitle: { fontSize: Font.xl, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 },
  feedSubtitle: { fontSize: Font.xs, color: Colors.textSecondary, fontWeight: '600' },

  feedList: { paddingHorizontal: Spacing.md, gap: Spacing.md },

  empty: {
    alignItems: 'center', paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg, gap: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
  },
  emptyTitle: { fontSize: Font.lg, fontWeight: '800', color: Colors.text },
  emptyText: { fontSize: Font.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 19 },
  emptyBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2, marginTop: Spacing.sm,
  },
  emptyBtnText: { color: Colors.bg, fontWeight: '900', fontSize: Font.xs, letterSpacing: 1 },
});
