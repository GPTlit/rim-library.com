import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

/**
 * Listens for qahwa:// deep links fired from home-screen widgets (and cold-start launch
 * URLs) and routes the in-app SPA accordingly. Android-only; no-ops on web/iOS.
 */
export function useDeepLinks() {
  const navigate = useNavigate();

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;

    const handleUrl = (rawUrl?: string | null) => {
      if (!rawUrl || !rawUrl.startsWith('qahwa://')) return;
      try {
        const withoutScheme = rawUrl.replace('qahwa://', '');
        const [pathPart, queryPart] = withoutScheme.split('?');
        const segments = pathPart.split('/').filter(Boolean);
        const params = new URLSearchParams(queryPart || '');

        if (segments[0] === 'book' && segments[1]) {
          const page = params.get('page');
          if (page) {
            navigate(`/book/${segments[1]}/read?page=${page}`);
          } else {
            navigate(`/book/${segments[1]}`);
          }
        } else if (segments[0] === 'quote' && segments[1]) {
          navigate(`/quotes/${segments[1]}`);
        } else if (segments[0] === 'downloads') {
          navigate('/downloads');
        }
      } catch {
        // malformed deep link — ignore
      }
    };

    let listenerHandle: { remove: () => void } | undefined;

    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const launchUrl = await App.getLaunchUrl();
        handleUrl(launchUrl?.url);
        const sub = await App.addListener('appUrlOpen', (data: { url: string }) => handleUrl(data.url));
        listenerHandle = sub;
      } catch {
        // @capacitor/app not available — ignore
      }
    })();

    return () => listenerHandle?.remove();
  }, [navigate]);
}
