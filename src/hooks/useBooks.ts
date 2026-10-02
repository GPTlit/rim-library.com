import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getPublicReaderClient, initialRealBooks } from '@/integrations/supabase/guestClient';
import { searchBooksFuzzy, FuzzySearchResult } from '@/lib/fuzzySearch';

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string | null;
  category: string;
  categories: string[] | null;
  cover_url: string | null;
  cover_wide_url?: string | null;
  cover_tall_url?: string | null;
  file_url: string;
  file_type: string | null;
  page_count?: number | null;
  created_at: string;
  updated_at: string;
  is_premium?: boolean | null;
  premium_price?: number | null;
}

// Fallback to real library books (170 books in storage/database)
export const fallbackBooks: Book[] = initialRealBooks;

export const useBooks = () => {
  return useQuery({
    queryKey: ['books'],
    initialData: initialRealBooks,
    queryFn: async () => {
      try {
        // Try user session first
        const { data: userSession } = await supabase.auth.getSession();
        const client = userSession?.session ? supabase : await getPublicReaderClient();

        const { data, error } = await client
          .from('books')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as Book[];
        }
      } catch (err) {
        console.warn('Live fetch error, falling back to real library catalog:', err);
      }
      return initialRealBooks;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useBook = (id: string) => {
  const initialBook = initialRealBooks.find((b) => b.id === id);

  return useQuery({
    queryKey: ['book', id],
    initialData: initialBook || undefined,
    queryFn: async () => {
      try {
        const { data: userSession } = await supabase.auth.getSession();
        const client = userSession?.session ? supabase : await getPublicReaderClient();

        const { data, error } = await client
          .from('books')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          return data as Book;
        }
      } catch (err) {
        console.warn('Error fetching book by id:', err);
      }
      return initialRealBooks.find((b) => b.id === id) || null;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};

export const useBooksByCategory = (category: string) => {
  const initialCategoryBooks = initialRealBooks.filter(
    (b) => b.category === category || b.categories?.includes(category)
  );

  return useQuery({
    queryKey: ['books', 'category', category],
    initialData: initialCategoryBooks,
    queryFn: async () => {
      try {
        const { data: userSession } = await supabase.auth.getSession();
        const client = userSession?.session ? supabase : await getPublicReaderClient();

        const { data, error } = await client
          .from('books')
          .select('*')
          .or(`categories.cs.{"${category}"},category.eq.${category}`)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as Book[];
        }
      } catch (err) {
        console.warn('Error fetching books by category:', err);
      }
      return initialRealBooks.filter(
        (b) => b.category === category || b.categories?.includes(category)
      );
    },
    enabled: !!category,
    staleTime: 1000 * 60 * 5,
  });
};

export const useSearchBooks = (query: string) => {
  return useQuery<FuzzySearchResult>({
    queryKey: ['books', 'search', query],
    queryFn: async () => {
      let pool: Book[] = initialRealBooks;
      try {
        const { data: userSession } = await supabase.auth.getSession();
        const client = userSession?.session ? supabase : await getPublicReaderClient();

        const { data, error } = await client
          .from('books')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          pool = data as Book[];
        }
      } catch (err) {
        console.warn('Error fetching live books pool for search:', err);
      }

      return searchBooksFuzzy(pool, query);
    },
    enabled: query.trim().length > 0,
    staleTime: 1000 * 60 * 5,
  });
};
