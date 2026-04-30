import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Spacing, Font, SurfaceColors, SURFACE_LABELS } from '../constants/theme';
import { Post, Profile, Match, ReactionEmoji, REACTION_EMOJIS } from '../constants/types';
import { MentionText } from './MentionText';

interface Props {
  post: Post;
  match?: Match;
  profiles: Map<string, Profile>;
  profilesByHandle: Map<string, Profile>;
  myId?: string | null;
  onToggleReaction: (emoji: ReactionEmoji) => void;
}

const REACTION_ORDER: ReactionEmoji[] = ['fire', 'cry', 'goat'];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function Avatar({ profile, size = 36 }: { profile?: Profile; size?: number }) {
  const r = size / 2;
  if (profile?.avatarUrl) {
    return <Image source={{ uri: profile.avatarUrl }} style={{ width: size, height: size, borderRadius: r }} />;
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: r,
      backgroundColor: profile?.avatarColor ?? Colors.textTertiary,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: size * 0.42, fontWeight: '900', color: Colors.bg }}>
        {profile?.name?.[0]?.toUpperCase() ?? '?'}
      </Text>
    </View>
  );
}

export function PostCard({ post, match, profiles, profilesByHandle, myId, onToggleReaction }: Props) {
  const author = profiles.get(post.authorId);
  const p1 = match ? profiles.get(match.player1Id) : undefined;
  const p2 = match ? profiles.get(match.player2Id) : undefined;
  const surfaceColor = match ? (SurfaceColors[match.surface] ?? Colors.textSecondary) : Colors.textSecondary;

  const winner = match?.winnerId ? profiles.get(match.winnerId) : undefined;
  const loser = match
    ? (match.winnerId === match.player1Id ? p2 : p1)
    : undefined;

  const scoreStr = match?.sets
    .map(s => (s.tiebreak ? `${s.p1}(${s.tiebreak.p1})-${s.p2}(${s.tiebreak.p2})` : `${s.p1}-${s.p2}`))
    .join('  ') ?? '';

  // Conta reactions por emoji + flag se eu reagi.
  const reactionStats = useMemo(() => {
    const counts: Record<ReactionEmoji, { count: number; mine: boolean }> = {
      fire: { count: 0, mine: false },
      cry: { count: 0, mine: false },
      goat: { count: 0, mine: false },
    };
    for (const r of post.reactions) {
      counts[r.emoji].count++;
      if (myId && r.userId === myId) counts[r.emoji].mine = true;
    }
    return counts;
  }, [post.reactions, myId]);

  const handleReact = (emoji: ReactionEmoji) => {
    Haptics.selectionAsync().catch(() => {});
    onToggleReaction(emoji);
  };

  const goPost = () => router.push(`/post/${post.id}` as any);

  return (
    <View style={styles.card}>
      {/* Header: author + tempo */}
      <Pressable
        style={styles.header}
        onPress={() => author && router.push(`/player/${author.id}` as any)}
      >
        <Avatar profile={author} />
        <View style={{ flex: 1 }}>
          <Text style={styles.authorName}>{author?.name ?? 'Jogador'}</Text>
          {author?.handle && <Text style={styles.authorHandle}>@{author.handle}</Text>}
        </View>
        <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
      </Pressable>

      {/* Banner com placar overlay */}
      {match && (
        <Pressable onPress={goPost} style={styles.banner}>
          {post.bannerUrl ? (
            <Image source={{ uri: post.bannerUrl }} style={styles.bannerImg} />
          ) : (
            <LinearGradient
              colors={[surfaceColor + 'CC', surfaceColor + '40', Colors.bg]}
              style={styles.bannerImg}
            />
          )}
          <LinearGradient
            colors={['transparent', '#000000DD']}
            style={styles.bannerOverlay}
          />
          <View style={styles.bannerContent}>
            <View style={[styles.surfaceTag, { backgroundColor: surfaceColor + 'E0' }]}>
              <Text style={styles.surfaceTagText}>{SURFACE_LABELS[match.surface]?.toUpperCase()}</Text>
            </View>
            <Text style={styles.bannerScore}>{scoreStr}</Text>
            {winner && loser && (
              <Text style={styles.bannerHeadline}>
                <Text style={styles.bannerWinner}>{winner.name}</Text>
                <Text style={styles.bannerVs}>  venceu  </Text>
                <Text style={styles.bannerLoser}>{loser.name}</Text>
              </Text>
            )}
          </View>
        </Pressable>
      )}

      {/* Caption + meta extra */}
      {(post.caption || match?.location) && (
        <View style={styles.captionWrap}>
          {match?.location && (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{match.location}</Text>
            </View>
          )}
          {post.caption && (
            <MentionText
              body={post.caption}
              profilesByHandle={profilesByHandle}
              baseStyle={styles.caption}
            />
          )}
        </View>
      )}

      {/* Reactions row */}
      <View style={styles.actionRow}>
        {REACTION_ORDER.map(emoji => {
          const stat = reactionStats[emoji];
          return (
            <TouchableOpacity
              key={emoji}
              style={[styles.reactBtn, stat.mine && styles.reactBtnActive]}
              onPress={() => handleReact(emoji)}
              activeOpacity={0.7}
            >
              <Text style={styles.reactEmoji}>{REACTION_EMOJIS[emoji]}</Text>
              {stat.count > 0 && (
                <Text style={[styles.reactCount, stat.mine && styles.reactCountActive]}>
                  {stat.count}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.commentBtn} onPress={goPost} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={18} color={Colors.textSecondary} />
          {post.comments.length > 0 && (
            <Text style={styles.commentCount}>{post.comments.length}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Preview do último comentário */}
      {post.comments.length > 0 && (() => {
        const last = post.comments[post.comments.length - 1];
        const commenter = profiles.get(last.authorId);
        return (
          <Pressable style={styles.commentPreview} onPress={goPost}>
            <Text style={styles.commentPreviewAuthor}>{commenter?.name ?? 'Anônimo'}: </Text>
            <MentionText
              body={last.body}
              profilesByHandle={profilesByHandle}
              baseStyle={styles.commentPreviewBody}
              numberOfLines={1}
            />
          </Pressable>
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md,
  },
  authorName: { fontSize: Font.md, fontWeight: '800', color: Colors.text },
  authorHandle: { fontSize: Font.xs, color: Colors.textSecondary, marginTop: -2 },
  time: { fontSize: Font.xs, color: Colors.textSecondary, fontWeight: '600' },

  banner: {
    height: 200,
    width: '100%',
    backgroundColor: Colors.bg,
    position: 'relative',
  },
  bannerImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  bannerOverlay: { ...StyleSheet.absoluteFillObject },
  bannerContent: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: Spacing.md, gap: 4,
  },
  surfaceTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full,
  },
  surfaceTagText: {
    fontSize: 10, fontWeight: '900',
    color: Colors.bg, letterSpacing: 1,
  },
  bannerScore: {
    fontSize: Font.xxl, fontWeight: '900', color: Colors.text,
    letterSpacing: 1, textShadowColor: '#000', textShadowRadius: 6,
  },
  bannerHeadline: { fontSize: Font.sm },
  bannerWinner: { color: Colors.accent, fontWeight: '900' },
  bannerVs: { color: Colors.textSecondary, fontWeight: '600' },
  bannerLoser: { color: Colors.textSecondary, fontWeight: '700' },

  captionWrap: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, gap: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: Font.xs, color: Colors.textSecondary, fontWeight: '600' },
  caption: { fontSize: Font.sm, color: Colors.text, lineHeight: 19 },

  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  reactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: 'transparent',
  },
  reactBtnActive: {
    backgroundColor: Colors.accent + '20',
    borderColor: Colors.accent + '60',
  },
  reactEmoji: { fontSize: 16 },
  reactCount: { fontSize: Font.xs, fontWeight: '700', color: Colors.textSecondary },
  reactCountActive: { color: Colors.accent },
  commentBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginLeft: 'auto',
    paddingHorizontal: 8, paddingVertical: 6,
  },
  commentCount: { fontSize: Font.xs, fontWeight: '700', color: Colors.textSecondary },

  commentPreview: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
  },
  commentPreviewAuthor: { fontSize: Font.xs, fontWeight: '800', color: Colors.text },
  commentPreviewBody: { fontSize: Font.xs, color: Colors.textSecondary, flex: 1 },
});
