import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// NOTE: the `quotes` / `quote_likes` / `quote_saves` tables are created by
// supabase/migrations/20261008185343_quotes.sql. Until the generated
// Supabase types are refreshed with that migration, we talk to them through
// an untyped client handle to avoid false compile errors.
const db = supabase as any;

export interface QuoteStyle {
  background: string; // preset id or css gradient/color value
  fontFamily: string;
  fontSize: number;
  align: 'right' | 'center' | 'left';
  verticalPosition: 'top' | 'center' | 'bottom';
  showBookMeta: boolean;
  textColor: string;
}

export interface QuoteAuthorProfile {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface Quote {
  id: string;
  book_id: string;
  user_id: string;
  text: string;
  comment: string | null;
  page: number | null;
  style: QuoteStyle;
  image_url: string | null;
  created_at: string;
  like_count: number;
  save_count: number;
  user_liked: boolean;
  user_saved: boolean;
  profile?: QuoteAuthorProfile | null;
}

const mapCounts = (row: any): { like_count: number; save_count: number } => ({
  like_count: Array.isArray(row.quote_likes) ? (row.quote_likes[0]?.count ?? 0) : 0,
  save_count: Array.isArray(row.quote_saves) ? (row.quote_saves[0]?.count ?? 0) : 0,
});

async function attachUserState(rows: any[], userId?: string | null) {
  const ids = rows.map((r) => r.id);
  let likedSet = new Set<string>();
  let savedSet = new Set<string>();
  if (userId && ids.length) {
    const [{ data: likes }, { data: saves }] = await Promise.all([
      db.from('quote_likes').select('quote_id').eq('user_id', userId).in('quote_id', ids),
      db.from('quote_saves').select('quote_id').eq('user_id', userId).in('quote_id', ids),
    ]);
    likedSet = new Set((likes ?? []).map((l: any) => l.quote_id));
    savedSet = new Set((saves ?? []).map((s: any) => s.quote_id));
  }

  let profiles: Record<string, QuoteAuthorProfile> = {};
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  if (userIds.length) {
    const { data: profileRows } = await supabase
      .from('user_profiles_public' as any)
      .select('user_id, username, display_name, avatar_url')
      .in('user_id', userIds);
    profiles = Object.fromEntries((profileRows ?? []).map((p: any) => [p.user_id, p]));
  }

  return rows.map((row) => ({
    id: row.id,
    book_id: row.book_id,
    user_id: row.user_id,
    text: row.text,
    comment: row.comment,
    page: row.page,
    style: row.style ?? {},
    image_url: row.image_url,
    created_at: row.created_at,
    ...mapCounts(row),
    user_liked: likedSet.has(row.id),
    user_saved: savedSet.has(row.id),
    profile: profiles[row.user_id] ?? null,
  })) as Quote[];
}

const SELECT_WITH_COUNTS = '*, quote_likes(count), quote_saves(count)';

export const useBookQuotes = (bookId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['quotes', 'book', bookId, user?.id],
    queryFn: async () => {
      if (!bookId) return [] as Quote[];
      const { data, error } = await db
        .from('quotes')
        .select(SELECT_WITH_COUNTS)
        .eq('book_id', bookId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return attachUserState(data ?? [], user?.id);
    },
    enabled: !!bookId,
  });
};

export const useQuote = (id?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['quotes', 'one', id, user?.id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await db
        .from('quotes')
        .select(SELECT_WITH_COUNTS)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const [mapped] = await attachUserState([data], user?.id);
      return mapped;
    },
    enabled: !!id,
  });
};

export const useCreateQuote = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      book_id: string;
      text: string;
      comment?: string | null;
      page?: number | null;
      style: QuoteStyle;
      image_url?: string | null;
    }) => {
      if (!user) throw new Error('Auth required');
      const { data, error } = await db
        .from('quotes')
        .insert({
          book_id: input.book_id,
          user_id: user.id,
          text: input.text,
          comment: input.comment ?? null,
          page: input.page ?? null,
          style: input.style,
          image_url: input.image_url ?? null,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (quote: any) => {
      qc.invalidateQueries({ queryKey: ['quotes', 'book', quote.book_id] });
    },
  });
};

export const useDeleteQuote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, bookId }: { id: string; bookId: string }) => {
      const { error } = await db.from('quotes').delete().eq('id', id);
      if (error) throw error;
      return bookId;
    },
    onSuccess: (bookId) => qc.invalidateQueries({ queryKey: ['quotes', 'book', bookId] }),
  });
};

export const useToggleQuoteLike = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ quoteId, liked }: { quoteId: string; liked: boolean }) => {
      if (!user) throw new Error('Auth required');
      if (liked) {
        const { error } = await db.from('quote_likes').delete().eq('quote_id', quoteId).eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await db.from('quote_likes').insert({ quote_id: quoteId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
  });
};

export const useToggleQuoteSave = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ quoteId, saved }: { quoteId: string; saved: boolean }) => {
      if (!user) throw new Error('Auth required');
      if (saved) {
        const { error } = await db.from('quote_saves').delete().eq('quote_id', quoteId).eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await db.from('quote_saves').insert({ quote_id: quoteId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
  });
};

export const uploadQuoteImage = async (blob: Blob, userId: string) => {
  const path = `quotes/${userId}/${crypto.randomUUID()}.png`;
  const { error } = await supabase.storage.from('covers').upload(path, blob, {
    upsert: true,
    contentType: 'image/png',
  });
  if (error) throw error;
  return supabase.storage.from('covers').getPublicUrl(path).data.publicUrl;
};
