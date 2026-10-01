import React, { useState } from 'react';
import { MEDALS, calculateMedalsProgress, formatReadingDurationArabic } from '@/lib/medals';
import { MedalBadge, MedalIcon } from './MedalBadge';
import { Award, Sparkles, Trophy, ChevronLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
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
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const progress = calculateMedalsProgress(totalReadingSeconds);

  const displayedMedals = MEDALS.filter((medal) => {
    const isUnlocked = progress.unlockedMedals.some((m) => m.id === medal.id);
    if (filter === 'unlocked') return isUnlocked;
    if (filter === 'locked') return !isUnlocked;
    return true;
  });

  return (
    <div className={cn('space-y-6', className)}>
      {/* Next Medal Target Banner */}
      {progress.nextMedal ? (
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-background to-secondary/30 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md border',
                  progress.nextMedal.colors.gradient,
                  progress.nextMedal.colors.border
                )}
              >
                <MedalIcon iconName={progress.nextMedal.iconName} className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> الوسام القادم في انتظارك
                  </span>
                  <span
                    className={cn(
                      'text-[10px] px-2 py-0.2 rounded-full font-bold border',
                      progress.nextMedal.colors.badgeBg
                    )}
                  >
                    {progress.nextMedal.tierName}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {progress.nextMedal.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  متبقي {formatReadingDurationArabic(progress.secondsRemainingToNext)} للحصول عليه وإضافته لمجموعتك
                </p>
              </div>
            </div>

            <div className="w-full sm:w-56 shrink-0 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">نسبة التقدم</span>
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
            تهانينا! لقد جمعت كافة أوسمة القراءة الخالدة 🏆
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            أنت الآن في مصاف كبار علماء وأدباء أرض المنارة والرباط، حاملاً أسمى الأوسمة.
          </p>
        </div>
      )}

      {/* Counter & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-foreground text-base">مجموعتي من الأوسمة</h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {progress.unlockedCount} من {progress.totalCount}
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
              الكل ({MEDALS.length})
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
              المكتسبة ({progress.unlockedCount})
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
              قيد التحصيل ({progress.lockedMedals.length})
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
