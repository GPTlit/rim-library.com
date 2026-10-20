import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBooks } from '@/hooks/useBooks';
import { useFeaturedBookIds } from '@/hooks/useFeaturedBooks';
import { supabase } from '@/integrations/supabase/client';
import { QahwaNative, isQahwaNativeAvailable, type WidgetBook, type WidgetPayload } from '@/lib/qahwaNative';
import { readPosition, readingPercent, READING_STATE_EVENT } from '@/lib/readerState';
import { loadDeviceDownloads } from '@/hooks/useOfflineBooks';
import { localPdfs } from '@/lib/localPdfs';
import { getTotalStoredReadingSeconds } from '@/lib/storage';

/** Share the real reader state; catalog refreshes reuse the existing query cache. */
export function useWidgetSync() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { data: books = [] } = useBooks();
  const { data: featuredIds = [] } = useFeaturedBookIds();
  useEffect(() => {
    if (!isQahwaNativeAvailable()) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let quote: WidgetPayload['quote'];
    const toBook = (b: typeof books[number]): WidgetBook => ({ id: b.id, title: b.title, author: b.author, coverUrl: b.cover_url || undefined });
    const push = async () => {
      if (stopped) return;
      const position = user ? readPosition() : null;
      const featured = books.find(b => featuredIds.includes(b.id)) || books[0];
      const payload: WidgetPayload = {
        signedIn: !!user, language, updatedAt: new Date().toISOString(),
        discover: books.slice(0, 20).map(toBook),
        dailyBook: featured ? toBook(featured) : undefined,
        featured: featured ? toBook(featured) : undefined,
        continueReading: position || undefined,
        lastReadAt: position?.updatedAt,
        progress: position ? readingPercent(position.page, position.totalPages) : 1,
        readingSeconds: user ? getTotalStoredReadingSeconds() : 0,
        collection: user ? [...loadDeviceDownloads().map(d => ({ id: d.bookId, title: d.title, author: d.author, coverUrl: d.coverUrl })),
          ...localPdfs().map(d => ({ id: d.id, title: d.title }))].slice(0, 12) : [],
        quote,
      };
      try { await QahwaNative.updateWidgets({ json: JSON.stringify(payload) }); } catch { /* native best effort */ }
    };
    const onReading = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void push(), 1000);
    };
    void push();
    // Quote retrieval is optional and never delays real reading-position updates.
    if (user) void (async () => {
      const { data } = await (supabase as any).from('quotes').select('id,text,book_id,books(title,author)').order('created_at', { ascending: false }).limit(10);
      if (stopped || !data?.length) return;
      const q = data[Math.floor(Date.now() / 86400000) % data.length];
      quote = { id: q.id, text: q.text, bookId: q.book_id, bookTitle: q.books?.title || '', author: q.books?.author };
      void push();
    })();
    window.addEventListener(READING_STATE_EVENT, onReading);
    const interval = setInterval(() => void push(), 15 * 60 * 1000);
    return () => { stopped = true; clearInterval(interval); if (timer) clearTimeout(timer); window.removeEventListener(READING_STATE_EVENT, onReading); };
  }, [user, language, books, featuredIds]);
}
