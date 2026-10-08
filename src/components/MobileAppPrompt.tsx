import { useEffect, useMemo, useState } from 'react';
import { X, Download, Smartphone, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBranding, useBrandingConfig } from '@/hooks/useBranding';
import { detectMobileOS, isRunningNative } from '@/lib/capacitorFeatures';

const DISMISS_KEY = 'qahwa-mobile-app-prompt-dismissed-until';
const DISMISS_DAYS = 7;

const isDismissed = (): boolean => {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() < Number(raw);
  } catch {
    return false;
  }
};

const setDismissed = () => {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000));
  } catch {
    /* noop */
  }
};

/** Builds a market:// deep link for Play Store listings, falling back to the https URL otherwise. */
const toAndroidIntentUrl = (url: string): string => {
  try {
    if (/play\.google\.com/i.test(url)) {
      const u = new URL(url);
      const id = u.searchParams.get('id');
      if (id) return `market://details?id=${id}`;
    }
  } catch {
    /* fall through */
  }
  return url;
};

export const MobileAppPrompt = () => {
  const { t } = useLanguage();
  const { data: branding } = useBrandingConfig();
  const { logoUrl } = useBranding();
  const [visible, setVisible] = useState(false);

  const os = useMemo(() => detectMobileOS(), []);

  useEffect(() => {
    if (isRunningNative()) return; // never show inside the installed native app
    if (os === 'other') return; // only Android/iOS browsers
    if (isDismissed()) return;

    const appUrl = os === 'android' ? branding?.androidAppUrl : branding?.iosAppUrl;
    if (!appUrl) return; // only show when the matching store listing is configured

    setVisible(true);
  }, [os, branding?.androidAppUrl, branding?.iosAppUrl]);

  if (!visible) return null;

  const appUrl = os === 'android' ? branding?.androidAppUrl : branding?.iosAppUrl;
  if (!appUrl) return null;

  const href = os === 'android' ? toAndroidIntentUrl(appUrl) : appUrl;

  const handleDismiss = () => {
    setDismissed();
    setVisible(false);
  };

  const handleOpenStore = () => {
    try {
      window.location.href = href;
    } catch {
      window.open(appUrl, '_blank', 'noopener');
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] animate-fade-in-up">
      {/* Backdrop */}
      <div className="absolute inset-0 -z-10 bg-black/30" onClick={handleDismiss} />
      <div className="relative mx-auto max-w-lg rounded-t-2xl border border-border bg-card shadow-2xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] font-tajawal">
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3 end-3 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label={t('close')}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0 border border-border bg-secondary">
            <img src={logoUrl} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1 pe-6">
            <h3 className="font-bold text-foreground text-base flex items-center gap-1.5">
              <Smartphone className="h-4 w-4 text-primary" />
              {t('downloadToPhone')}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{t('downloadToPhoneDesc')}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Button variant="gold" className="gap-2 flex-1 min-w-[180px]" onClick={handleOpenStore}>
            <Download className="h-4 w-4" />
            {os === 'android' ? t('downloadOnAndroid') : t('downloadOnIOS')}
          </Button>
          {branding?.storeUrl && (
            <a href={branding.storeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                {t('visitStore')}
              </Button>
            </a>
          )}
          <Button variant="ghost" onClick={handleDismiss}>
            {t('maybeLater')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileAppPrompt;
