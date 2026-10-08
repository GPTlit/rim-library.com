import { useState, useEffect, useCallback } from 'react';
import { QahwaNative, isQahwaNativeAvailable } from '@/lib/qahwaNative';
import { buildQahwaDownloadFileName } from '@/lib/capacitorFeatures';

const OFFLINE_BOOKS_KEY = 'maktaba-mauritania-offline-books';
const OFFLINE_INDEX_KEY = 'maktaba-mauritania-offline-index';
const OFFLINE_DIR = 'MauritaniaLibrary';
const DEVICE_DOWNLOADS_KEY = 'qahwa-device-downloads';

// Detect Capacitor native runtime
const isNative = (): boolean => {
  try {
    // @ts-ignore
    return !!(window as any)?.Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
};

// Lazy-loaded Capacitor Filesystem module
let _fs: any = null;
const getFs = async () => {
  if (_fs) return _fs;
  try {
    const mod = await import('@capacitor/filesystem');
    _fs = mod;
    return mod;
  } catch {
    return null;
  }
};

export interface OfflineBook {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  fileData: string; // base64 data URL (web) OR blob:/file URL (native)
  fileType: string;
  savedAt: string;
  fileSize: number;
}

interface NativeIndexEntry {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  fileType: string;
  savedAt: string;
  fileSize: number;
  filename: string; // path inside OFFLINE_DIR in Directory.Data
  mimeType: string;
}

export interface DeviceDownloadEntry {
  bookId: string;
  title: string;
  author: string;
  coverUrl: string;
  fileName: string;
  uri: string;
  size: number;
  type: string; // mime type, e.g. 'application/pdf'
  downloadedAt: string;
  platform: string;
}

export const loadDeviceDownloads = (): DeviceDownloadEntry[] => {
  try {
    const raw = localStorage.getItem(DEVICE_DOWNLOADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveDeviceDownloads = (entries: DeviceDownloadEntry[]) => {
  localStorage.setItem(DEVICE_DOWNLOADS_KEY, JSON.stringify(entries));
};

const base64ToBlobUrl = (base64: string, mimeType: string): string => {
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  return URL.createObjectURL(new Blob([ab], { type: mimeType }));
};

/**
 * Returns a usable blob: URL to read a book offline, preferring (in order):
 * 1) a real on-device Qahwa download (native Android, via QahwaNative.readFile)
 * 2) the app's internal offline cache (native Capacitor Filesystem)
 * 3) the web localStorage offline cache (base64 data URL)
 * Usable outside React components (e.g. from BookReader).
 */
export const getOfflinePdfSource = async (bookId: string): Promise<string | null> => {
  // 1) Real device download tracked by Qahwa
  if (isQahwaNativeAvailable()) {
    const entry = loadDeviceDownloads().find((e) => e.bookId === bookId);
    if (entry) {
      try {
        const { base64 } = await QahwaNative.readFile({ uri: entry.uri });
        if (base64) return base64ToBlobUrl(base64, entry.type || 'application/pdf');
      } catch (e) {
        console.warn('getOfflinePdfSource: readFile failed for device download', e);
      }
    }
  }

  // 2) Native in-app offline cache
  if (isNative()) {
    const idx = loadNativeIndex().find((e) => e.id === bookId);
    if (idx) {
      const url = await nativeFileToBlobUrl(idx.filename, idx.mimeType);
      if (url) return url;
    }
  }

  // 3) Web offline cache (base64 data URL)
  try {
    const raw = localStorage.getItem(OFFLINE_BOOKS_KEY);
    const books: OfflineBook[] = raw ? JSON.parse(raw) : [];
    const b = books.find((x) => x.id === bookId);
    if (b?.fileData) return b.fileData;
  } catch {
    /* noop */
  }

  return null;
};

const loadNativeIndex = (): NativeIndexEntry[] => {
  try {
    const raw = localStorage.getItem(OFFLINE_INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveNativeIndex = (entries: NativeIndexEntry[]) => {
  localStorage.setItem(OFFLINE_INDEX_KEY, JSON.stringify(entries));
};

// Resolve a native file to a usable URL for the WebView (blob: URL).
const nativeFileToBlobUrl = async (filename: string, mimeType: string): Promise<string | null> => {
  const fs = await getFs();
  if (!fs) return null;
  try {
    const res = await fs.Filesystem.readFile({
      path: `${OFFLINE_DIR}/${filename}`,
      directory: fs.Directory.Documents,
    });
    const base64 = typeof res.data === 'string' ? res.data : '';
    if (!base64) return null;
    const byteString = atob(base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return URL.createObjectURL(new Blob([ab], { type: mimeType }));
  } catch (e) {
    console.error('Failed to read offline file', filename, e);
    return null;
  }
};

export const useOfflineBooks = () => {
  const [offlineBooks, setOfflineBooks] = useState<OfflineBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // For native: id -> blob URL (created from Filesystem read)
  const [nativeUrls, setNativeUrls] = useState<Record<string, string>>({});
  // Real on-device downloads (Qahwa native Android, saved via QahwaNative.savePdfToDownloads)
  const [deviceDownloads, setDeviceDownloads] = useState<DeviceDownloadEntry[]>(() => loadDeviceDownloads());

  const loadOfflineBooks = useCallback(async () => {
    try {
      if (isNative()) {
        // Ensure dir exists (best effort)
        const fs = await getFs();
        if (fs) {
          try {
            await fs.Filesystem.mkdir({
              path: OFFLINE_DIR,
              directory: fs.Directory.Documents,
              recursive: true,
            });
          } catch {/* exists */}
        }
        const index = loadNativeIndex();
        // Build placeholder list (URLs filled lazily / below)
        const list: OfflineBook[] = index.map((e) => ({
          id: e.id,
          title: e.title,
          author: e.author,
          coverUrl: e.coverUrl,
          fileData: '', // resolved below to blob URL
          fileType: e.fileType,
          savedAt: e.savedAt,
          fileSize: e.fileSize,
        }));
        setOfflineBooks(list);

        // Resolve blob URLs in background
        const urlMap: Record<string, string> = {};
        await Promise.all(
          index.map(async (e) => {
            const url = await nativeFileToBlobUrl(e.filename, e.mimeType);
            if (url) urlMap[e.id] = url;
          })
        );
        setNativeUrls(urlMap);
      } else {
        const data = localStorage.getItem(OFFLINE_BOOKS_KEY);
        setOfflineBooks(data ? JSON.parse(data) : []);
      }
    } catch {
      setOfflineBooks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOfflineBooks();
    // Cleanup blob URLs on unmount
    return () => {
      Object.values(nativeUrls).forEach((u) => {
        try { URL.revokeObjectURL(u); } catch {}
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadOfflineBooks]);

  const saveBookOffline = async (
    book: {
      id: string;
      title: string;
      author: string;
      coverUrl: string;
      fileUrl: string;
      fileType: string;
    },
    onProgress?: (progress: number) => void
  ): Promise<boolean> => {
    try {
      onProgress?.(10);

      // Fetch the file
      const response = await fetch(book.fileUrl);
      if (!response.ok) throw new Error('Failed to fetch file');

      onProgress?.(30);

      const blob = await response.blob();
      const fileSize = blob.size;
      const mimeType = blob.type || 'application/pdf';

      onProgress?.(50);

      // On web: also trigger a real browser download so the file lands in the
      // user's Downloads folder (in addition to the offline-cache copy below).
      if (!isNative()) {
        try {
          const safeTitle = (book.title || book.id).replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80);
          const ext = (book.fileType || 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '') || 'pdf';
          const dlUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = dlUrl;
          a.download = `${safeTitle}.${ext}`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(dlUrl), 5000);
        } catch (e) {
          console.warn('Browser download trigger failed', e);
        }
      }

      // Native path: write to private app sandbox via Capacitor Filesystem.
      // Files in Directory.Data are NOT visible in the device's gallery / file
      // manager — they live in the app's internal storage and are only
      // accessible from inside the app.
      if (isNative()) {
        const fs = await getFs();
        if (!fs) {
          console.warn('Capacitor Filesystem not available, falling back to localStorage');
        } else {
          // Convert blob -> base64 (no data: prefix) for Filesystem.writeFile
          const base64 = await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onloadend = () => {
              const result = r.result as string;
              const idx = result.indexOf(',');
              resolve(idx >= 0 ? result.slice(idx + 1) : result);
            };
            r.onerror = () => reject(r.error);
            r.readAsDataURL(blob);
          });
          onProgress?.(75);
          try {
            await fs.Filesystem.mkdir({
              path: OFFLINE_DIR,
              directory: fs.Directory.Documents,
              recursive: true,
            });
          } catch {/* exists */}
          // Save with a readable filename so the user can see the downloaded
          // book in their phone's file manager (Documents/MauritaniaLibrary).
          const safeTitle = (book.title || book.id)
            .replace(/[\\/:*?"<>|]+/g, '_')
            .slice(0, 80)
            .trim() || book.id;
          const ext = (book.fileType || 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '') || 'pdf';
          const filename = `${safeTitle}__${book.id}.${ext}`;
          await fs.Filesystem.writeFile({
            path: `${OFFLINE_DIR}/${filename}`,
            data: base64,
            directory: fs.Directory.Documents,
          });
          // Update index
          const index = loadNativeIndex().filter((e) => e.id !== book.id);
          const entry: NativeIndexEntry = {
            id: book.id,
            title: book.title,
            author: book.author,
            coverUrl: book.coverUrl,
            fileType: book.fileType,
            savedAt: new Date().toISOString(),
            fileSize,
            filename,
            mimeType,
          };
          saveNativeIndex([entry, ...index]);

          // Refresh state + register blob URL
          const url = await nativeFileToBlobUrl(filename, mimeType);
          setOfflineBooks((prev) => {
            const filtered = prev.filter((b) => b.id !== book.id);
            return [
              {
                id: book.id,
                title: book.title,
                author: book.author,
                coverUrl: book.coverUrl,
                fileData: '',
                fileType: book.fileType,
                savedAt: entry.savedAt,
                fileSize,
              },
              ...filtered,
            ];
          });
          if (url) setNativeUrls((prev) => ({ ...prev, [book.id]: url }));
          onProgress?.(100);
          return true;
        }
      }
      
      // Convert to base64
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = 50 + (event.loaded / event.total) * 40;
            onProgress?.(progress);
          }
        };
        reader.onloadend = () => {
          try {
            const base64 = reader.result as string;
            
            // Get existing books
            const existingData = localStorage.getItem(OFFLINE_BOOKS_KEY);
            const existingBooks: OfflineBook[] = existingData ? JSON.parse(existingData) : [];
            
            // Remove if exists
            const filtered = existingBooks.filter((b) => b.id !== book.id);
            
            // Add new
            const newBook: OfflineBook = {
              id: book.id,
              title: book.title,
              author: book.author,
              coverUrl: book.coverUrl,
              fileData: base64,
              fileType: book.fileType,
              savedAt: new Date().toISOString(),
              fileSize,
            };
            
            const updated = [newBook, ...filtered];
            
            // Try to save
            try {
              localStorage.setItem(OFFLINE_BOOKS_KEY, JSON.stringify(updated));
              setOfflineBooks(updated);
              onProgress?.(100);
              resolve(true);
            } catch (storageError) {
              // Storage quota exceeded
              console.error('Storage quota exceeded:', storageError);
              resolve(false);
            }
          } catch (error) {
            console.error('Error saving offline book:', error);
            resolve(false);
          }
        };
        reader.onerror = () => resolve(false);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error downloading book for offline:', error);
      return false;
    }
  };

  const getOfflineBook = (bookId: string): OfflineBook | null => {
    return offlineBooks.find((b) => b.id === bookId) || null;
  };

  const removeOfflineBook = async (bookId: string): Promise<void> => {
    try {
      if (isNative()) {
        const fs = await getFs();
        const index = loadNativeIndex();
        const entry = index.find((e) => e.id === bookId);
        if (fs && entry) {
          try {
            await fs.Filesystem.deleteFile({
              path: `${OFFLINE_DIR}/${entry.filename}`,
              directory: fs.Directory.Documents,
            });
          } catch (e) {
            console.warn('deleteFile failed', e);
          }
        }
        saveNativeIndex(index.filter((e) => e.id !== bookId));
        // Revoke and drop blob URL
        if (nativeUrls[bookId]) {
          try { URL.revokeObjectURL(nativeUrls[bookId]); } catch {}
          setNativeUrls((prev) => {
            const next = { ...prev };
            delete next[bookId];
            return next;
          });
        }
      } else {
        const data = localStorage.getItem(OFFLINE_BOOKS_KEY);
        const existing: OfflineBook[] = data ? JSON.parse(data) : [];
        const filtered = existing.filter((b) => b.id !== bookId);
        localStorage.setItem(OFFLINE_BOOKS_KEY, JSON.stringify(filtered));
      }
      setOfflineBooks((prev) => prev.filter((b) => b.id !== bookId));
    } catch (error) {
      console.error('Error removing offline book:', error);
    }
  };

  const isBookOffline = (bookId: string): boolean => {
    return offlineBooks.some((b) => b.id === bookId);
  };

  const getOfflineBookUrl = (bookId: string): string | null => {
    // On native, return the blob URL produced from the on-device file.
    if (isNative()) {
      return nativeUrls[bookId] || null;
    }
    const book = getOfflineBook(bookId);
    if (!book) return null;
    return book.fileData; // base64 data URL on web
  };

  const getTotalStorageUsed = (): number => {
    return offlineBooks.reduce((total, book) => total + book.fileSize, 0);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // --- Real device downloads (Qahwa Android) ---------------------------

  const findDeviceDownload = (bookId: string): DeviceDownloadEntry | null =>
    deviceDownloads.find((e) => e.bookId === bookId) || null;

  /** Checks via the native plugin whether a saved device download still exists on disk. */
  const checkDeviceDownloadExists = async (entry: DeviceDownloadEntry): Promise<boolean> => {
    if (!isQahwaNativeAvailable()) return false;
    try {
      const res = await QahwaNative.fileExists({ uri: entry.uri });
      return !!res?.exists;
    } catch {
      return false;
    }
  };

  /**
   * Downloads the book's PDF and saves it to the device's public Downloads
   * folder via the native QahwaNative plugin. Only works on native Android.
   */
  const downloadBookToDevice = async (
    book: { id: string; title: string; author: string; coverUrl: string; fileUrl: string },
    onProgress?: (progress: number) => void
  ): Promise<{ ok: boolean; entry?: DeviceDownloadEntry; error?: string }> => {
    if (!isQahwaNativeAvailable()) {
      return { ok: false, error: 'native-unavailable' };
    }
    try {
      onProgress?.(10);
      const response = await fetch(book.fileUrl);
      if (!response.ok) throw new Error('Failed to fetch file');
      onProgress?.(35);
      const blob = await response.blob();
      const mimeType = blob.type || 'application/pdf';

      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onloadend = () => {
          const result = r.result as string;
          const idx = result.indexOf(',');
          resolve(idx >= 0 ? result.slice(idx + 1) : result);
        };
        r.onerror = () => reject(r.error);
        r.readAsDataURL(blob);
      });
      onProgress?.(65);

      const fileName = buildQahwaDownloadFileName(book.title, book.id);
      const result = await QahwaNative.savePdfToDownloads({ base64, fileName });
      onProgress?.(90);

      const entry: DeviceDownloadEntry = {
        bookId: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl,
        fileName: result.fileName || fileName,
        uri: result.uri,
        size: result.size ?? blob.size,
        type: mimeType,
        downloadedAt: new Date().toISOString(),
        platform: 'android',
      };

      const next = [entry, ...loadDeviceDownloads().filter((e) => e.bookId !== book.id)];
      saveDeviceDownloads(next);
      setDeviceDownloads(next);
      onProgress?.(100);
      return { ok: true, entry };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'download-failed' };
    }
  };

  /** Removes a device-download entry from the tracked list, optionally deleting the real file too. */
  const removeDeviceDownload = async (bookId: string, alsoDeleteFile: boolean): Promise<void> => {
    const entry = findDeviceDownload(bookId);
    if (alsoDeleteFile && entry && isQahwaNativeAvailable()) {
      try {
        await QahwaNative.deleteFile({ uri: entry.uri });
      } catch (e) {
        console.warn('removeDeviceDownload: deleteFile failed', e);
      }
    }
    const next = loadDeviceDownloads().filter((e) => e.bookId !== bookId);
    saveDeviceDownloads(next);
    setDeviceDownloads(next);
  };

  /**
   * Validates every tracked device download against the real filesystem and
   * drops entries whose file no longer exists. Returns the removed entries
   * so the caller can show a toast.
   */
  const refreshDeviceDownloads = async (): Promise<DeviceDownloadEntry[]> => {
    const current = loadDeviceDownloads();
    if (!isQahwaNativeAvailable() || current.length === 0) {
      setDeviceDownloads(current);
      return [];
    }
    const removed: DeviceDownloadEntry[] = [];
    const kept: DeviceDownloadEntry[] = [];
    await Promise.all(
      current.map(async (entry) => {
        const exists = await checkDeviceDownloadExists(entry);
        if (exists) kept.push(entry);
        else removed.push(entry);
      })
    );
    saveDeviceDownloads(kept);
    setDeviceDownloads(kept);
    return removed;
  };

  return {
    offlineBooks,
    isLoading,
    saveBookOffline,
    getOfflineBook,
    removeOfflineBook,
    isBookOffline,
    getOfflineBookUrl,
    getTotalStorageUsed,
    formatFileSize,
    refresh: loadOfflineBooks,
    // Real device downloads (Qahwa Android)
    deviceDownloads,
    findDeviceDownload,
    checkDeviceDownloadExists,
    downloadBookToDevice,
    removeDeviceDownload,
    refreshDeviceDownloads,
  };
};
