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

        if (signedIn) {
          const [featuredRes, historyRes, discoverRes, quoteRes] = await Promise.all([
            supabase.from('books').select('id,title,author,cover_url,description').eq('is_featured', true).limit(1).maybeSingle(),
            supabase
              .from('reading_history')
              .select('book_id,current_page,books(id,title,author,cover_url,total_pages)')
              .eq('user_id', user!.id)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase.from('books').select('id,title,author,cover_url,description').limit(20),
            supabase.from('quotes').select('id,text,book_id,books(title,author)').order('created_at', { ascending: false }).limit(10),
          ]);

          if (featuredRes.data) {
            const b = toWidgetBook(featuredRes.data);
            payload.dailyBook = { ...b, message: 'اقتراح اليوم من قهوة' };
            payload.featured = b;
          }

          const historyRow: any = historyRes.data;
          if (historyRow?.books) {
            payload.continueReading = {
              ...toWidgetBook(historyRow.books),
              page: historyRow.current_page ?? 0,
              totalPages: historyRow.books.total_pages ?? undefined,
            };
            continueBookIdRef.current = historyRow.book_id;
          }

          if (discoverRes.data) {
            payload.discover = discoverRes.data.map(toWidgetBook);
          }

          // "Collection" = offline/downloaded books on this device.
          try {
            const raw = localStorage.getItem(DEVICE_DOWNLOADS_KEY);
            const downloads = raw ? JSON.parse(raw) : [];
            if (Array.isArray(downloads) && downloads.length > 0) {
              payload.collection = downloads.slice(0, 8).map((d: any) => ({
                id: d.id,
                title: d.title,
                author: d.author,
                coverUrl: d.coverUrl,
              }));
            }
          } catch {
            // ignore malformed local cache
          }

          const quotesList: any[] = quoteRes.data || [];
          if (quotesList.length > 0) {
            const dayIndex = new Date().getDate() % quotesList.length;
            const q = quotesList[dayIndex];
            payload.quote = {
              id: q.id,
              text: q.text,
              bookId: q.book_id,
              bookTitle: q.books?.title ?? '',
              author: q.books?.author ?? undefined,
            };
          }
        }

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
