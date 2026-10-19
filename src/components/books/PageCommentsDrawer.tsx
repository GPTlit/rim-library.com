import { useState } from 'react';
import { MessageSquare, Heart, Trash2, Send, X, LogIn, Loader2, User as UserIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { useAuth } from '@/contexts/AuthContext';
import { usePageComments, PageComment } from '@/hooks/usePageComments';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS, fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface PageCommentsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: string;
  bookTitle?: string;
  currentPage: number;
  totalPages?: number;
  /** Position (percent of page) where a new comment will be pinned */
  anchor?: { x: number; y: number } | null;
  /** Only show these comment ids (a tapped marker) */
  focusIds?: string[] | null;
}

export const PageCommentsDrawer = ({
  open,
  onOpenChange,
  bookId,
  bookTitle,
  currentPage,
  totalPages,
  anchor = null,
  focusIds = null,
}: PageCommentsDrawerProps) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState('');

  const { pageComments: allPageComments, isLoading, addPageComment, isAdding, deletePageComment, toggleLike } =
    usePageComments(bookId, currentPage);

  const pageComments = focusIds ? allPageComments.filter((c) => focusIds.includes(c.id)) : allPageComments;

  const getLocale = () => {
    switch (language) {
      case 'fr': return fr;
      case 'en': return enUS;
      default: return ar;
    }
  };

  const handleSend = async () => {
    if (!commentText.trim()) return;
    if (!user) {
      toast({ title: 'يرجى تسجيل الدخول أولاً لإضافة تعليق عام' });
      return;
    }

    try {
      await addPageComment({ page: currentPage, text: commentText.trim(), x: anchor?.x ?? null, y: anchor?.y ?? null });
      onOpenChange(false);
      setCommentText('');
      toast({ title: 'تم نشر تعليقك ليراه جميع القراء على هذه الصفحة' });
    } catch (err: any) {
      toast({ title: 'تعذر إضافة التعليق', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-full sm:max-w-md p-0 flex flex-col bg-card border-r border-border text-right font-tajawal z-[80]"
      >
        {/* Header */}
        <SheetHeader className="p-4 border-b border-border bg-secondary/30 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-base font-bold text-foreground">
                  مناقشات القراء
                </SheetTitle>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <span className="font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10">
                    صفحة {currentPage} {totalPages ? `من ${totalPages}` : ''}
                  </span>
                  <span>· {pageComments.length} تعليق عام</span>
                </div>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs">جاري تحميل مناقشات الصفحة...</p>
            </div>
          ) : pageComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4 space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-secondary/80 flex items-center justify-center text-muted-foreground">
                <MessageSquare className="h-7 w-7 text-primary/70" />
              </div>
              <h4 className="font-bold text-foreground text-sm">لا توجد تعليقات على هذه الصفحة بعد</h4>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                كن أول من يترك انطباعاً، تحليلاً أو فكرة حول ما ورد في هذه الصفحة ليراها بقية القراء داخل الكتاب!
              </p>
            </div>
          ) : (
            pageComments.map((c) => {
              const isOwner = user?.id === c.user_id;
              const author = c.author;
              return (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl bg-secondary/40 hover:bg-secondary/60 border border-border/60 transition-all space-y-2 text-right group"
                >
                  {/* Author Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold overflow-hidden">
                        {author?.avatar_url ? (
                          <img src={author.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          author?.display_name?.charAt(0) || <UserIcon className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-foreground">
                          {author?.display_name || author?.username || 'قارئ'}
                        </span>
                        {author?.verified && <VerifiedBadge className="h-3.5 w-3.5" />}
                      </div>
                    </div>

                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: getLocale() })}
                    </span>
                  </div>

                  {/* Comment Body */}
                  <p className="text-xs text-foreground/90 leading-relaxed font-serif select-text whitespace-pre-wrap">
                    {c.cleanText}
                  </p>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/30">
                    <button
                      type="button"
                      onClick={() => toggleLike({ commentId: c.id, isLiked: c.user_liked })}
                      className={`flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
                        c.user_liked ? 'text-rose-500 font-bold' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${c.user_liked ? 'fill-current' : ''}`} />
                      <span>{c.likes_count > 0 ? c.likes_count : 'إعجاب'}</span>
                    </button>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => deletePageComment(c.id)}
                        className="text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors cursor-pointer"
                        title="حذف تعليقي"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>حذف</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Comment Composer */}
        <div className="p-3 bg-card border-t border-border shrink-0 space-y-2">
          {user ? (
            <div className="space-y-2">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={`اكتب انطباعك أو تعليقك على صفحة ${currentPage}...`}
                className="text-xs resize-none min-h-[68px] rounded-xl bg-background border-border"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-muted-foreground">
                  يظهر تعليقك علناً لجميع قراء هذه الصفحة
                </span>
                <Button
                  onClick={handleSend}
                  disabled={isAdding || !commentText.trim()}
                  variant="gold"
                  size="sm"
                  className="gap-1.5 h-8 px-4 text-xs font-bold"
                >
                  {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  <span>نشر</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-secondary/50 rounded-xl text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                سجّل الدخول لتشارك قراءتك وانطباعاتك مع مجتمع القراء
              </p>
              <Link to="/auth">
                <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                  <LogIn className="h-3.5 w-3.5" />
                  <span>تسجيل الدخول للمشاركة</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
