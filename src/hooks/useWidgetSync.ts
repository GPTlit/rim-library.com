import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { QahwaNative, isQahwaNativeAvailable, type WidgetBook, type WidgetPayload } from '@/lib/qahwaNative';

const THROTTLE_MS = 30 * 60 * 1000;
const LAST_SYNC_KEY = 'qahwa-widget-last-sync';
const LAST_CONTINUE_KEY = 'qahwa-widget-last-continue';
const DEVICE_DOWNLOADS_KEY = 'qahwa-device-downloads';

const toWidgetBook = (b: any): WidgetBook => ({
  id: b.id,
  title: b.title,
  author: b.author ?? undefined,
  coverUrl: b.cover_url ?? b.coverUrl ?? undefined,
  description: b.description ?? undefined,
});

/** Builds and pushes the widget payload to the native side (Android only, throttled). */
export function useWidgetSync() {
  const { user } = useAuth();
  const continueBookIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isQahwaNativeAvailable()) return;

    const sync = async (force = false) => {
      try {
        const lastSync = Number(localStorage.getItem(LAST_SYNC_KEY) || 0);
        if (!force && Date.now() - lastSync < THROTTLE_MS) return;

        const signedIn = !!user;
        const payload: WidgetPayload = { signedIn, updatedAt: new Date().toISOString() };

        // 1. Featured & daily book
        try {
          const { data: featuredData } = await supabase
            .from('books')
            .select('id,title,author,cover_url,description')
            .eq('is_featured', true)
            .limit(1)
            .maybeSingle();

          const fallbackBook = featuredData || (await supabase.from('books').select('id,title,author,cover_url,description').limit(1).maybeSingle()).data;
          if (fallbackBook) {
            const b = toWidgetBook(fallbackBook);
            payload.dailyBook = { ...b, message: 'اقتراح اليوم من مكتبة القهوة' };
            payload.featured = b;
          }
        } catch {}

        // 2. Discover books
        try {
          const { data: discoverData } = await supabase
            .from('books')
            .select('id,title,author,cover_url,description')
            .limit(20);
          if (discoverData && discoverData.length > 0) {
            payload.discover = discoverData.map(toWidgetBook);
          }
        } catch {}

        // 3. Continue reading (try remote history if signed in, or local reading history)
        try {
          let foundContinue = false;
          if (signedIn) {
            const { data: historyData } = await supabase
              .from('reading_history')
              .select('book_id,current_page,books(id,title,author,cover_url,total_pages)')
              .eq('user_id', user!.id)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            const historyRow: any = historyData;
            if (historyRow?.books) {
              payload.continueReading = {
                ...toWidgetBook(historyRow.books),
                page: historyRow.current_page ?? 1,
                totalPages: historyRow.books.total_pages ?? undefined,
              };
              continueBookIdRef.current = historyRow.book_id;
              foundContinue = true;
            }
          }

          if (!foundContinue) {
            // Read from local storage
            const localHist = JSON.parse(localStorage.getItem('maktaba-mauritania-history') || '[]');
            if (Array.isArray(localHist) && localHist.length > 0) {
              const latest = localHist[0];
              const bookmarks = JSON.parse(localStorage.getItem('maktaba-mauritania-bookmarks') || '[]');
              const lastBm = Array.isArray(bookmarks) ? bookmarks.find((bm: any) => bm.bookId === latest.bookId) : null;
              payload.continueReading = {
                id: latest.bookId,
                title: latest.title,
                author: latest.author,
                coverUrl: latest.coverUrl,
                page: lastBm?.page || 1,
              };
              continueBookIdRef.current = latest.bookId;
            }
          }
        } catch {}

        // 4. Collection (device downloads & offline books)
        try {
          const raw = localStorage.getItem(DEVICE_DOWNLOADS_KEY);
          const downloads = raw ? JSON.parse(raw) : [];
          if (Array.isArray(downloads) && downloads.length > 0) {
            payload.collection = downloads.slice(0, 8).map((d: any) => ({
              id: d.bookId || d.id,
              title: d.title,
              author: d.author,
              coverUrl: d.coverUrl,
            }));
          }
        } catch {}

        // 5. Quote of the day (try book_quotes / quotes)
        try {
          const { data: bqData } = await (supabase as any)
            .from('book_quotes')
            .select('id,quote_text,book_id,books(title,author)')
            .order('created_at', { ascending: false })
            .limit(10);

          let quotesList = bqData || [];
          if (!quotesList.length) {
            const { data: qData } = await supabase
              .from('quotes')
              .select('id,text,book_id,books(title,author)')
              .order('created_at', { ascending: false })
              .limit(10);
            quotesList = qData || [];
          }

          if (quotesList.length > 0) {
            const dayIndex = new Date().getDate() % quotesList.length;
            const q: any = quotesList[dayIndex];
            payload.quote = {
              id: q.id,
              text: q.quote_text || q.text,
              bookId: q.book_id,
              bookTitle: q.books?.title ?? '',
              author: q.books?.author ?? undefined,
            };
          }
        } catch {}

        await QahwaNative.updateWidgets({ json: JSON.stringify(payload) });
        localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
        if (continueBookIdRef.current) {
          localStorage.setItem(LAST_CONTINUE_KEY, continueBookIdRef.current);
        }
      } catch {
        // best-effort; widgets just keep showing stale data
      }
    };

    sync(true);
    const interval = setInterval(() => sync(false), THROTTLE_MS);

    return () => clearInterval(interval);
  }, [user]);
}
