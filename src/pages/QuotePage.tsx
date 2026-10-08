import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Loader2, Trash2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuote, useDeleteQuote } from '@/hooks/useQuotes';
import { useBook } from '@/hooks/useBooks';
import { QuoteCard } from '@/components/quotes/QuoteCard';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const QuotePage = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: quote, isLoading } = useQuote(id);
  const { data: book } = useBook(quote?.book_id || '');
  const deleteQuote = useDeleteQuote();

  if (isLoading) {
    return (
      <Layout>
        <div className="section-padding">
          <div className="container-library flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!quote) {
    return (
      <Layout>
        <div className="section-padding">
          <div className="container-library text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">{t('quoteNotFound')}</h1>
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <ArrowRight className="h-4 w-4" />
                {t('backToHome')}
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const handleDelete = async () => {
    await deleteQuote.mutateAsync({ id: quote.id, bookId: quote.book_id });
    toast({ title: t('quoteDeleted') });
    navigate(book ? `/book/${book.id}` : '/');
  };

  return (
    <Layout>
      <div className="section-padding">
        <div className="container-library max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link to={book ? `/book/${book.id}` : '/'} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <ArrowRight className="h-4 w-4" />
              {book ? book.title : t('backToHome')}
            </Link>
            {user?.id === quote.user_id && (
              <Button variant="ghost" size="sm" className="gap-1 text-destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
                {t('deleteQuote')}
              </Button>
            )}
          </div>

          <div className="max-w-sm mx-auto">
            <QuoteCard quote={quote} bookTitle={book?.title} bookId={book?.id} />
          </div>

          {book && (
            <div className="mt-6 text-center">
              <Link to={`/book/${book.id}`}>
                <Button variant="outline" className="gap-2">{t('viewInBook')}</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default QuotePage;
