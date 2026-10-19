import { Link } from 'react-router-dom';
import { Compass, ArrowLeft, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookCard } from '@/components/books/BookCard';
import { BookGridSkeleton } from '@/components/books/BookCardSkeleton';
import { useRecommendedBooks } from '@/hooks/useRecommendedBooks';
import { useLanguage } from '@/contexts/LanguageContext';

export const RecommendedBooks = () => {
  const { t } = useLanguage();
  const { recommendations, books, topCategoryNames, hasPersonalizedHistory, isLoading } = useRecommendedBooks(10);

  if (isLoading) {
    return (
      <section className="section-padding bg-secondary/15 border-y border-border/40">
        <div className="container-library">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  {t('recommendedForYou')}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {t('recommendedSubtitleGeneral')}
                </p>
              </div>
            </div>
          </div>
          <BookGridSkeleton count={5} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4" />
        </div>
      </section>
    );
  }

  if (!books.length) {
    return null;
  }

  return (
    <section className="section-padding bg-secondary/15 border-y border-border/40 relative overflow-hidden">
      <div className="container-library">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  {t('recommendedForYou')}
                </h2>
                {hasPersonalizedHistory && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    <BookmarkCheck className="h-3 w-3" />
                    مخصص لك
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">
                {hasPersonalizedHistory && topCategoryNames.length > 0 ? (
                  <span>
                    {t('basedOnYourReading')}: <strong className="text-foreground font-semibold">{topCategoryNames.join('، ')}</strong>
                  </span>
                ) : (
                  t('recommendedSubtitleGeneral')
                )}
              </p>
            </div>
          </div>

          <Link to="/categories" className="hidden sm:block">
            <Button variant="outline" size="sm" className="gap-2">
              <span>{t('viewAll')}</span>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Books Grid with matching recommendations */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {recommendations.map((rec, index) => (
            <div key={rec.book.id} className="relative group/rec flex flex-col">
              <BookCard book={rec.book} index={index} />
              {rec.reason && hasPersonalizedHistory && (
                <div className="mt-1 px-1">
                  <span className="text-[10px] text-muted-foreground/80 line-clamp-1 group-hover/rec:text-primary transition-colors">
                    {rec.reason}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile View All Link */}
        <div className="mt-6 text-center sm:hidden">
          <Link to="/categories">
            <Button variant="outline" size="sm" className="gap-2 w-full">
              <span>{t('viewAll')}</span>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
