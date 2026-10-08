import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Play, ChevronLeft, BookmarkCheck, ArrowRight } from 'lucide-react';
import { useBooks } from '@/hooks/useBooks';
import { useRecentlyViewedIds } from '@/hooks/useRecentlyViewed';
import { getReadingHistory } from '@/lib/storage';
import { getLastBookmark } from '@/lib/bookmarks';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export const ContinueReadingSection = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: books = [] } = useBooks();
  const recentlyViewedIds = useRecentlyViewedIds();

  // Combine recently viewed IDs and reading history to get up to 3 distinct books
  const continueBooks = useMemo(() => {
    if (!books.length) return [];
    const booksMap = new Map(books.map((b) => [b.id, b]));

    const history = getReadingHistory();
    const orderedIds: string[] = [];

    // Prioritize recently viewed, supplemented with reading history
    for (const id of recentlyViewedIds) {
      if (!orderedIds.includes(id) && booksMap.has(id)) {
        orderedIds.push(id);
      }
    }

    for (const h of history) {
      if (!orderedIds.includes(h.bookId) && booksMap.has(h.bookId)) {
        orderedIds.push(h.bookId);
      }
    }

    // Take the last three books
    const topThreeIds = orderedIds.slice(0, 3);

    return topThreeIds
      .map((id) => {
        const book = booksMap.get(id);
        if (!book) return null;
        const lastBm = getLastBookmark(id);
        const historyItem = history.find((h) => h.bookId === id);
        const page = lastBm?.page || 1;
        const totalPages = (book as any).page_count || (book as any).total_pages || 0;
        const percent = totalPages > 0 ? Math.min(100, Math.round((page / totalPages) * 100)) : null;

        return {
          book,
          lastPage: page,
          totalPages,
          percent,
          lastReadDate: historyItem?.lastRead,
        };
      })
      .filter(Boolean) as {
        book: (typeof books)[0];
        lastPage: number;
        totalPages: number;
        percent: number | null;
        lastReadDate?: string;
      }[];
  }, [books, recentlyViewedIds]);

  if (!continueBooks.length) return null;

  return (
    <section className="py-4 sm:py-6 bg-gradient-to-b from-secondary/20 to-background/50 border-y border-border/40">
      <div className="container-library">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                {t('continueReadingTitle')}
                <span className="text-[11px] px-2 py-0.2 rounded-full bg-primary/10 text-primary font-normal">
                  {continueBooks.length} {t('books')}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {t('continueReadingSubtitle')}
              </p>
            </div>
          </div>
          <Link
            to="/history"
            className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
          >
            {t('fullHistoryLink')}
            <ChevronLeft className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Horizontal scroll row of last three books - Compact sizes */}
        <div className="flex gap-3 overflow-x-auto pb-2 pt-0.5 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-muted-foreground/20">
          {continueBooks.map(({ book, lastPage, totalPages, percent }) => {
            const coverImage = book.cover_url || '/placeholder.svg';

            return (
              <div
                key={book.id}
                className="snap-start shrink-0 w-[210px] sm:w-[240px] md:w-[260px] p-2.5 sm:p-3 rounded-xl bg-card border border-border/70 hover:border-primary/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="flex gap-2.5 items-start">
                  {/* Compact Book Cover */}
                  <Link
                    to={`/book/${book.id}`}
                    className="shrink-0 w-14 sm:w-16 aspect-[3/4] rounded-lg overflow-hidden book-shadow bg-secondary relative block group-hover:scale-[1.02] transition-transform"
                  >
                    <img
                      src={coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {percent !== null && (
                      <div className="absolute bottom-0 inset-x-0 bg-background/90 backdrop-blur text-[9px] text-center font-bold text-primary py-0.2 border-t border-border/50">
                        {percent}%
                      </div>
                    )}
                  </Link>

                  {/* Book Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                    <div>
                      <Link to={`/book/${book.id}`}>
                        <h3 className="font-bold text-xs sm:text-sm text-foreground line-clamp-1 hover:text-primary transition-colors">
                          {book.title}
                        </h3>
                      </Link>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        {book.author}
                      </p>

                      {/* Bookmark / Progress Tag */}
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-foreground/80 bg-secondary/60 px-1.5 py-0.5 rounded-md w-fit">
                        <BookmarkCheck className="h-3 w-3 text-primary shrink-0" />
                        <span className="font-mono">
                          p. {lastPage}{totalPages > 0 ? ` / ${totalPages}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar (if totalPages known) */}
                    {percent !== null && (
                      <div className="mt-1.5 w-full bg-secondary/70 h-1 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Compact Resume Action Button */}
                <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center gap-1.5">
                  <Button
                    variant="gold"
                    size="sm"
                    className="flex-1 h-7 text-xs px-2 gap-1.5 font-bold shadow-xs"
                    onClick={() => navigate(`/book/${book.id}/read?page=${lastPage}`)}
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>{t('resume')}</span>
                  </Button>
                  <Link to={`/book/${book.id}`}>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground">
                      {t('readAction')}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
