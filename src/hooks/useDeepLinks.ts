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

        if (segments[0] === 'read' && segments[1]) {
          const page = params.get('page');
          navigate(`/book/${segments[1]}/read${page ? `?page=${page}` : ''}`);
        } else if (segments[0] === 'book' && segments[1]) {
          const page = params.get('page');
          if (page) {
            navigate(`/book/${segments[1]}/read?page=${page}`);
          } else {
            navigate(`/book/${segments[1]}`);
          }
        } else if ((segments[0] === 'quote' || segments[0] === 'quotes') && segments[1]) {
          navigate(`/quotes/${segments[1]}`);
        } else if (segments[0] === 'downloads') {
          navigate('/downloads');
        }
      } catch {
        // malformed deep link — ignore
      }
    };

    let urlSub: { remove: () => void } | undefined;
    let backSub: { remove: () => void } | undefined;

    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const launchUrl = await App.getLaunchUrl();
        handleUrl(launchUrl?.url);
        urlSub = await App.addListener('appUrlOpen', (data: { url: string }) => handleUrl(data.url));

        // Handle native Android hardware back button
        backSub = await App.addListener('backButton', ({ canGoBack }) => {
          if (window.location.pathname !== '/' && window.location.pathname !== '/home') {
            navigate(-1);
          } else {
            App.exitApp();
          }
        });
      } catch {
        // @capacitor/app not available — ignore
      }
    })();

    return () => {
      urlSub?.remove();
      backSub?.remove();
    };
  }, [navigate]);
}
