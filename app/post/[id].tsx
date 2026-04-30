import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Pressable, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radius, Font, SurfaceColors, SURFACE_LABELS } from '../../constants/theme';
import { usePostStore } from '../../stores/usePostStore';
import { useMatchStore } from '../../stores/useMatchStore';
import { useProfileStore } from '../../stores/useProfileStore';
import { Profile, ReactionEmoji, REACTION_EMOJIS, PostComment } from '../../constants/types';
import { MentionText } from '../../components/MentionText';

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

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const post = usePostStore(s => s.posts.find(p => p.id === id));
  const matches = useMatchStore(s => s.matches);
  const me = useProfileStore(s => s.me);
  const nearby = useProfileStore(s => s.nearby);
  const toggleReaction = usePostStore(s => s.toggleReaction);
  const addComment = usePostStore(s => s.addComment);
  const deleteComment = usePostStore(s => s.deleteComment);
  const deletePost = usePostStore(s => s.deletePost);

  const myId = me?.id ?? null;
  const inputRef = useRef<TextInput>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

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

  const match = post ? matches.find(m => m.id === post.matchId) : undefined;

  // Mention autocomplete: detecta o @token mais recente no texto e sugere
  // handles que começam com ele (até 5).
  const mentionSuggestions = useMemo(() => {
    const token = currentMentionToken(draft);
    if (token === null) return [];
    const lc = token.toLowerCase();
    const seen = new Set<string>();
    const out: Profile[] = [];
    for (const p of profilesMap.values()) {
      if (!p.handle) continue;
      const h = p.handle.toLowerCase();
      if (!h.startsWith(lc)) continue;
      if (seen.has(h)) continue;
      seen.add(h);
      out.push(p);
      if (out.length >= 5) break;
    }
    return out;
  }, [draft, profilesMap]);

  const handleReact = useCallback((emoji: ReactionEmoji) => {
    if (!post || !myId) return;
    Haptics.selectionAsync().catch(() => {});
    toggleReaction(post.id, emoji, myId);
  }, [post, myId, toggleReaction]);

  const handleSend = useCallback(async () => {
    if (!post || sending) return;
    const trimmed = draft.trim();
    if (!trimmed) return;
    setSending(true);
    const result = await addComment(post.id, trimmed, profilesByHandle);
    setSending(false);
    if (result) setDraft('');
  }, [draft, post, addComment, profilesByHandle, sending]);

  const handleDelete = useCallback(() => {
    if (!post) return;
    Alert.alert('Apagar post', 'Tem certeza? O post some pra todo mundo.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: async () => {
        await deletePost(post.id);
        router.back();
      } },
    ]);
  }, [post, deletePost]);

  const handleDeleteComment = useCallback((commentId: string) => {
    Alert.alert('Apagar comentário', undefined, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: () => deleteComment(commentId) },
    ]);
  }, [deleteComment]);

  const insertMention = useCallback((handle: string) => {
    setDraft(prev => replaceCurrentMention(prev, handle));
    inputRef.current?.focus();
  }, []);

  if (!post) {
    return (
      <View style={[styles.container, styles.centerEmpty]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.emptyTitle}>Post não encontrado</Text>
      </View>
    );
  }

  const author = profilesMap.get(post.authorId);
  const surfaceColor = match ? (SurfaceColors[match.surface] ?? Colors.textSecondary) : Colors.textSecondary;
  const winner = match?.winnerId ? profilesMap.get(match.winnerId) : undefined;
  const loser = match
    ? (match.winnerId === match.player1Id ? profilesMap.get(match.player2Id) : profilesMap.get(match.player1Id))
    : undefined;
  const scoreStr = match?.sets
    .map(s => (s.tiebreak ? `${s.p1}(${s.tiebreak.p1})-${s.p2}(${s.tiebreak.p2})` : `${s.p1}-${s.p2}`))
    .join('  ') ?? '';

  const reactionStats: Record<ReactionEmoji, { count: number; mine: boolean }> = {
    fire: { count: 0, mine: false },
    cry: { count: 0, mine: false },
    goat: { count: 0, mine: false },
  };
  for (const r of post.reactions) {
    reactionStats[r.emoji].count++;
    if (myId && r.userId === myId) reactionStats[r.emoji].mine = true;
  }

  const isMyPost = post.authorId === myId;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <Pressable
          style={styles.header}
          onPress={() => author && router.push(`/player/${author.id}` as any)}
        >
          <Avatar profile={author} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={styles.authorName}>{author?.name ?? 'Jogador'}</Text>
            {author?.handle && <Text style={styles.authorHandle}>@{author.handle}</Text>}
          </View>
          <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
          {isMyPost && (
            <TouchableOpacity onPress={handleDelete} style={styles.menuBtn}>
              <Ionicons name="trash-outline" size={18} color={Colors.red} />
            </TouchableOpacity>
          )}
        </Pressable>

        {/* Banner */}
        {match && (
          <Pressable
            style={styles.banner}
            onPress={() => router.push(`/match/${match.id}` as any)}
          >
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
              style={StyleSheet.absoluteFillObject}
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

        {/* Caption + meta */}
        {(post.caption || match?.location) && (
          <View style={styles.captionWrap}>
            {match?.location && (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
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

        {/* Reactions */}
        <View style={styles.reactionRow}>
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
        </View>

        {/* Comments */}
        <View style={styles.commentsHeader}>
          <Text style={styles.commentsTitle}>
            {post.comments.length} {post.comments.length === 1 ? 'comentário' : 'comentários'}
          </Text>
        </View>

        <View style={styles.commentsList}>
          {post.comments.length === 0 ? (
            <Text style={styles.emptyComments}>Seja o primeiro a comentar.</Text>
          ) : (
            post.comments.map(c => (
              <CommentRow
                key={c.id}
                comment={c}
                author={profilesMap.get(c.authorId)}
                profilesByHandle={profilesByHandle}
                isMine={c.authorId === myId}
                onDelete={() => handleDeleteComment(c.id)}
              />
            ))
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Mention autocomplete suggestions */}
      {mentionSuggestions.length > 0 && (
        <View style={styles.suggestions}>
          {mentionSuggestions.map(p => (
            <TouchableOpacity
              key={p.id}
              style={styles.suggestionRow}
              onPress={() => insertMention(p.handle!)}
            >
              <Avatar profile={p} size={28} />
              <View style={{ flex: 1 }}>
                <Text style={styles.suggestionName}>{p.name}</Text>
                <Text style={styles.suggestionHandle}>@{p.handle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Comment input */}
      <View style={styles.inputBar}>
        <Avatar profile={me ?? undefined} size={32} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Comentar… use @ pra mencionar"
          placeholderTextColor={Colors.textTertiary}
          value={draft}
          onChangeText={setDraft}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !draft.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!draft.trim() || sending}
        >
          <Ionicons
            name="send"
            size={18}
            color={draft.trim() ? Colors.bg : Colors.textTertiary}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function CommentRow({ comment, author, profilesByHandle, isMine, onDelete }: {
  comment: PostComment;
  author?: Profile;
  profilesByHandle: Map<string, Profile>;
  isMine: boolean;
  onDelete: () => void;
}) {
  return (
    <View style={styles.comment}>
      <Pressable onPress={() => author && router.push(`/player/${author.id}` as any)}>
        <Avatar profile={author} size={32} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <View style={styles.commentBubble}>
          <View style={styles.commentTopRow}>
            <Text style={styles.commentAuthor}>{author?.name ?? 'Anônimo'}</Text>
            {author?.handle && <Text style={styles.commentHandle}>@{author.handle}</Text>}
          </View>
          <MentionText
            body={comment.body}
            profilesByHandle={profilesByHandle}
            baseStyle={styles.commentBody}
          />
        </View>
        <View style={styles.commentMeta}>
          <Text style={styles.commentTime}>{timeAgo(comment.createdAt)}</Text>
          {isMine && (
            <TouchableOpacity onPress={onDelete}>
              <Text style={styles.commentDelete}>Apagar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// Encontra o @token sob o cursor (assumindo cursor no fim do texto, que é
// o caso comum em multiline com onChangeText).
function currentMentionToken(text: string): string | null {
  const m = text.match(/(?:^|\s)@([a-zA-Z0-9_]*)$/);
  return m ? m[1] : null;
}

function replaceCurrentMention(text: string, handle: string): string {
  return text.replace(/(^|\s)@([a-zA-Z0-9_]*)$/, `$1@${handle} `);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: Spacing.lg },

  centerEmpty: { alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyTitle: { fontSize: Font.lg, fontWeight: '800', color: Colors.text },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  authorName: { fontSize: Font.md, fontWeight: '800', color: Colors.text },
  authorHandle: { fontSize: Font.xs, color: Colors.textSecondary, marginTop: -2 },
  time: { fontSize: Font.xs, color: Colors.textSecondary, fontWeight: '600' },
  menuBtn: { padding: 6 },

  banner: { height: 240, position: 'relative', backgroundColor: Colors.surface },
  bannerImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
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
    fontSize: 10, fontWeight: '900', color: Colors.bg, letterSpacing: 1,
  },
  bannerScore: {
    fontSize: Font.xxxl, fontWeight: '900', color: Colors.text,
    letterSpacing: 1, textShadowColor: '#000', textShadowRadius: 6,
  },
  bannerHeadline: { fontSize: Font.md },
  bannerWinner: { color: Colors.accent, fontWeight: '900' },
  bannerVs: { color: Colors.textSecondary, fontWeight: '600' },
  bannerLoser: { color: Colors.textSecondary, fontWeight: '700' },

  captionWrap: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: Font.xs, color: Colors.textSecondary, fontWeight: '600' },
  caption: { fontSize: Font.md, color: Colors.text, lineHeight: 22 },

  reactionRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border,
  },
  reactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: 'transparent',
  },
  reactBtnActive: {
    backgroundColor: Colors.accent + '20',
    borderColor: Colors.accent + '60',
  },
  reactEmoji: { fontSize: 18 },
  reactCount: { fontSize: Font.sm, fontWeight: '700', color: Colors.textSecondary },
  reactCountActive: { color: Colors.accent },

  commentsHeader: {
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.xs,
  },
  commentsTitle: {
    fontSize: Font.xs, fontWeight: '800', color: Colors.textSecondary,
    letterSpacing: 1, textTransform: 'uppercase',
  },

  commentsList: { paddingHorizontal: Spacing.md, gap: Spacing.md, paddingTop: Spacing.sm },
  emptyComments: {
    fontSize: Font.sm, color: Colors.textSecondary,
    textAlign: 'center', paddingVertical: Spacing.lg,
  },

  comment: { flexDirection: 'row', gap: Spacing.sm },
  commentBubble: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.sm + 2,
    gap: 2,
  },
  commentTopRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  commentAuthor: { fontSize: Font.sm, fontWeight: '800', color: Colors.text },
  commentHandle: { fontSize: Font.xs, color: Colors.textSecondary },
  commentBody: { fontSize: Font.sm, color: Colors.text, lineHeight: 19 },
  commentMeta: { flexDirection: 'row', gap: Spacing.md, marginTop: 4, paddingHorizontal: 6 },
  commentTime: { fontSize: Font.xs, color: Colors.textSecondary, fontWeight: '600' },
  commentDelete: { fontSize: Font.xs, color: Colors.red, fontWeight: '700' },

  suggestions: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderColor: Colors.border,
    maxHeight: 200,
  },
  suggestionRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  suggestionName: { fontSize: Font.sm, fontWeight: '700', color: Colors.text },
  suggestionHandle: { fontSize: Font.xs, color: Colors.accent, fontWeight: '700' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    minHeight: 40, maxHeight: 120,
    color: Colors.text, fontSize: Font.md,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm + 2, paddingBottom: Spacing.sm + 2,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.card },
});
