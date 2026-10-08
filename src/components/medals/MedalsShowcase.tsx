import React, { useState } from 'react';
import { MEDALS, calculateMedalsProgress, formatReadingDuration, getLocalizedMedal } from '@/lib/medals';
import { MedalBadge, MedalIcon } from './MedalBadge';
import { Award, Sparkles, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface MedalsShowcaseProps {
  totalReadingSeconds: number;
  className?: string;
  showFilters?: boolean;
}

export const MedalsShowcase: React.FC<MedalsShowcaseProps> = ({
  totalReadingSeconds,
  className,
  showFilters = true,
}) => {
  const { language } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const progress = calculateMedalsProgress(totalReadingSeconds);

  const displayedMedals = MEDALS.filter((medal) => {
    const isUnlocked = progress.unlockedMedals.some((m) => m.id === medal.id);
    if (filter === 'unlocked') return isUnlocked;
    if (filter === 'locked') return !isUnlocked;
    return true;
  });

  const nextMedal = progress.nextMedal ? getLocalizedMedal(progress.nextMedal, language) : null;

  const nextTargetLabel = language === 'en' ? 'Next Goal Awaiting You' : language === 'fr' ? 'Prochain Objectif à Débloquer' : 'الوسام القادم في انتظارك';
  const progressPercentLabel = language === 'en' ? 'Progress' : language === 'fr' ? 'Progression' : 'نسبة التقدم';
  const remainingPrefix = language === 'en' ? 'Remaining ' : language === 'fr' ? 'Il reste ' : 'متبقي ';
  const remainingSuffix = language === 'en' ? ' to unlock and add to your collection' : language === 'fr' ? ' pour l\'ajouter à votre collection' : ' للحصول عليه وإضافته لمجموعتك';
  const completedTitle = language === 'en' ? 'Congratulations! You unlocked all reading honors! 🏆' : language === 'fr' ? 'Félicitations ! Vous avez débloqué toutes les médailles ! 🏆' : 'تهانينا! لقد جمعت كافة أوسمة القراءة الخالدة 🏆';
  const completedDesc = language === 'en' ? 'You have reached the legendary summit of scholarship and letters.' : language === 'fr' ? 'Vous avez atteint le sommet légendaire de la lecture et de la sagesse.' : 'أنت الآن في مصاف كبار علماء وأدباء أرض المنارة والرباط، حاملاً أسمى الأوسمة.';
  const myCollectionTitle = language === 'en' ? 'My Badges Collection' : language === 'fr' ? 'Ma Collection de Badges' : 'مجموعتي من الأوسمة';
  const ofTotalLabel = language === 'en' ? `of ${progress.totalCount}` : language === 'fr' ? `sur ${progress.totalCount}` : `من ${progress.totalCount}`;
  const filterAll = language === 'en' ? `All (${MEDALS.length})` : language === 'fr' ? `Tous (${MEDALS.length})` : `الكل (${MEDALS.length})`;
  const filterUnlocked = language === 'en' ? `Unlocked (${progress.unlockedCount})` : language === 'fr' ? `Débloqués (${progress.unlockedCount})` : `المكتسبة (${progress.unlockedCount})`;
  const filterLocked = language === 'en' ? `In Progress (${progress.lockedMedals.length})` : language === 'fr' ? `En cours (${progress.lockedMedals.length})` : `قيد التحصيل (${progress.lockedMedals.length})`;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Next Medal Target Banner */}
      {nextMedal ? (
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-background to-secondary/30 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md border',
                  nextMedal.colors.gradient,
                  nextMedal.colors.border
                )}
              >
                <MedalIcon iconName={nextMedal.iconName} className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> {nextTargetLabel}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] px-2 py-0.2 rounded-full font-bold border',
                      nextMedal.colors.badgeBg
                    )}
                  >
                    {nextMedal.tierName}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {nextMedal.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {remainingPrefix}{formatReadingDuration(progress.secondsRemainingToNext, language)}{remainingSuffix}
                </p>
              </div>
            </div>

            <div className="w-full sm:w-56 shrink-0 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{progressPercentLabel}</span>
                <span className="font-bold text-foreground">{progress.progressToNext}%</span>
              </div>
              <Progress value={progress.progressToNext} className="h-2.5" />
            </div>
          </div>
        </div>
      ) : (
        /* All Medals Completed celebration banner */
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/20 p-5 text-center shadow-sm">
          <Trophy className="h-10 w-10 text-amber-500 mx-auto mb-2 animate-bounce" />
          <h3 className="text-lg font-bold text-foreground">
            {completedTitle}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            {completedDesc}
          </p>
        </div>
      )}

      {/* Counter & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-foreground text-base">{myCollectionTitle}</h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {progress.unlockedCount} {ofTotalLabel}
          </span>
        </div>

        {showFilters && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-muted/60 p-1 rounded-xl border border-border">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                filter === 'all'
                  ? 'bg-background text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {filterAll}
            </button>
            <button
              onClick={() => setFilter('unlocked')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                filter === 'unlocked'
                  ? 'bg-background text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {filterUnlocked}
            </button>
            <button
              onClick={() => setFilter('locked')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                filter === 'locked'
                  ? 'bg-background text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {filterLocked}
            </button>
          </div>
        )}
      </div>

      {/* Medals Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {displayedMedals.map((medal) => {
          const isUnlocked = progress.unlockedMedals.some((m) => m.id === medal.id);
          return (
            <MedalBadge
              key={medal.id}
              medal={medal}
              unlocked={isUnlocked}
              totalReadingSeconds={totalReadingSeconds}
              className="w-full"
              size="md"
            />
          );
        })}
      </div>
    </div>
  );
};
