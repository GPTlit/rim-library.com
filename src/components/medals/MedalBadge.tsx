import React from 'react';
import { Medal, formatReadingDuration, getLocalizedMedal } from '@/lib/medals';
import { Sparkles, BookOpen, Compass, Shield, Scroll, Sun, Lock, CheckCircle2, Crown, Gem, Star, Award } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface MedalBadgeProps {
  medal: Medal;
  unlocked: boolean;
  totalReadingSeconds: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetailsModal?: boolean;
}

export const MedalIcon: React.FC<{ iconName: Medal['iconName']; className?: string }> = ({
  iconName,
  className = 'h-6 w-6',
}) => {
  switch (iconName) {
    case 'spark':
      return <Sparkles className={className} />;
    case 'book':
      return <BookOpen className={className} />;
    case 'compass':
      return <Compass className={className} />;
    case 'shield':
      return <Shield className={className} />;
    case 'scroll':
      return <Scroll className={className} />;
    case 'sun':
      return <Sun className={className} />;
    case 'crown':
      return <Crown className={className} />;
    case 'gem':
      return <Gem className={className} />;
    case 'star':
      return <Star className={className} />;
    default:
      return <Award className={className} />;
  }
};

export const MedalBadge: React.FC<MedalBadgeProps> = ({
  medal: rawMedal,
  unlocked,
  totalReadingSeconds,
  className,
  size = 'md',
  showDetailsModal = true,
}) => {
  const { language, dir } = useLanguage();
  const [open, setOpen] = React.useState(false);
  const medal = React.useMemo(() => getLocalizedMedal(rawMedal, language), [rawMedal, language]);

  const prevIndex = React.useMemo(() => {
    // calculate progress for locked medal
    const medalsList = [
      { id: 'first-spark', req: 300 },
      { id: 'page-companion', req: 1800 },
      { id: 'knowledge-diver', req: 5400 },
      { id: 'chinguetti-guardian', req: 14400 },
      { id: 'mahdhara-sage', req: 28800 },
      { id: 'desert-sun', req: 54000 },
      { id: 'scholar-ascendant', req: 90000 },
      { id: 'master-of-codices', req: 180000 },
      { id: 'eternal-library-legend', req: 360000 },
    ];
    const idx = medalsList.findIndex((m) => m.id === medal.id);
    const prevReq = idx > 0 ? medalsList[idx - 1].req : 0;
    return prevReq;
  }, [medal.id]);

  const progressPercent = React.useMemo(() => {
    if (unlocked) return 100;
    const span = medal.requiredSeconds - prevIndex;
    const current = Math.max(0, totalReadingSeconds - prevIndex);
    return Math.min(99, Math.max(0, Math.round((current / span) * 100)));
  }, [unlocked, totalReadingSeconds, medal.requiredSeconds, prevIndex]);

  const secondsRemaining = Math.max(0, medal.requiredSeconds - totalReadingSeconds);

  // Size styling
  const sizeClasses = {
    sm: 'w-20 p-2 text-xs',
    md: 'w-28 sm:w-32 p-3 text-xs',
    lg: 'w-36 sm:w-44 p-4 text-sm',
  };

  const emblemSizes = {
    sm: 'h-10 w-10 text-base',
    md: 'h-16 w-16 text-xl',
    lg: 'h-24 w-24 text-3xl',
  };

  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-7 w-7',
    lg: 'h-10 w-10',
  };

  const collectedLabel = language === 'en' ? 'Unlocked ✓' : language === 'fr' ? 'Débloqué ✓' : 'تم الجمع ✓';
  const tierPrefix = language === 'en' ? `${medal.tierName} Medal` : language === 'fr' ? `Médaille ${medal.tierName}` : `وسام ${medal.tierName}`;
  const reqTimeLabel = language === 'en' ? 'Required Time:' : language === 'fr' ? 'Temps requis :' : 'الوقت المطلوب:';
  const statusLabel = language === 'en' ? 'Status:' : language === 'fr' ? 'Statut :' : 'حالة الجمع:';
  const unlockedStatus = language === 'en' ? 'Unlocked (In Collection)' : language === 'fr' ? 'Débloqué (Dans votre collection)' : 'مكتمل (في مجموعتك)';
  const inProgressStatus = language === 'en' ? `In Progress (${progressPercent}%)` : language === 'fr' ? `En cours (${progressPercent}%)` : `قيد التحصيل (${progressPercent}%)`;
  const remainingPrefix = language === 'en' ? 'Remaining ' : language === 'fr' ? 'Il reste ' : 'متبقي ';
  const remainingSuffix = language === 'en' ? ' of reading to unlock this badge' : language === 'fr' ? ' de lecture pour débloquer ce badge' : ' من القراءة للحصول على هذا الوسام';

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => showDetailsModal && setOpen(true)}
        onKeyDown={(e) => e.key === 'Enter' && showDetailsModal && setOpen(true)}
        className={cn(
          'group relative flex flex-col items-center text-center rounded-2xl transition-all duration-300 cursor-pointer select-none border',
          unlocked
            ? 'bg-card hover:-translate-y-1 hover:shadow-lg border-border'
            : 'bg-muted/40 border-dashed border-border/80 opacity-75 hover:opacity-100 hover:border-solid',
          sizeClasses[size],
          className
        )}
      >
        {/* Tier badge at top */}
        <span
          className={cn(
            'px-2 py-0.5 rounded-full text-[10px] font-bold border mb-2 uppercase tracking-wide',
            unlocked
              ? medal.colors.badgeBg
              : 'bg-muted text-muted-foreground border-border'
          )}
        >
          {medal.tierName}
        </span>

        {/* Medal Emblem Ring */}
        <div
          className={cn(
            'relative flex items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105',
            emblemSizes[size],
            unlocked
              ? cn('bg-gradient-to-br shadow-md', medal.colors.gradient, medal.colors.border, medal.colors.glow, 'text-white border-2')
              : 'bg-muted/80 text-muted-foreground border-2 border-muted-foreground/30 grayscale'
          )}
        >
          <MedalIcon iconName={medal.iconName} className={iconSizes[size]} />

          {/* Unlocked Checkmark or Lock Overlay */}
          {unlocked ? (
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          ) : (
            <div className="absolute -bottom-1 -right-1 bg-background border border-border text-muted-foreground rounded-full p-1 shadow-sm">
              <Lock className="h-3 w-3" />
            </div>
          )}
        </div>

        {/* Title */}
        <h4 className="mt-2.5 font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {medal.title}
        </h4>

        {/* Progress or status */}
        {unlocked ? (
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
            {collectedLabel}
          </span>
        ) : (
          <div className="w-full mt-1.5 space-y-1">
            <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground block text-center">
              {progressPercent}%
            </span>
          </div>
        )}
      </div>

      {/* Details Dialog */}
      {showDetailsModal && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className={cn("sm:max-w-md", dir === 'rtl' ? 'text-right' : 'text-left')}>
            <DialogHeader className={dir === 'rtl' ? 'text-right' : 'text-left'}>
              <div className="flex items-center justify-center mb-4">
                <div
                  className={cn(
                    'relative flex items-center justify-center rounded-full h-24 w-24 border-4 shadow-xl',
                    unlocked
                      ? cn('bg-gradient-to-br text-white', medal.colors.gradient, medal.colors.border, medal.colors.glow)
                      : 'bg-muted text-muted-foreground border-border/80 grayscale'
                  )}
                >
                  <MedalIcon iconName={medal.iconName} className="h-12 w-12" />
                  {unlocked ? (
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-1 shadow-md">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className="absolute -bottom-2 -right-2 bg-background border-2 border-border text-muted-foreground rounded-full p-1.5 shadow-md">
                      <Lock className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center space-y-1">
                <span
                  className={cn(
                    'inline-block px-3 py-1 rounded-full text-xs font-bold border mb-1',
                    unlocked ? medal.colors.badgeBg : 'bg-muted text-muted-foreground border-border'
                  )}
                >
                  {tierPrefix}
                </span>
                <DialogTitle className="text-xl font-bold text-foreground">
                  {medal.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {medal.tagline}
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {medal.description}
                </p>
              </div>

              <div className="p-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 text-center">
                <p className="text-xs italic text-primary font-serif">
                  «{medal.quote}»
                </p>
              </div>

              {/* Progress Tracker */}
              <div className="space-y-2 pt-1 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{reqTimeLabel}</span>
                  <span className="font-semibold text-foreground">
                    {formatReadingDuration(medal.requiredSeconds, language)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{statusLabel}</span>
                  <span
                    className={cn(
                      'font-bold',
                      unlocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    )}
                  >
                    {unlocked ? unlockedStatus : inProgressStatus}
                  </span>
                </div>

                {!unlocked && (
                  <div className="space-y-1.5 mt-2">
                    <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground text-center">
                      {remainingPrefix}
                      <strong className="text-foreground">
                        {formatReadingDuration(secondsRemaining, language)}
                      </strong>
                      {remainingSuffix}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
