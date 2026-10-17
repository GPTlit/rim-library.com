import { Skeleton } from '@/components/ui/skeleton';

export const BookDetailSkeleton = () => {
  return (
    <div className="section-padding select-none" aria-busy="true" aria-label="جاري تحميل بيانات الكتاب...">
      <div className="container-library">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-8">
          <Skeleton className="h-4 w-12 rounded-md bg-muted/60" />
          <span className="text-muted-foreground/40">/</span>
          <Skeleton className="h-4 w-20 rounded-md bg-muted/60" />
          <span className="text-muted-foreground/40">/</span>
          <Skeleton className="h-4 w-32 rounded-md bg-muted/60" />
        </div>

        {/* Book Details Skeleton */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {/* Cover Skeleton */}
          <div className="md:col-span-1">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden book-shadow sticky top-24 bg-muted/40 border border-border/50">
              <Skeleton className="w-full h-full rounded-none bg-gradient-to-tr from-muted/80 via-muted/40 to-muted/80" />
            </div>
          </div>

          {/* Info Skeleton */}
          <div className="md:col-span-2 space-y-6">
            {/* Category Badge Skeleton */}
            <Skeleton className="h-7 w-28 rounded-full bg-muted/70" />

            {/* Title Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-9 md:h-11 w-4/5 rounded-lg bg-muted/80" />
              <Skeleton className="h-9 md:h-11 w-2/5 rounded-lg bg-muted/60" />
            </div>

            {/* Author Skeleton */}
            <Skeleton className="h-6 w-1/3 rounded-md bg-muted/60" />

            {/* Description Skeleton */}
            <div className="space-y-2.5 pt-2">
              <Skeleton className="h-4 w-full rounded-md bg-muted/50" />
              <Skeleton className="h-4 w-11/12 rounded-md bg-muted/50" />
              <Skeleton className="h-4 w-4/5 rounded-md bg-muted/50" />
              <Skeleton className="h-4 w-2/3 rounded-md bg-muted/40" />
            </div>

            {/* Action Buttons Skeleton */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Skeleton className="h-12 w-36 rounded-xl bg-muted/80" />
              <Skeleton className="h-12 w-32 rounded-xl bg-muted/60" />
              <Skeleton className="h-12 w-12 rounded-xl bg-muted/50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
