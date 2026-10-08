import React, { useEffect, useState } from 'react';
import { Medal, getLocalizedMedal } from '@/lib/medals';
import { MedalIcon } from './MedalBadge';
import { X, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface ReadingGoalNotchProps {
  medal: Medal | null;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export const ReadingGoalNotch: React.FC<ReadingGoalNotchProps> = ({
  medal: rawMedal,
  onDismiss,
  autoDismissMs = 5000,
}) => {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!rawMedal) {
      setVisible(false);
      return;
    }

    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 350);
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [rawMedal, autoDismissMs, onDismiss]);

  if (!rawMedal || !visible) return null;

  const medal = getLocalizedMedal(rawMedal, language);
  const tierName = medal.tierName;
  const goalTitle = medal.title;

  const headline = language === 'en'
    ? 'Goal Achieved!'
    : language === 'fr'
    ? 'Objectif Débloqué !'
    : 'إنجاز جديد مكتمل!';

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label={`${headline}: ${goalTitle}`}
      className="fixed top-2 sm:top-3 inset-x-0 z-[100] flex justify-center pointer-events-none px-3"
    >
      <div
        className={cn(
          'pointer-events-auto flex items-center gap-2.5 sm:gap-3 px-3.5 py-1.5 sm:py-2 rounded-full',
          'bg-background/95 dark:bg-card/95 backdrop-blur-xl border border-primary/40 shadow-2xl',
          'animate-in fade-in slide-in-from-top-4 duration-300 max-w-sm sm:max-w-md text-foreground ring-1 ring-black/5'
        )}
      >
        {/* Animated Medal Icon */}
        <div
          className={cn(
            'flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm ring-2 ring-white/20',
            'bg-gradient-to-br',
            medal.colors.gradient
          )}
        >
          <MedalIcon iconName={medal.iconName} className="h-4 w-4 animate-pulse" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-[10px] sm:text-[11px] font-bold text-primary flex items-center gap-1 uppercase tracking-wider">
              <Sparkles className="h-3 w-3 inline" />
              {headline}
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-medium">
              {tierName}
            </span>
          </div>
          <p className="text-xs sm:text-[13px] font-semibold text-foreground truncate mt-0.5">
            {goalTitle}
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            setTimeout(onDismiss, 200);
          }}
          className="shrink-0 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          aria-label={language === 'en' ? 'Dismiss' : language === 'fr' ? 'Fermer' : 'إغلاق'}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  );
};
