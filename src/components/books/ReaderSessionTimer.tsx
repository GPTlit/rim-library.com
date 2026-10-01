import React from 'react';
import { Timer, Sparkles, Award, BookOpen, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MedalIcon } from '@/components/medals/MedalBadge';
import { formatReadingDurationArabic, MedalsProgressResult } from '@/lib/medals';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface ReaderSessionTimerProps {
  formattedSession: string;
  sessionSeconds: number;
  formattedTotalBook: string;
  totalBookSeconds: number;
  bookTitle?: string;
  medalsProgress: MedalsProgressResult;
  className?: string;
}

export const ReaderSessionTimer: React.FC<ReaderSessionTimerProps> = ({
  formattedSession,
  sessionSeconds,
  formattedTotalBook,
  totalBookSeconds,
  bookTitle,
  medalsProgress,
  className,
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/80 hover:bg-secondary border border-border text-foreground transition-colors cursor-pointer select-none text-xs font-mono font-medium',
            className
          )}
          title="عداد وقت القراءة للجلسة والكتاب - اضغط للتفاصيل والأوسمة"
          aria-label="عداد جلسة القراءة"
        >
          <Timer className="h-3.5 w-3.5 text-primary animate-pulse" />
          <span>{formattedSession}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-80 text-right font-tajawal p-4 shadow-xl border-border">
        <div className="space-y-3.5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h4 className="font-bold text-sm text-foreground">جلسة القراءة</h4>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              نشطة الآن
            </span>
          </div>

          {/* Time stats */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-muted/60 border border-border">
              <span className="text-[11px] text-muted-foreground block mb-0.5">وقت الجلسة الحالية</span>
              <span className="text-base font-mono font-bold text-foreground">
                {formattedSession}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-muted/60 border border-border">
              <span className="text-[11px] text-muted-foreground block mb-0.5">إجمالي قراءة الكتاب</span>
              <span className="text-xs font-bold text-foreground line-clamp-1 mt-1">
                {formattedTotalBook}
              </span>
            </div>
          </div>

          {/* Next Medal Card in Popover */}
          {medalsProgress.nextMedal && (
            <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-lg text-white border shadow-xs',
                      medalsProgress.nextMedal.colors.gradient,
                      medalsProgress.nextMedal.colors.border
                    )}
                  >
                    <MedalIcon iconName={medalsProgress.nextMedal.iconName} className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-primary font-semibold block leading-none">
                      الوسام القادم
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {medalsProgress.nextMedal.title}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">
                  {medalsProgress.progressToNext}%
                </span>
              </div>

              <Progress value={medalsProgress.progressToNext} className="h-1.5" />

              <p className="text-[10px] text-muted-foreground text-center">
                اقرأ{' '}
                <strong className="text-foreground">
                  {formatReadingDurationArabic(medalsProgress.secondsRemainingToNext)}
                </strong>{' '}
                إضافية للحصول على هذا الوسام
              </p>
            </div>
          )}

          {/* Medals Link */}
          <div className="pt-1 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              الأوسمة المجمعة: <strong>{medalsProgress.unlockedCount} / {medalsProgress.totalCount}</strong>
            </span>
            <Link to="/profile?tab=history">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary hover:text-primary">
                <Award className="h-3.5 w-3.5" />
                عرض الأوسمة
              </Button>
            </Link>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
