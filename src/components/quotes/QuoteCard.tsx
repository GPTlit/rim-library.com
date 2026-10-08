import { Link, useNavigate } from 'react-router-dom';
import { Heart, Bookmark, Share2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Quote, useToggleQuoteLike, useToggleQuoteSave } from '@/hooks/useQuotes';

interface QuoteCardProps {
  quote: Quote;
  bookTitle?: string;
  bookId?: string;
  compact?: boolean;
}

export const QuoteCard = ({ quote, bookTitle, bookId, compact }: QuoteCardProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const toggleLike = useToggleQuoteLike();
  const toggleSave = useToggleQuoteSave();

  const requireAuth = (desc: string, cb: () => void) => {
    if (!user) {
      toast({
        title: t('loginRequired'),
        description: desc,
        action: (
          <Button size="sm" onClick={() => navigate('/auth')}>
            {t('login')}
          </Button>
        ),
      });
      return;
    }
    cb();
  };

  const handleLike = () => requireAuth(t('loginToLikeQuote'), () => {
    toggleLike.mutate({ quoteId: quote.id, liked: quote.user_liked });
  });

  const handleSave = () => requireAuth(t('loginToSaveQuote'), () => {
    toggleSave.mutate({ quoteId: quote.id, saved: quote.user_saved });
  });

  const handleShare = async () => {
    const url = `${window.location.origin}/quotes/${quote.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: bookTitle || t('quoteCards'), text: quote.text, url });
        return;
      } catch {
        // fall through to copy
      }
    }
    navigator.clipboard.writeText(url);
    toast({ title: t('linkCopied') });
  };

  const authorName = quote.profile?.display_name || quote.profile?.username || '—';

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-card shadow-sm flex flex-col">
      <Link to={`/quotes/${quote.id}`} className="block aspect-square bg-secondary overflow-hidden">
        {quote.image_url ? (
          <img src={quote.image_url} alt={quote.text} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4 text-center text-sm text-foreground/80">
            “{quote.text}”
          </div>
        )}
      </Link>
      <div className="p-3 flex flex-col gap-2">
        <p className="text-xs text-muted-foreground truncate">{authorName}</p>
        {!compact && quote.comment && <p className="text-sm text-foreground/80 line-clamp-2">{quote.comment}</p>}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="gap-1 px-2" onClick={handleLike}>
              <Heart className={`h-4 w-4 ${quote.user_liked ? 'fill-red-500 text-red-500' : ''}`} />
              <span className="text-xs">{quote.like_count}</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-1 px-2" onClick={handleSave}>
              <Bookmark className={`h-4 w-4 ${quote.user_saved ? 'fill-primary text-primary' : ''}`} />
              <span className="text-xs">{quote.save_count}</span>
            </Button>
            <Button variant="ghost" size="sm" className="px-2" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          {quote.page && (bookId || quote.book_id) && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 px-2 text-xs"
              onClick={() => navigate(`/book/${bookId || quote.book_id}/read?page=${quote.page}`)}
            >
              <BookOpen className="h-3.5 w-3.5" /> {quote.page}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
