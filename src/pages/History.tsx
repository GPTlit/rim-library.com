import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History as HistoryIcon, Trash2, BookOpen, Clock, Award, ArrowLeft } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { getReadingHistory, clearReadingHistory, getTotalStoredReadingSeconds } from '@/lib/storage';
import { ReadingHistoryItem } from '@/lib/types';
import { formatReadingDurationArabic } from '@/lib/medals';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';

const History = () => {
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const { data: profile } = useUserProfile();
  const { toast } = useToast();

  useEffect(() => {
    setHistory(getReadingHistory());
  }, []);

  const totalReadingSeconds = Math.max(
    profile?.reading_seconds || 0,
    getTotalStoredReadingSeconds()
  );

  const handleClearHistory = () => {
    clearReadingHistory();
    setHistory([]);
    toast({
      title: 'تم المسح',
      description: 'تم مسح تاريخ القراءة',
    });
  };

  return (
    <Layout>
      <div className="section-padding">
        <div className="container-library max-w-5xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HistoryIcon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  تاريخ القراءة
                </h1>
                <p className="text-muted-foreground text-sm">
                  {history.length} كتاب في سجلك • إجمالي وقت القراءة: {formatReadingDurationArabic(totalReadingSeconds)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link to="/profile?tab=history">
                  <Award className="h-4 w-4 text-amber-500" />
                  أوسمتي ومجموعتي
                </Link>
              </Button>
              {history.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleClearHistory}
                >
                  <Trash2 className="h-4 w-4" />
                  مسح السجل
                </Button>
              )}
            </div>
          </div>

          {/* History List with Timers */}
          {history.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {history.map((item) => (
                <div
                  key={item.bookId}
                  className="flex flex-col rounded-2xl border border-border bg-card p-4 hover:shadow-md transition-shadow justify-between"
                >
                  <div className="flex gap-3.5 mb-3">
                    <div className="h-24 w-16 rounded-xl overflow-hidden bg-muted shrink-0 book-shadow border border-border">
                      <img
                        src={item.coverUrl || '/placeholder.svg'}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/book/${item.bookId}`}
                        className="font-bold text-foreground hover:text-primary transition-colors line-clamp-2 block leading-snug"
                      >
                        {item.title}
                      </Link>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{item.author}</p>
                      <span className="text-[11px] text-muted-foreground block mt-1.5">
                        آخر قراءة: {new Date(item.lastRead).toLocaleDateString('ar-MR', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {item.totalSecondsRead && item.totalSecondsRead > 0
                          ? formatReadingDurationArabic(item.totalSecondsRead)
                          : 'أقل من دقيقة'}
                      </span>
                    </div>
                    <Button asChild size="sm" variant="ghost" className="gap-1 text-xs">
                      <Link to={`/book/${item.bookId}/read`}>
                        <BookOpen className="h-3.5 w-3.5" />
                        متابعة القراءة
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-2xl border border-border p-8">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <h2 className="text-xl font-bold text-foreground mb-2">
                لا يوجد تاريخ قراءة مسجل
              </h2>
              <p className="text-muted-foreground mb-6 text-sm max-w-sm mx-auto">
                ابدأ بقراءة أي كتاب وسيتم احتساب دقائق قراءتك وفتح أوسمة الشرف تلقائياً.
              </p>
              <Link to="/">
                <Button variant="gold">تصفح المكتبة الآن</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default History;
