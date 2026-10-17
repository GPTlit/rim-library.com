import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface BookCardSkeletonProps {
  className?: string;
  delayIndex?: number;
}

export const BookCardSkeleton = ({ className, delayIndex = 0 }: BookCardSkeletonProps) => {
  return (
    <div
      className={cn("block w-full select-none animate-fade-in", className)}
      style={{ animationDelay: `${delayIndex * 0.04}s` }}
      aria-hidden="true"
    >
      <div className="relative">
        {/* Cover Skeleton */}
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted/50 border border-border/40 book-shadow">
          <Skeleton className="w-full h-full rounded-none bg-gradient-to-tr from-muted/80 via-muted/40 to-muted/80" />
          {/* Subtle spine hint */}
          <div className="absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-black/10 to-transparent pointer-events-none" />
        </div>

        {/* Info Skeleton */}
        <div className="mt-3.5 space-y-2">
          {/* Title line 1 */}
          <Skeleton className="h-4 w-4/5 rounded-md bg-muted/70" />
          {/* Title line 2 or author line */}
          <Skeleton className="h-3.5 w-1/2 rounded-md bg-muted/50" />
        </div>
      </div>
    </div>
  );
};

interface BookGridSkeletonProps {
  count?: number;
  className?: string;
}

export const BookGridSkeleton = ({
  count = 10,
  className = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6",
}: BookGridSkeletonProps) => {
  return (
    <div className={className} aria-busy="true" aria-label="جاري التحميل...">
      {Array.from({ length: count }).map((_, i) => (
        <BookCardSkeleton key={i} delayIndex={i} />
      ))}
    </div>
  );
};
