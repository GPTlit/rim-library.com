import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Download, ZoomIn, ZoomOut, Loader2, WifiOff, BookmarkPlus, Bookmark as BookmarkIcon, List, Moon, Sun, RotateCw, RotateCcw, Smartphone, Check, Menu } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from '@/components/ui/button';
import { useBook } from '@/hooks/useBooks';
import { addToReadingHistory } from '@/lib/storage';
import { useOfflineBooks } from '@/hooks/useOfflineBooks';
import { getBookmarks, addBookmark, removeBookmark, getLastBookmark, Bookmark } from '@/lib/bookmarks';
import BookmarkPanel from '@/components/books/BookmarkPanel';
import { toast } from 'sonner';
import { AmbientPlayer } from '@/components/books/AmbientPlayer';
import { AskTheBook } from '@/components/books/AskTheBook';
import { useReadingPresence } from '@/hooks/useReadingPresence';
import { useReadingTime } from '@/hooks/useReadingTime';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles } from 'lucide-react';
import { useBookSessionTimer } from '@/hooks/useBookSessionTimer';
import { ReaderSessionTimer } from '@/components/books/ReaderSessionTimer';
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
  const { data: book, isLoading } = useBook(id || '');
  const { getOfflineBookUrl } = useOfflineBooks();
  const { user } = useAuth();
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
    if (id && book) {
      const offlineUrl = getOfflineBookUrl(id);
      if (offlineUrl) {
        setFileUrl(offlineUrl);
        setIsOfflineMode(true);
      } else {
        setFileUrl(book.file_url);
        setIsOfflineMode(false);
      }
      addToReadingHistory({
        bookId: book.id, title: book.title, author: book.author,
        coverUrl: book.cover_url || '/placeholder.svg', lastRead: new Date().toISOString(),
      });
    }
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

  // Track text selection for "Ask the book" + highlight save
  useEffect(() => {
    const onUp = () => {
      const sel = window.getSelection?.()?.toString().trim() || '';
      setSelection(sel);
    };
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);
    return () => {
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchend', onUp);
    };
  }, []);

  const saveHighlight = async () => {
    if (!user || !id || !selection) return;
    await supabase.from('book_highlights').insert({ book_id: id, user_id: user.id, page: currentPage, text: selection });
    toast.success('تم تمييز النص');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!book) {
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
    <div className="min-h-screen bg-muted flex flex-col">
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
          <div className="flex items-center justify-between h-14 gap-2 overflow-hidden">
            {/* Left section: Back button + Title & Author + Session Timer */}
            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink">
              <Link to={`/book/${book.id}`} className="shrink-0">
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0"><ArrowRight className="h-5 w-5" /></Button>
              </Link>
              <div className="min-w-0 shrink">
                <h1 className="font-bold text-foreground text-sm sm:text-base truncate max-w-[110px] sm:max-w-[200px] md:max-w-xs">{book.title}</h1>
                <p className="text-[11px] text-muted-foreground truncate hidden sm:block">{book.author}</p>
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
                bookTitle={book.title}
                medalsProgress={sessionTimer.medalsProgress}
                className="shrink-0"
              />
            </div>

            {/* Center section: Page counter & progress */}
            <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-full bg-secondary/50 border border-border/60">
              <span className="text-xs font-mono font-medium text-foreground whitespace-nowrap">{currentPage}/{numPages}</span>
              <span className="text-[10px] font-bold text-primary px-1.5 py-0.2 rounded bg-primary/10 hidden sm:inline-block">
                {Math.round(scrollProgress)}%
              </span>
            </div>

            {/* Right section: Scaling buttons (visible on page) + Quick Bookmark + Three-Lines Menu Button (☰) */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Scaling / Zoom Controls directly visible on the page */}
              <div className="flex items-center gap-0.5 sm:gap-1 bg-secondary/60 rounded-full px-1 sm:px-1.5 py-0.5 border border-border/60">
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

              {/* Bookmark Button */}
              <Button
                variant={currentPageBookmarked ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
                onClick={handleAddBookmark}
                title={`إضافة علامة - صفحة ${currentPage}`}
              >
                {currentPageBookmarked ? <BookmarkIcon className="h-4 w-4 text-primary" /> : <BookmarkPlus className="h-4 w-4" />}
              </Button>

              {/* Bookmarks List Panel Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 relative"
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

              {/* Three-Lines Menu Button (☰ يحتوي فقط على: الوضع الفاتح/الداكن، التدوير، والتحميل) */}
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
                <DropdownMenuContent align="end" className="w-56 p-2 text-right font-tajawal space-y-1">
                  {/* 1. Light Mode / Dark Mode button */}
                  <DropdownMenuItem onClick={togglePageTheme} className="flex items-center justify-between cursor-pointer py-2">
                    <span className="flex items-center gap-2.5">
                      {invertPages ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-primary" />}
                      {invertPages ? 'الوضع الفاتح للصفحات' : 'الوضع الداكن للصفحات'}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{invertPages ? 'مفعل' : 'عادي'}</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* 2. Rotation buttons */}
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

                  {/* 3. Download button */}
                  <DropdownMenuItem asChild className="cursor-pointer py-2">
                    <a href={book.file_url} download target="_blank" rel="noopener noreferrer" className="flex items-center justify-between w-full">
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
                  <a href={book.file_url} download target="_blank" rel="noopener noreferrer">
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
                return (
                  <div
                    key={`page_wrapper_${pageNum}`}
                    data-page={pageNum}
                    ref={(node) => pageRef(node, pageNum)}
                    className="relative"
                  >
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
                        className={`shadow-xl rounded-lg overflow-hidden ${invertPages ? 'reader-page-inverted' : ''}`}
                        renderTextLayer={false}
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
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-card border border-border rounded-full shadow-2xl px-2 py-1 flex items-center gap-1 animate-fade-in">
          <Button size="sm" variant="ghost" onClick={saveHighlight}>تمييز</Button>
          <div className="h-5 w-px bg-border" />
          <Button size="sm" variant="gold" className="gap-1" onClick={() => setAskOpen(true)}>
            <Sparkles className="h-3 w-3" /> اسأل الكتاب
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
    </div>
  );
};

export default BookReader;
