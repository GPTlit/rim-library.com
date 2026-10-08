import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBookQuotes } from '@/hooks/useQuotes';
import { QuoteCard } from './QuoteCard';

export const QuoteFeed = ({ bookId, bookTitle }: { bookId: string; bookTitle?: string }) => {
  const { t } = useLanguage();
  const { data: quotes, isLoading } = useBookQuotes(bookId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!quotes || quotes.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">{t('noQuotesYet')}</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {quotes.map((q) => (
        <QuoteCard key={q.id} quote={q} bookTitle={bookTitle} bookId={bookId} />
      ))}
    </div>
  );
};
