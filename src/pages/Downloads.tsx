import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, Trash2, BookOpen, WifiOff, HardDrive, Inbox, Lightbulb, FolderDown } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOfflineBooks, DeviceDownloadEntry } from '@/hooks/useOfflineBooks';
import { isQahwaNativeAvailable } from '@/lib/qahwaNative';

const Downloads = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const {
    offlineBooks,
    isLoading,
    removeOfflineBook,
    getTotalStorageUsed,
    formatFileSize,
    deviceDownloads,
    refreshDeviceDownloads,
    removeDeviceDownload,
  } = useOfflineBooks();

  const isNative = isQahwaNativeAvailable();
  const [removeTarget, setRemoveTarget] = useState<DeviceDownloadEntry | null>(null);

  // On mount: validate device downloads still exist on disk; drop stale entries.
  useEffect(() => {
    if (!isNative) return;
    (async () => {
      const removed = await refreshDeviceDownloads();
      if (removed.length > 0) {
        toast({ title: t('staleDownloadsRemoved') });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNative]);

  const list = isNative ? deviceDownloads : offlineBooks;
  const totalSize = isNative
    ? deviceDownloads.reduce((sum, d) => sum + (d.size || 0), 0)
    : getTotalStorageUsed();

  const handleRemove = (bookId: string, title: string, deleteFile: boolean) => {
    if (isNative) {
      removeDeviceDownload(bookId, deleteFile);
    } else {
      removeOfflineBook(bookId);
    }
    toast({
      title: t('deleted'),
      description: t('deletedFromList').replace('{title}', title),
    });
    setRemoveTarget(null);
  };

  const handleClearAll = () => {
    if (isNative) {
      deviceDownloads.forEach((d) => removeDeviceDownload(d.bookId, false));
    } else {
      offlineBooks.forEach((book) => removeOfflineBook(book.id));
    }
    toast({ title: t('clearedAll'), description: t('clearedAllDesc') });
  };

  return (
    <Layout>
      <div className="section-padding">
        <div className="container-library">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gold-gradient">
                <Download className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">{t('savedBooks')}</h1>
                <p className="text-muted-foreground">
                  {list.length} {t('booksAvailableOffline')}
                </p>
              </div>
            </div>
            {list.length > 0 && (
              <Button variant="outline" className="gap-2 text-destructive hover:text-destructive" onClick={handleClearAll}>
                <Trash2 className="h-4 w-4" />
                {t('clearAll')}
              </Button>
            )}
          </div>

          {/* Storage Info */}
          {list.length > 0 && (
            <div className="mb-6 p-4 rounded-lg bg-secondary/50 flex items-center gap-3">
              <HardDrive className="h-5 w-5 text-primary" />
              <span className="text-sm text-foreground">
                {t('storageUsed')}: {formatFileSize(totalSize)}
              </span>
            </div>
          )}

          {/* Downloads List */}
          {isLoading ? (
            <div className="text-center py-16">
              <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            </div>
          ) : list.length > 0 ? (
            <div className="space-y-4">
              {isNative
                ? deviceDownloads.map((d, index) => (
                    <div
                      key={d.bookId}
                      className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border/50 animate-fade-in-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <Link to={`/book/${d.bookId}`}>
                        <div className="w-16 h-24 rounded-lg overflow-hidden book-shadow bg-secondary flex-shrink-0">
                          {d.coverUrl && d.coverUrl !== '/placeholder.svg' ? (
                            <img src={d.coverUrl} alt={d.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/book/${d.bookId}`}>
                          <h3 className="font-bold text-foreground hover:text-primary transition-colors line-clamp-1">{d.title}</h3>
                        </Link>
                        <p className="text-sm text-muted-foreground">{d.author}</p>
                        <p className="text-xs text-muted-foreground truncate">{d.fileName}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <FolderDown className="h-3 w-3" />
                            {t('savedOnDeviceDownloads')}
                          </span>
                          <span className="text-xs text-muted-foreground">{formatFileSize(d.size)}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(d.downloadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link to={`/book/${d.bookId}/read`}>
                          <Button variant="outline" size="sm" className="gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span className="hidden sm:inline">{t('openAction')}</span>
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setRemoveTarget(d)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                : offlineBooks.map((book, index) => (
                    <div
                      key={book.id}
                      className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border/50 animate-fade-in-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <Link to={`/book/${book.id}`}>
                        <div className="w-16 h-24 rounded-lg overflow-hidden book-shadow bg-secondary flex-shrink-0">
                          {book.coverUrl && book.coverUrl !== '/placeholder.svg' ? (
                            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/book/${book.id}`}>
                          <h3 className="font-bold text-foreground hover:text-primary transition-colors line-clamp-1">{book.title}</h3>
                        </Link>
                        <p className="text-sm text-muted-foreground">{book.author}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <WifiOff className="h-3 w-3" />
                            {t('savedInBrowser')}
                          </span>
                          <span className="text-xs text-muted-foreground">{formatFileSize(book.fileSize)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link to={`/book/${book.id}/read`}>
                          <Button variant="outline" size="sm" className="gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span className="hidden sm:inline">{t('readAction')}</span>
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemove(book.id, book.title, false)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Inbox className="h-16 w-16 mx-auto mb-6 text-muted-foreground/40" />
              <h2 className="text-xl font-bold text-foreground mb-2">{t('noSavedBooks')}</h2>
              <p className="text-muted-foreground mb-6">{t('downloadBooksHint')}</p>
              <Link to="/">
                <Button variant="gold">{t('browseLibraryAction')}</Button>
              </Link>
            </div>
          )}

          {/* Help Text */}
          <div className="mt-8 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1 inline-flex items-center gap-1">
              <Lightbulb className="h-4 w-4" /> {t('downloadsTip')}:
            </p>
            <p>{t('downloadsTipDesc')}</p>
          </div>
        </div>
      </div>

      {/* Remove device-download dialog */}
      <Dialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <DialogContent className="sm:max-w-md font-tajawal">
          <DialogHeader>
            <DialogTitle>{t('removeDownloadTitle')}</DialogTitle>
            <DialogDescription>{t('removeDownloadDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => removeTarget && handleRemove(removeTarget.bookId, removeTarget.title, false)}
            >
              {t('removeFromListOnly')}
            </Button>
            <Button
              variant="destructive"
              className="w-full justify-start gap-2"
              onClick={() => removeTarget && handleRemove(removeTarget.bookId, removeTarget.title, true)}
            >
              <Trash2 className="h-4 w-4" />
              {t('deleteFileAlso')}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setRemoveTarget(null)}>
              {t('cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Downloads;
