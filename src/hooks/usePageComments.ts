import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

export interface PageComment {
  id: string;
  book_id: string;
  user_id: string;
  content: string;
  cleanText: string;
  page: number;
  created_at: string;
  parent_id: string | null;
  likes_count: number;
  user_liked: boolean;
  author?: {
    display_name?: string;
    username?: string;
    avatar_url?: string;
    verified?: boolean;
  };
}

// Helper to parse page number from comment content
export const parseCommentPage = (raw: string): { page: number | null; text: string } => {
  if (!raw) return { page: null, text: '' };

  // Try JSON format { page: 3, text: '...' }
  if (raw.startsWith('{') && raw.includes('"page"')) {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed.page === 'number') {
        return { page: parsed.page, text: parsed.text || '' };
      }
    } catch {
      // fallback
    }
  }

  // Try [p:12] format or [صفحة 12]
  const tagMatch = raw.match(/^\[(?:p|صفحة|page):(\d+)\]\s*([\s\S]*)$/i);
  if (tagMatch) {
    const pNum = parseInt(tagMatch[1], 10);
    return { page: isNaN(pNum) ? null : pNum, text: tagMatch[2] };
  }

  return { page: null, text: raw };
};

export const usePageComments = (bookId: string, currentPage?: number) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: rawComments = [], isLoading } = useQuery({
    queryKey: ['book_all_comments', bookId],
    queryFn: async () => {
      if (!bookId) return [];

      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('book_id', bookId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching book comments:', error);
        return [];
      }

      // Fetch user profiles for all unique user_ids
      const userIds = Array.from(new Set((data || []).map((c) => c.user_id).filter(Boolean)));
      const profilesMap = new Map<string, any>();

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, username, display_name, avatar_url, verified')
          .in('user_id', userIds);

        (profiles || []).forEach((p) => {
          profilesMap.set(p.user_id, p);
        });
      }

      // Fetch likes count & user liked status
      const commentsWithMeta = await Promise.all(
        (data || []).map(async (comment) => {
          const { count } = await supabase
            .from('comment_likes')
            .select('*', { count: 'exact', head: true })
            .eq('comment_id', comment.id);

          let userLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from('comment_likes')
              .select('id')
              .eq('comment_id', comment.id)
              .eq('user_id', user.id)
              .maybeSingle();
            userLiked = !!likeData;
          }

          const parsed = parseCommentPage(comment.content);

          return {
            ...comment,
            cleanText: parsed.text || comment.content,
            page: parsed.page ?? 1, // default to page 1 if not tagged
            likes_count: count || 0,
            user_liked: userLiked,
            author: profilesMap.get(comment.user_id) || {
              display_name: 'قارئ',
              username: 'reader',
            },
          } as PageComment;
        })
      );

      return commentsWithMeta;
    },
    enabled: !!bookId,
    staleTime: 1000 * 30, // 30s cache
  });

  // Map of page number -> count of comments on that page
  const pageCommentsCountMap = useMemo(() => {
    const map = new Map<number, number>();
    rawComments.forEach((c) => {
      const p = c.page;
      map.set(p, (map.get(p) || 0) + 1);
    });
    return map;
  }, [rawComments]);

  // Comments for the specific page
  const pageComments = useMemo(() => {
    if (currentPage === undefined) return rawComments;
    return rawComments.filter((c) => c.page === currentPage);
  }, [rawComments, currentPage]);

  // Mutation to add a public page comment
  const addPageCommentMutation = useMutation({
    mutationFn: async ({ page, text }: { page: number; text: string }) => {
      if (!user) throw new Error('Must be logged in');
      const taggedContent = `[p:${page}] ${text.trim()}`;

      const { data, error } = await supabase
        .from('comments')
        .insert({
          book_id: bookId,
          user_id: user.id,
          content: taggedContent,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book_all_comments', bookId] });
      queryClient.invalidateQueries({ queryKey: ['comments', bookId] });
    },
  });

  // Mutation to delete comment
  const deletePageCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book_all_comments', bookId] });
      queryClient.invalidateQueries({ queryKey: ['comments', bookId] });
    },
  });

  // Mutation to toggle like
  const toggleLikeMutation = useMutation({
    mutationFn: async ({ commentId, isLiked }: { commentId: string; isLiked: boolean }) => {
      if (!user) throw new Error('Must be logged in');
      if (isLiked) {
        await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id);
      } else {
        await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book_all_comments', bookId] });
    },
  });

  return {
    allComments: rawComments,
    pageComments,
    pageCommentsCountMap,
    isLoading,
    addPageComment: addPageCommentMutation.mutateAsync,
    isAdding: addPageCommentMutation.isPending,
    deletePageComment: deletePageCommentMutation.mutateAsync,
    toggleLike: toggleLikeMutation.mutateAsync,
  };
};
