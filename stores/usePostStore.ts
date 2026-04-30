import { create } from 'zustand';
import { Post, PostComment, PostReaction, ReactionEmoji, Profile } from '../constants/types';
import { supabase } from '../lib/supabase';
import {
  PostRow, PostReactionRow, PostCommentRow,
  postFromRow, reactionFromRow, commentFromRow,
} from '../lib/db';

interface PostStore {
  posts: Post[];
  loaded: boolean;

  loadFeed: () => Promise<void>;
  reset: () => void;

  toggleReaction: (postId: string, emoji: ReactionEmoji, myUserId: string) => Promise<void>;
  addComment: (postId: string, body: string, profilesByHandle: Map<string, Profile>) => Promise<PostComment | null>;
  deleteComment: (commentId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;

  getPost: (id: string) => Post | undefined;
  getPostByMatchId: (matchId: string) => Post | undefined;
}

const HANDLE_RE = /@([a-zA-Z0-9_]+)/g;

// Extrai @handles de um texto e resolve via map handle→profile.
// Retorna lista única de profile IDs (sem duplicatas, sem auto-mention).
export function resolveMentions(body: string, profilesByHandle: Map<string, Profile>, selfId?: string): string[] {
  const ids = new Set<string>();
  for (const match of body.matchAll(HANDLE_RE)) {
    const handle = match[1].toLowerCase();
    const profile = profilesByHandle.get(handle);
    if (profile && profile.id !== selfId) ids.add(profile.id);
  }
  return Array.from(ids);
}

export const usePostStore = create<PostStore>()((set, get) => ({
  posts: [],
  loaded: false,

  loadFeed: async () => {
    // Pega posts mais recentes (limite generoso pra MVP). Reactions/comments
    // de todos eles em parallel — feed é global e RLS já é open pra authed.
    const { data: postsData, error: postsErr } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (postsErr) {
      console.error('[posts] loadFeed posts', postsErr);
      set({ loaded: true });
      return;
    }

    const rows = (postsData ?? []) as PostRow[];
    const posts = rows.map(postFromRow);
    const ids = posts.map(p => p.id);

    if (ids.length === 0) {
      set({ posts: [], loaded: true });
      return;
    }

    const [reactionsRes, commentsRes] = await Promise.all([
      supabase.from('post_reactions').select('*').in('post_id', ids),
      supabase.from('post_comments').select('*').in('post_id', ids).order('created_at', { ascending: true }),
    ]);

    if (reactionsRes.error) console.error('[posts] loadFeed reactions', reactionsRes.error);
    if (commentsRes.error) console.error('[posts] loadFeed comments', commentsRes.error);

    const reactionsByPost = new Map<string, PostReaction[]>();
    for (const r of (reactionsRes.data ?? []) as PostReactionRow[]) {
      const reaction = reactionFromRow(r);
      const arr = reactionsByPost.get(reaction.postId) ?? [];
      arr.push(reaction);
      reactionsByPost.set(reaction.postId, arr);
    }

    const commentsByPost = new Map<string, PostComment[]>();
    for (const c of (commentsRes.data ?? []) as PostCommentRow[]) {
      const comment = commentFromRow(c);
      const arr = commentsByPost.get(comment.postId) ?? [];
      arr.push(comment);
      commentsByPost.set(comment.postId, arr);
    }

    const hydrated = posts.map(p => ({
      ...p,
      reactions: reactionsByPost.get(p.id) ?? [],
      comments: commentsByPost.get(p.id) ?? [],
    }));

    set({ posts: hydrated, loaded: true });
  },

  reset: () => set({ posts: [], loaded: false }),

  toggleReaction: async (postId, emoji, myUserId) => {
    const post = get().posts.find(p => p.id === postId);
    if (!post) return;

    const existing = post.reactions.find(r => r.userId === myUserId && r.emoji === emoji);

    if (existing) {
      // Optimistic remove
      set(s => ({
        posts: s.posts.map(p => p.id === postId
          ? { ...p, reactions: p.reactions.filter(r => r.id !== existing.id) }
          : p),
      }));
      const { error } = await supabase
        .from('post_reactions')
        .delete()
        .eq('id', existing.id);
      if (error) {
        console.error('[posts] toggleReaction delete', error);
        // Rollback
        set(s => ({
          posts: s.posts.map(p => p.id === postId
            ? { ...p, reactions: [...p.reactions, existing] }
            : p),
        }));
      }
    } else {
      const { data, error } = await supabase
        .from('post_reactions')
        .insert({ post_id: postId, user_id: myUserId, emoji })
        .select('*')
        .single();
      if (error || !data) {
        console.error('[posts] toggleReaction insert', error);
        return;
      }
      const reaction = reactionFromRow(data as PostReactionRow);
      set(s => ({
        posts: s.posts.map(p => p.id === postId
          ? { ...p, reactions: [...p.reactions, reaction] }
          : p),
      }));
    }
  },

  addComment: async (postId, body, profilesByHandle) => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return null;

    const trimmed = body.trim();
    if (!trimmed) return null;

    const mentions = resolveMentions(trimmed, profilesByHandle, userId);

    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        author_id: userId,
        body: trimmed,
        mentions,
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('[posts] addComment', error);
      return null;
    }

    const comment = commentFromRow(data as PostCommentRow);
    set(s => ({
      posts: s.posts.map(p => p.id === postId
        ? { ...p, comments: [...p.comments, comment] }
        : p),
    }));
    return comment;
  },

  deleteComment: async (commentId) => {
    const { error } = await supabase.from('post_comments').delete().eq('id', commentId);
    if (error) {
      console.error('[posts] deleteComment', error);
      return;
    }
    set(s => ({
      posts: s.posts.map(p => ({
        ...p,
        comments: p.comments.filter(c => c.id !== commentId),
      })),
    }));
  },

  deletePost: async (postId) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) {
      console.error('[posts] deletePost', error);
      return;
    }
    set(s => ({ posts: s.posts.filter(p => p.id !== postId) }));
  },

  getPost: (id) => get().posts.find(p => p.id === id),
  getPostByMatchId: (matchId) => get().posts.find(p => p.matchId === matchId),
}));
