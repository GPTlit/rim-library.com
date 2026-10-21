import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { QuoteStyle } from '@/hooks/useQuotes';

export interface QuoteStory {
  id: string;
  user_id: string;
  book_id: string | null;
  text: string;
  image_url: string | null;
  style: QuoteStyle;
  archived: boolean;
  expires_at: string;
  created_at: string;
}

const isLive = (s: QuoteStory) => s.archived || new Date(s.expires_at).getTime() > Date.now();

/** Active (live or archived) quote stories for a profile. */
export const useActiveQuoteStories = (userId?: string) => {
  return useQuery({
    queryKey: ['quote-stories', 'active', userId],
    queryFn: async () => {
      if (!userId) return [] as QuoteStory[];
      const { data, error } = await supabase
        .from('quote_stories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ((data ?? []) as QuoteStory[]).filter(isLive);
    },
    enabled: !!userId,
    // Stories are time-sensitive: re-check after a minute, not cached forever
    staleTime: 60_000,
  });
};

export const useCreateQuoteStory = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      book_id?: string | null;
      text: string;
      image_url?: string | null;
      style?: QuoteStyle;
    }) => {
      if (!user) throw new Error('Auth required');
      const { data, error } = await supabase
        .from('quote_stories')
        .insert({
          user_id: user.id,
          book_id: input.book_id ?? null,
          text: input.text,
          image_url: input.image_url ?? null,
          style: (input.style ?? {}) as any,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data as QuoteStory;
    },
    onSuccess: (s) => qc.invalidateQueries({ queryKey: ['quote-stories', 'active', s.user_id] }),
  });
};

/** Archive a story so it never disappears after 24 hours. */
export const useArchiveQuoteStory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quote_stories').update({ archived: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quote-stories'] }),
  });
};

export const useDeleteQuoteStory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quote_stories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quote-stories'] }),
  });
};

export const quoteStoryHoursLeft = (s: QuoteStory) =>
  Math.max(0, Math.ceil((new Date(s.expires_at).getTime() - Date.now()) / 3_600_000));
