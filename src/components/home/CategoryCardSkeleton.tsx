import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface CategoryCardSkeletonProps {
  className?: string;
  delayIndex?: number;
}

export const CategoryCardSkeleton = ({ className, delayIndex = 0 }: CategoryCardSkeletonProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg p-2 sm:p-3 transition-all",
        "bg-card/70 border border-border/70 shadow-sm animate-fade-in select-none",
        className
      )}
      style={{ animationDelay: `${delayIndex * 0.03}s` }}
      aria-hidden="true"
    >
      {/* Icon Skeleton */}
      <div className="mb-1.5 inline-flex items-center justify-center">
        <Skeleton className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10" />
      </div>

      {/* Title Skeleton */}
      <Skeleton className="h-3.5 sm:h-4 w-4/5 rounded-md bg-muted/80 mb-1" />

      {/* Book Count Skeleton */}
      <Skeleton className="h-2.5 sm:h-3 w-1/2 rounded-md bg-muted/50" />
    </div>
  );
};

interface CategoryGridSkeletonProps {
  count?: number;
  className?: string;
}

export const CategoryGridSkeleton = ({
  count = 12,
  className = "grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3",
}: CategoryGridSkeletonProps) => {
  return (
    <div className={className} aria-busy="true" aria-label="جاري تحميل التصنيفات...">
      {Array.from({ length: count }).map((_, i) => (
        <CategoryCardSkeleton key={i} delayIndex={i} />
      ))}
    </div>
  );
};
