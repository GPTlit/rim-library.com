import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Download, ZoomIn, ZoomOut, Loader2, WifiOff, BookmarkPlus, Bookmark as BookmarkIcon, List, Moon, Sun, RotateCw, RotateCcw, Smartphone, Check, Menu, Quote as QuoteIcon, ScanLine, TextCursorInput, Copy, MessageSquare } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from '@/components/ui/button';
import { useBook } from '@/hooks/useBooks';
import { addToReadingHistory } from '@/lib/storage';
import { useOfflineBooks, getOfflinePdfSource, loadDeviceDownloads } from '@/hooks/useOfflineBooks';
import { getBookmarks, addBookmark, removeBookmark, getLastBookmark, Bookmark } from '@/lib/bookmarks';
import BookmarkPanel from '@/components/books/BookmarkPanel';
import { toast } from 'sonner';
import { AmbientPlayer } from '@/components/books/AmbientPlayer';
import { AskTheBook } from '@/components/books/AskTheBook';
import { useReadingPresence } from '@/hooks/useReadingPresence';
import { useReadingTime } from '@/hooks/useReadingTime';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpenCheck } from 'lucide-react';
import { useBookSessionTimer } from '@/hooks/useBookSessionTimer';
import { ReaderSessionTimer } from '@/components/books/ReaderSessionTimer';
import { ReadingGoalNotch } from '@/components/medals/ReadingGoalNotch';
import { QuoteEditorDialog } from '@/components/quotes/QuoteEditorDialog';
import { QuoteOcrCapture } from '@/components/quotes/QuoteOcrCapture';
import { PageCommentsDrawer } from '@/components/books/PageCommentsDrawer';
import { usePageComments } from '@/hooks/usePageComments';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const BookReader = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: book, isLoading } = useBook(id || '');
  const { getOfflineBookUrl } = useOfflineBooks();
  const { user } = useAuth();

  // Authentication gating: signed-out visitors cannot open the reader
  useEffect(() => {
    if (!user) {
      toast.error('تسجيل الدخول مطلوب للقراءة', {
        description: 'يرجى تسجيل الدخول للاستمتاع بقراءة الكتاب وتتبع وقتك وأوسمتك.',
        duration: 5000,
      });
      navigate(id ? `/book/${id}` : '/', { replace: true });
    }
  }, [user, id, navigate]);

  useReadingTime(true);
  useReadingPresence(id);
  const sessionTimer = useBookSessionTimer({
    bookId: id || '',
    title: book?.title,
    author: book?.author,
    coverUrl: book?.cover_url,
    active: true,
  });
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState(1.0);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selection, setSelection] = useState('');
  const [askOpen, setAskOpen] = useState(false);
  const [invertPages, setInvertPages] = useState(() => localStorage.getItem('reader-invert') === 'true');
  const [pageRotation, setPageRotation] = useState(() => Number(localStorage.getItem('reader-rotation') || 0));
  const [orientation, setOrientation] = useState<'auto' | 'portrait' | 'landscape'>(() => (localStorage.getItem('reader-orientation') as 'auto' | 'portrait' | 'landscape') || 'auto');
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pageElementsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const shouldRestoreRef = useRef(true);
  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null);
  const { t } = useLanguage();
  const [quoteEditorOpen, setQuoteEditorOpen] = useState(false);
  const [quoteInitialText, setQuoteInitialText] = useState('');
  const [ocrOpen, setOcrOpen] = useState(false);
  const ocrTargetRef = useRef<HTMLDivElement | null>(null);
  const [pageCommentsOpen, setPageCommentsOpen] = useState(false);
  const [pageCommentsTargetPage, setPageCommentsTargetPage] = useState<number>(1);
  const { pageCommentsCountMap, allComments: allPageComments } = usePageComments(id || '', pageCommentsTargetPage || currentPage);
  const [commentAnchor, setCommentAnchor] = useState<{ x: number; y: number } | null>(null);
  const [commentFocusIds, setCommentFocusIds] = useState<string[] | null>(null);
  const holdRef = useRef<{ timer: number; sx: number; sy: number } | null>(null);
  const [holdPoint, setHoldPoint] = useState<{ page: number; x: number; y: number } | null>(null);
  const cancelHold = () => {
    if (holdRef.current) window.clearTimeout(holdRef.current.timer);
    holdRef.current = null;
    setHoldPoint(null);
  };
  const startHold = (e: React.PointerEvent<HTMLDivElement>, pageNum: number) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cancelHold();
    setHoldPoint({ page: pageNum, x, y });
    const timer = window.setTimeout(() => {
      holdRef.current = null;
      setHoldPoint(null);
      try { window.getSelection()?.removeAllRanges(); } catch { /* ignore */ }
      if (!user) {
        toast.error('سجّل الدخول أولاً لتضيف تعليقك على الصفحة');
        return;
      }
      if (navigator.vibrate) navigator.vibrate(30);
      setCommentFocusIds(null);
      setCommentAnchor({ x, y });
      setPageCommentsTargetPage(pageNum);
      setPageCommentsOpen(true);
    }, 1500);
    holdRef.current = { timer, sx: e.clientX, sy: e.clientY };
  };
  const moveHold = (e: React.PointerEvent) => {
    const h = holdRef.current;
    if (h && Math.hypot(e.clientX - h.sx, e.clientY - h.sy) > 10) cancelHold();
  };
  const openMarker = (pageNum: number, ids: string[]) => {
    setCommentAnchor(null);
    setCommentFocusIds(ids);
    setPageCommentsTargetPage(pageNum);
    setPageCommentsOpen(true);
  };
  const currentPageCommentsCount = pageCommentsCountMap.get(currentPage) || 0;

  // Track visual reading scroll progress
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const totalScroll = scrollHeight - clientHeight;
      if (totalScroll > 10) {
        const percent = Math.min(100, Math.max(0, (scrollTop / totalScroll) * 100));
        setScrollProgress(percent);
      } else if (numPages > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (currentPage / numPages) * 100)));
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [numPages, currentPage]);

  // Load bookmarks
  useEffect(() => {
    if (id) setBookmarks(getBookmarks(id));
  }, [id]);

  // Setup book file + history
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const initBook = async () => {
      // 1. Try offline source first (works 100% offline without network)
      const offlineSrc = await getOfflinePdfSource(id);
      if (cancelled) return;

      if (offlineSrc) {
        setFileUrl(offlineSrc);
        setIsOfflineMode(true);
      } else if (book?.file_url) {
        setFileUrl(book.file_url);
        setIsOfflineMode(false);
      } else {
        const fallback = getOfflineBookUrl(id);
        if (fallback) {
          setFileUrl(fallback);
          setIsOfflineMode(true);
        }
      }

      const downloads = loadDeviceDownloads();
      const entry = downloads.find((d) => d.bookId === id);
      const title = book?.title || entry?.title || 'كتاب';
      const author = book?.author || entry?.author || '';
      const cover = book?.cover_url || entry?.coverUrl || '/placeholder.svg';

      addToReadingHistory({
        bookId: id,
        title,
        author,
        coverUrl: cover,
        lastRead: new Date().toISOString(),
      });
    };

    initBook();
    return () => { cancelled = true; };
  }, [book, id, getOfflineBookUrl]);

  // Restore last bookmark position after pages render
  useEffect(() => {
    if (!shouldRestoreRef.current || numPages === 0 || !id) return;
    const last = getLastBookmark(id);
    if (last) {
      shouldRestoreRef.current = false;
      // Delay to let pages mount
      setTimeout(() => navigateToPage(last.page, last.scrollOffset), 500);
    }
  }, [numPages, id]);

  const onDocumentLoadSuccess = ({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setLoadedPages(new Set([1, 2, 3]));
    // Cache page count to DB if missing
    if (book && !(book as any).page_count) {
      supabase.from('books').update({ page_count: n }).eq('id', book.id);
    }
  };

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));

  // Pinch-to-zoom handlers (touch)
  const getDist = (t1: React.Touch, t2: React.Touch) =>
    Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchRef.current = {
        startDist: getDist(e.touches[0], e.touches[1]),
        startScale: scale,
      };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dist = getDist(e.touches[0], e.touches[1]);
      const ratio = dist / pinchRef.current.startDist;
      const next = Math.min(3, Math.max(0.5, pinchRef.current.startScale * ratio));
      setScale(next);
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) pinchRef.current = null;
  };

  const navigateToPage = (page: number, _scrollOffset: number = 0) => {
    // Ensure page is loaded
    setLoadedPages((prev) => {
      const next = new Set(prev);
      for (let i = Math.max(1, page - 1); i <= Math.min(numPages, page + 2); i++) next.add(i);
      return next;
    });
    setTimeout(() => {
      const el = pageElementsRef.current.get(page);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleAddBookmark = () => {
    if (!id) return;
    const bm = addBookmark(id, currentPage, 0);
    setBookmarks(getBookmarks(id));
    toast.success(`تمت إضافة علامة: ${bm.name}`);
  };

  const handleRemoveBookmark = (bmId: string) => {
    if (!id) return;
    removeBookmark(bmId);
    setBookmarks(getBookmarks(id));
    toast.success('تم حذف العلامة');
  };

  const refreshBookmarks = () => {
    if (id) setBookmarks(getBookmarks(id));
  };

  // Track current page via IntersectionObserver
  const pageRef = useCallback((node: HTMLDivElement | null, pageNum: number) => {
    if (!node) return;
    pageElementsRef.current.set(pageNum, node);

    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const pg = Number(entry.target.getAttribute('data-page'));
              if (pg) {
                setCurrentPage(pg);
                setLoadedPages((prev) => {
                  const next = new Set(prev);
                  for (let i = Math.max(1, pg - 1); i <= Math.min(numPages, pg + 2); i++) next.add(i);
                  return next;
                });
              }
            }
          });
        },
        { rootMargin: '600px 0px', threshold: 0.5 }
      );
    }
    observerRef.current.observe(node);
  }, [numPages]);

  useEffect(() => {
    return () => { observerRef.current?.disconnect(); };
  }, []);

  const currentPageBookmarked = bookmarks.some((b) => b.page === currentPage);

  const togglePageTheme = () => setInvertPages((current) => {
    localStorage.setItem('reader-invert', String(!current));
    return !current;
  });

  const rotatePage = () => setPageRotation((current) => {
    const next = (current + 90) % 360;
    localStorage.setItem('reader-rotation', String(next));
    return next;
  });

  const setReaderOrientation = async (value: 'auto' | 'portrait' | 'landscape') => {
    setOrientation(value);
    localStorage.setItem('reader-orientation', value);
    const orientationApi = screen.orientation as ScreenOrientation & { lock?: (mode: string) => Promise<void> };
    try {
      if (value === 'auto') orientationApi.unlock();
      else if (orientationApi.lock) await orientationApi.lock(value);
      else throw new Error('unsupported');
    } catch {
      toast.info('تم حفظ اتجاه الصفحات، لكن المتصفح لم يسمح بقفل اتجاه الهاتف.');
    }
  };

  useEffect(() => () => screen.orientation?.unlock?.(), []);

  // Smooth, lag-free text selection tracking for "Ask the book", Quotes, and Highlight
  useEffect(() => {
    let timer: any;
    const updateSelection = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const raw = window.getSelection?.()?.toString() || '';
        const trimmed = raw.trim();
        if (trimmed) {
          setSelection(trimmed);
          setQuoteInitialText(trimmed);
          try {
            localStorage.setItem('reader-last-quote-text', trimmed);
          } catch {}
        } else {
          setSelection('');
        }
      }, 80);
    };

    const handleCopy = () => {
      setTimeout(() => {
        const sel = window.getSelection?.()?.toString().trim() || '';
        if (sel) {
          setSelection(sel);
          setQuoteInitialText(sel);
          try {
            localStorage.setItem('reader-last-quote-text', sel);
          } catch {}
          toast.success('تم نسخ النص وتجهيزه للاقتباس تلقائياً');
        }
      }, 10);
    };

    // Notice: Do NOT listen to 'selectionchange' continuously during active dragging.
    // That was causing 60fps re-renders of the whole reader while the user was dragging.
    // Instead, listen only when the user finishes selecting (mouseup, touchend) or copies (copy).
    document.addEventListener('mouseup', updateSelection);
    document.addEventListener('touchend', updateSelection);
    document.addEventListener('copy', handleCopy);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseup', updateSelection);
      document.removeEventListener('touchend', updateSelection);
      document.removeEventListener('copy', handleCopy);
    };
  }, []);

  const saveHighlight = async () => {
    if (!user || !id || !selection) return;
    await supabase.from('book_highlights').insert({ book_id: id, user_id: user.id, page: currentPage, text: selection });
    toast.success('تم تمييز النص');
  };

  const localDownloadedEntry = id ? loadDeviceDownloads().find((d) => d.bookId === id) : null;
  const displayTitle = book?.title || localDownloadedEntry?.title || 'كتاب';
  const displayAuthor = book?.author || localDownloadedEntry?.author || '';

  if (isLoading && !fileUrl && !localDownloadedEntry) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!book && !fileUrl && !localDownloadedEntry) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">الكتاب غير موجود</h1>
          <Link to="/"><Button variant="outline" className="gap-2"><ArrowRight className="h-4 w-4" />العودة للرئيسية</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex flex-col relative">
      {/* Top Reading Goal Notch Notification (auto moves out after 5s or user dismisses) */}
      <ReadingGoalNotch
        medal={sessionTimer.unlockedMedal}
        onDismiss={sessionTimer.dismissUnlockedMedal}
      />

      {/* Toolbar */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        {/* Visual Reading Progress Bar at the Top */}
        <div
          className="h-1.5 w-full bg-secondary/50 overflow-hidden relative"
          title={`تقدم القراءة: ${Math.round(scrollProgress)}%`}
          role="progressbar"
          aria-valuenow={Math.round(scrollProgress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-primary transition-[width] duration-150 ease-out shadow-sm"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        <div className="container-library">
          <div className="flex items-center justify-between h-14 gap-1.5 sm:gap-2 overflow-hidden">
            {/* Left section: Back button + Title & Author + Session Timer */}
            <div className="flex items-center gap-1 sm:gap-2.5 min-w-0 shrink">
              <Link to={id ? `/book/${id}` : '/'} className="shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"><ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" /></Button>
              </Link>
              <div className="min-w-0 shrink">
                <h1 className="font-bold text-foreground text-xs sm:text-base truncate max-w-[75px] xs:max-w-[110px] sm:max-w-[180px] md:max-w-xs">{displayTitle}</h1>
                <p className="text-[11px] text-muted-foreground truncate hidden sm:block">{displayAuthor}</p>
              </div>
              {isOfflineMode && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-accent/10 text-accent text-[11px] shrink-0">
                  <WifiOff className="h-3 w-3" />
                </div>
              )}
              {/* Reading Session Timer */}
              <ReaderSessionTimer
                formattedSession={sessionTimer.formattedSession}
                sessionSeconds={sessionTimer.sessionSeconds}
                formattedTotalBook={sessionTimer.formattedTotalBook}
                totalBookSeconds={sessionTimer.totalBookSeconds}
                bookTitle={displayTitle}
                medalsProgress={sessionTimer.medalsProgress}
                className="shrink-0"
              />
            </div>

            {/* Center section: Page counter & progress */}
            <div className="flex items-center gap-1 shrink-0 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-secondary/50 border border-border/60">
              <span className="text-[11px] sm:text-xs font-mono font-medium text-foreground whitespace-nowrap">{currentPage}/{numPages}</span>
              <span className="text-[10px] font-bold text-primary px-1.5 py-0.2 rounded bg-primary/10 hidden md:inline-block">
                {Math.round(scrollProgress)}%
              </span>
            </div>

            {/* Right section: Responsive buttons + Three-Lines Menu Button (☰) */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Scaling / Zoom Controls visible on md+ screens; touch pinch-to-zoom handles mobile */}
              <div className="hidden md:flex items-center gap-0.5 sm:gap-1 bg-secondary/60 rounded-full px-1 sm:px-1.5 py-0.5 border border-border/60">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  onClick={handleZoomOut}
                  title="تصغير (-)"
                  aria-label="تصغير"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <button
                  type="button"
                  onClick={() => setScale(1.0)}
                  className="text-[11px] font-mono font-semibold px-1 min-w-[2.2rem] text-center select-none hover:text-primary transition-colors"
                  title="إعادة تعيين الحجم 100%"
                >
                  {Math.round(scale * 100)}%
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  onClick={handleZoomIn}
                  title="تكبير (+)"
                  aria-label="تكبير"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Bookmark Toggle Button */}
              <Button
                variant={currentPageBookmarked ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
                onClick={handleAddBookmark}
                title={`إضافة علامة - صفحة ${currentPage}`}
              >
                {currentPageBookmarked ? <BookmarkIcon className="h-4 w-4 text-primary" /> : <BookmarkPlus className="h-4 w-4" />}
              </Button>

              {/* Bookmarks List Panel Button (Desktop/Tablet) */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 relative"
                onClick={() => setPanelOpen(!panelOpen)}
                title="العلامات المرجعية"
              >
                <List className="h-4 w-4" />
                {bookmarks.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {bookmarks.length}
                  </span>
                )}
              </Button>

              {/* Wattpad-style Page Comments button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 relative text-foreground hover:bg-secondary"
                onClick={() => {
                  setPageCommentsTargetPage(currentPage);
                  setPageCommentsOpen(true);
                }}
                title={`مناقشات القراء على صفحة ${currentPage}`}
                aria-label="مناقشات القراء"
              >
                <MessageSquare className="h-4 w-4" />
                {currentPageCommentsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] rounded-full min-w-4 h-4 px-1 flex items-center justify-center font-bold">
                    {currentPageCommentsCount}
                  </span>
                )}
              </Button>

              {/* Three-Lines Menu Button (☰ يحتوي على: الاقتباسات وOCR، التعليقات، العلامات، العرض والتحميل) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 text-foreground hover:bg-secondary"
                    title="خيارات القارئ (3 خطوط)"
                    aria-label="قائمة الخيارات"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2 text-right font-tajawal space-y-1">
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold px-2 py-1">
                    أدوات الاقتباس والملاحظات
                  </DropdownMenuLabel>

                  {/* 1. Quotes inside the 3 lines menu */}
                  <DropdownMenuItem
                    onClick={() => {
                      if (selection) {
                        setQuoteInitialText(selection);
                        try {
                          localStorage.setItem('reader-last-quote-text', selection);
                        } catch {}
                        setQuoteEditorOpen(true);
                      } else {
                        // Check if text was previously copied
                        const stored = localStorage.getItem('reader-last-quote-text') || '';
                        setQuoteInitialText(stored);
                        setQuoteEditorOpen(true);
                        if (!stored) {
                          toast.info('حدد نصاً أو انسخه لإنشاء اقتباس جميل');
                        }
                      }
                    }}
                    className="flex items-center justify-between cursor-pointer py-2"
                  >
                    <span className="flex items-center gap-2.5">
                      <QuoteIcon className="h-4 w-4 text-primary" />
                      {t('createQuote')}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {selection ? 'نص محدد' : 'جاهز'}
                    </span>
                  </DropdownMenuItem>

                  {/* 2. OCR text extraction */}
                  <DropdownMenuItem
                    onClick={() => {
                      ocrTargetRef.current = pageElementsRef.current.get(currentPage) || null;
                      setOcrOpen(true);
                    }}
                    className="flex items-center justify-between cursor-pointer py-2"
                  >
                    <span className="flex items-center gap-2.5">
                      <ScanLine className="h-4 w-4 text-primary" />
                      {t('ocrMode')}
                    </span>
                    <span className="text-[10px] text-muted-foreground">مسح ضوئي</span>
                  </DropdownMenuItem>

                  {/* 3. Wattpad Page discussions */}
                  <DropdownMenuItem
                    onClick={() => {
                      setPageCommentsTargetPage(currentPage);
                      setPageCommentsOpen(true);
                    }}
                    className="flex items-center justify-between cursor-pointer py-2"
                  >
                    <span className="flex items-center gap-2.5">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      مناقشات صفحة {currentPage}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold">
                      {currentPageCommentsCount} تعليق
                    </span>
                  </DropdownMenuItem>

                  {/* 4. Bookmarks list */}
                  <DropdownMenuItem
                    onClick={() => setPanelOpen(true)}
                    className="flex items-center justify-between cursor-pointer py-2"
                  >
                    <span className="flex items-center gap-2.5">
                      <List className="h-4 w-4 text-primary" />
                      قائمة العلامات المرجعية
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">{bookmarks.length}</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Mobile zoom controls inside the menu */}
                  <div className="flex md:hidden items-center justify-between px-2 py-1.5 text-xs">
                    <span className="text-muted-foreground">حجم الصفحة</span>
                    <div className="flex items-center gap-1 bg-secondary/80 rounded-full px-1 py-0.5">
                      <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full" onClick={handleZoomOut}>
                        <ZoomOut className="h-3 w-3" />
                      </Button>
                      <button
                        type="button"
                        onClick={() => setScale(1.0)}
                        className="font-mono text-xs font-semibold px-1"
                      >
                        {Math.round(scale * 100)}%
                      </button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full" onClick={handleZoomIn}>
                        <ZoomIn className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <DropdownMenuSeparator className="md:hidden" />

                  {/* 5. Light Mode / Dark Mode button */}
                  <DropdownMenuItem onClick={togglePageTheme} className="flex items-center justify-between cursor-pointer py-2">
                    <span className="flex items-center gap-2.5">
                      {invertPages ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-primary" />}
                      {invertPages ? 'الوضع الفاتح للصفحات' : 'الوضع الداكن للصفحات'}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{invertPages ? 'مفعل' : 'عادي'}</span>
                  </DropdownMenuItem>

                  {/* 6. Rotation buttons */}
                  <DropdownMenuItem onClick={rotatePage} className="flex items-center justify-between cursor-pointer py-2">
                    <span className="flex items-center gap-2.5">
                      <RotateCw className="h-4 w-4 text-primary" />
                      تدوير الصفحة 90°
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">{pageRotation}°</span>
                  </DropdownMenuItem>

                  {pageRotation !== 0 && (
                    <DropdownMenuItem
                      onClick={() => {
                        setPageRotation(0);
                        localStorage.setItem('reader-rotation', '0');
                      }}
                      className="flex items-center gap-2.5 text-destructive cursor-pointer py-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      إعادة ضبط التدوير (0°)
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={() => setReaderOrientation(orientation === 'landscape' ? 'portrait' : 'landscape')}
                    className="flex items-center justify-between cursor-pointer py-2"
                  >
                    <span className="flex items-center gap-2.5">
                      <Smartphone className="h-4 w-4 text-primary" />
                      اتجاه الشاشة
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {orientation === 'landscape' ? 'أفقي' : orientation === 'portrait' ? 'عمودي' : 'تلقائي'}
                    </span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* 7. Download button */}
                  <DropdownMenuItem asChild className="cursor-pointer py-2">
                    <a href={book?.file_url || fileUrl || '#'} download target="_blank" rel="noopener noreferrer" className="flex items-center justify-between w-full">
                      <span className="flex items-center gap-2.5">
                        <Download className="h-4 w-4 text-primary" />
                        تحميل الكتاب
                      </span>
                      <span className="text-[11px] text-muted-foreground">PDF</span>
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Bookmark Panel */}
      <BookmarkPanel
        bookmarks={bookmarks}
        onNavigate={navigateToPage}
        onRemove={handleRemoveBookmark}
        onUpdate={refreshBookmarks}
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
      />

      {/* PDF Viewer */}
      <div
        className="flex-1 overflow-auto p-4 touch-pan-y"
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: 'pan-x pan-y' }}
      >
        <div className="flex justify-center">
          {fileUrl && (
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-destructive mb-4">فشل في تحميل الملف</p>
                  <a href={book?.file_url || fileUrl || '#'} download target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="gap-2"><Download className="h-4 w-4" />تحميل الملف مباشرة</Button>
                  </a>
                </div>
              }
              className="flex flex-col items-center gap-4"
            >
              {Array.from(new Array(numPages), (_, index) => {
                const pageNum = index + 1;
                const isLoaded = loadedPages.has(pageNum);
                const pageBookmarks = bookmarks.filter((b) => b.page === pageNum);
                const pageCommentsCount = pageCommentsCountMap.get(pageNum) || 0;
                return (
                  <div
                    key={`page_wrapper_${pageNum}`}
                    data-page={pageNum}
                    ref={(node) => pageRef(node, pageNum)}
                    className="relative group/page"
                    onPointerDown={(e) => startHold(e, pageNum)}
                    onPointerMove={moveHold}
                    onPointerUp={cancelHold}
                    onPointerCancel={cancelHold}
                    onPointerLeave={cancelHold}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    {/* Wattpad-style pinned comment markers (hold 1.5s on the page to add one) */}
                    {(() => {
                      const pinned = allPageComments.filter((c) => c.page === pageNum);
                      if (pinned.length === 0) return null;
                      const groups: { x: number; y: number; ids: string[] }[] = [];
                      pinned.forEach((c) => {
                        const cx = c.x ?? 4;
                        const cy = c.y ?? 3;
                        const g = groups.find((gg) => Math.abs(gg.x - cx) < 6 && Math.abs(gg.y - cy) < 3);
                        if (g) g.ids.push(c.id);
                        else groups.push({ x: cx, y: cy, ids: [c.id] });
                      });
                      return groups.map((g) => (
                        <button
                          key={g.ids[0]}
                          type="button"
                          onClick={(ev) => { ev.stopPropagation(); openMarker(pageNum, g.ids); }}
                          onPointerDown={(ev) => ev.stopPropagation()}
                          className="absolute z-20 -translate-x-1/2 -translate-y-full flex items-center gap-0.5 rounded-full rounded-bl-none bg-primary/85 text-primary-foreground px-1.5 py-0.5 text-[10px] font-bold shadow-md opacity-80 hover:opacity-100 hover:scale-110 transition-all"
                          style={{ left: `${Math.min(97, Math.max(3, g.x))}%`, top: `${Math.min(99, Math.max(4, g.y))}%` }}
                          aria-label={`${g.ids.length} تعليق`}
                        >
                          <MessageSquare className="h-3 w-3" />
                          {g.ids.length > 1 && <span>{g.ids.length}</span>}
                        </button>
                      ));
                    })()}
                    {holdPoint?.page === pageNum && (
                      <span
                        className="pointer-events-none absolute z-20 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary animate-ping"
                        style={{ left: `${holdPoint.x}%`, top: `${holdPoint.y}%` }}
                      />
                    )}

                    {/* Bookmark indicators on the page */}
                    {pageBookmarks.length > 0 && (
                      <div className="absolute top-0 right-1 z-10 flex flex-col gap-0.5">
                        {pageBookmarks.map((bm) => (
                          <div
                            key={bm.id}
                            className="w-5 h-7 rounded-b-sm shadow-md cursor-pointer hover:h-9 transition-all"
                            style={{ backgroundColor: bm.color }}
                            title={bm.name}
                            onClick={() => setPanelOpen(true)}
                          />
                        ))}
                      </div>
                    )}
                    {isLoaded ? (
                      <Page
                        pageNumber={pageNum}
                        scale={scale}
                        rotate={pageRotation}
                        className={`shadow-xl rounded-lg overflow-hidden ${invertPages && pageNum > 1 ? 'reader-page-inverted' : ''}`}
                        renderTextLayer={true}
                        renderAnnotationLayer={false}
                      />
                    ) : (
                      <div
                        style={{ height: `${800 * scale}px`, width: `${600 * scale}px` }}
                        className="bg-card rounded-lg flex items-center justify-center"
                      >
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}
            </Document>
          )}
        </div>
      </div>

      {/* Selection action bar */}
      {selection && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-card border border-border rounded-full shadow-2xl px-2.5 py-1.5 flex items-center gap-1.5 animate-fade-in backdrop-blur-md">
          <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={saveHighlight}>تمييز</Button>
          <div className="h-4 w-px bg-border" />
          <Button
            size="sm"
            variant="outline"
            className="gap-1 h-7 text-xs px-2"
            onClick={() => {
              setQuoteInitialText(selection);
              try {
                localStorage.setItem('reader-last-quote-text', selection);
              } catch {}
              setQuoteEditorOpen(true);
            }}
          >
            <QuoteIcon className="h-3 w-3" /> {t('createQuote')}
          </Button>
          <div className="h-4 w-px bg-border" />
          <Button
            size="sm"
            variant="ghost"
            className="gap-1 h-7 text-xs px-2"
            onClick={() => {
              setPageCommentsTargetPage(currentPage);
              setPageCommentsOpen(true);
            }}
          >
            <MessageSquare className="h-3 w-3" /> تعليق
          </Button>
          <div className="h-4 w-px bg-border" />
          <Button size="sm" variant="gold" className="gap-1 h-7 text-xs px-2" onClick={() => setAskOpen(true)}>
            <BookOpenCheck className="h-3 w-3" /> اسأل الكتاب
          </Button>
        </div>
      )}

      <AmbientPlayer />

      {askOpen && book && (
        <AskTheBook
          bookTitle={book.title}
          author={book.author}
          passage={selection}
          onClose={() => setAskOpen(false)}
        />
      )}

      {book && (
        <QuoteEditorDialog
          open={quoteEditorOpen}
          onOpenChange={(v) => {
            setQuoteEditorOpen(v);
            if (!v) setQuoteInitialText('');
          }}
          bookId={book.id}
          bookTitle={book.title}
          bookAuthor={book.author}
          initialText={quoteInitialText}
          initialPage={currentPage}
        />
      )}

      {book && (
        <PageCommentsDrawer
          open={pageCommentsOpen}
          onOpenChange={setPageCommentsOpen}
          bookId={book.id}
          bookTitle={book.title}
          currentPage={pageCommentsTargetPage || currentPage}
          totalPages={numPages}
          anchor={commentAnchor}
          focusIds={commentFocusIds}
        />
      )}

      {ocrOpen && (
        <QuoteOcrCapture
          targetRef={ocrTargetRef}
          onClose={() => setOcrOpen(false)}
          onExtracted={(extracted) => {
            setOcrOpen(false);
            setQuoteInitialText(extracted);
            try {
              localStorage.setItem('reader-last-quote-text', extracted);
            } catch {}
            setQuoteEditorOpen(true);
            toast.success(t('ocrDone'));
          }}
        />
      )}
    </div>
  );
};

export default BookReader;
