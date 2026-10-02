import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import realLibraryCatalog from '@/lib/realLibraryCatalog.json';
import type { Book } from '@/hooks/useBooks';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const GUEST_EMAIL = 'library_guest_reader@qahwalibrary.app';
const GUEST_PASS = 'QahwaReader2026!Public';

let guestClientPromise: Promise<SupabaseClient<Database>> | null = null;

export const initialRealBooks: Book[] = realLibraryCatalog as unknown as Book[];

/**
 * Provides an authenticated Supabase client for guest/anonymous readers
 * to browse the real library catalog (all 170+ books) without requiring them to sign in.
 */
export async function getPublicReaderClient(): Promise<SupabaseClient<Database>> {
  if (guestClientPromise) {
    return guestClientPromise;
  }

  guestClientPromise = (async () => {
    try {
      // Create isolated client for guest session
      const authClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: true,
        },
      });

      const { data, error } = await authClient.auth.signInWithPassword({
        email: GUEST_EMAIL,
        password: GUEST_PASS,
      });

      if (!error && data?.session?.access_token) {
        return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          auth: {
            persistSession: false,
          },
          global: {
            headers: {
              Authorization: `Bearer ${data.session.access_token}`,
            },
          },
        });
      }
    } catch (e) {
      console.warn('Could not establish live guest reader session:', e);
    }

    // Default fallback to base anon client
    return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: false,
      },
    });
  })();

  return guestClientPromise;
}
