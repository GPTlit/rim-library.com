import { useRef, useState, useCallback } from 'react';
import { Loader2, ScanLine, X, Copy, Check, Quote as QuoteIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { OCR_LANGUAGES } from './quotePresets';
import { useToast } from '@/hooks/use-toast';

interface QuoteOcrCaptureProps {
  /** The DOM element to capture (e.g. the currently rendered PDF page / canvas wrapper). */
  targetRef: React.RefObject<HTMLElement>;
  onExtracted: (text: string) => void;
  onClose: () => void;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Fullscreen overlay that lets the user drag a rectangle over the reader page.
 * Extracts digital text instantly from the PDF text layer if available,
 * or runs optimized Tesseract OCR on scanned canvas images.
 * Automatically copies extracted text to clipboard and populates the Quote editor.
 */
export const QuoteOcrCapture = ({ targetRef, onExtracted, onClose }: QuoteOcrCaptureProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [lang, setLang] = useState('ara');
  const [rect, setRect] = useState<Rect | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const getPoint = (e: React.PointerEvent) => {
    const bounds = overlayRef.current?.getBoundingClientRect();
    if (!bounds) return { x: 0, y: 0 };
    return { x: e.clientX - bounds.left, y: e.clientY - bounds.top };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const p = getPoint(e);
    setDragStart(p);
    setRect({ x: p.x, y: p.y, w: 0, h: 0 });
    setExtractedText('');
    setError(null);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart) return;
    const p = getPoint(e);
    setRect({
      x: Math.min(dragStart.x, p.x),
      y: Math.min(dragStart.y, p.y),
      w: Math.abs(p.x - dragStart.x),
      h: Math.abs(p.y - dragStart.y),
    });
  };

  const onPointerUp = () => setDragStart(null);

  // Try extracting digital text directly from PDF DOM text layer
  const tryExtractFromTextLayer = useCallback((): string | null => {
    const overlay = overlayRef.current;
    if (!overlay || !rect || rect.w < 6 || rect.h < 6) return null;

    const overlayBounds = overlay.getBoundingClientRect();
    const selBox = {
      left: overlayBounds.left + rect.x,
      top: overlayBounds.top + rect.y,
      right: overlayBounds.left + rect.x + rect.w,
      bottom: overlayBounds.top + rect.y + rect.h,
    };

    // Search targetRef or active page elements across the document
    const root = targetRef.current || document.body;
    const textSpans = Array.from(
      root.querySelectorAll('.textLayer span, .react-pdf__Page__textContent span, [data-text-layer] span, .react-pdf__Page span')
    );

    const captured: string[] = [];
    textSpans.forEach((span) => {
      const b = span.getBoundingClientRect();
      const intersects = !(b.right < selBox.left || b.left > selBox.right || b.bottom < selBox.top || b.top > selBox.bottom);
      if (intersects && span.textContent?.trim()) {
        captured.push(span.textContent.trim());
      }
    });

    if (captured.length > 0) {
      const merged = captured.join(' ').replace(/\s+/g, ' ').trim();
      if (merged.length > 1) return merged;
    }
    return null;
  }, [rect, targetRef]);

  // Crop canvas region with contrast enhancement for OCR
  const cropToCanvas = useCallback((): HTMLCanvasElement | null => {
    const overlay = overlayRef.current;
    if (!overlay || !rect || rect.w < 6 || rect.h < 6) return null;

    const overlayBounds = overlay.getBoundingClientRect();
    const selBox = {
      left: overlayBounds.left + rect.x,
      top: overlayBounds.top + rect.y,
      right: overlayBounds.left + rect.x + rect.w,
      bottom: overlayBounds.top + rect.y + rect.h,
    };

    // Find the canvas intersecting the selected bounding box
    const root = targetRef.current || document.body;
    const canvases = Array.from(root.querySelectorAll('canvas')) as HTMLCanvasElement[];
    let sourceCanvas: HTMLCanvasElement | null = null;
    let maxArea = 0;

    for (const c of canvases) {
      const b = c.getBoundingClientRect();
      const ix = Math.max(0, Math.min(selBox.right, b.right) - Math.max(selBox.left, b.left));
      const iy = Math.max(0, Math.min(selBox.bottom, b.bottom) - Math.max(selBox.top, b.top));
      const area = ix * iy;
      if (area > maxArea) {
        maxArea = area;
        sourceCanvas = c;
      }
    }

    if (!sourceCanvas) return null;

    const targetBounds = sourceCanvas.getBoundingClientRect();
    const out = document.createElement('canvas');
    const scaleFactor = 1.5;
    out.width = Math.max(1, Math.round(rect.w * scaleFactor));
    out.height = Math.max(1, Math.round(rect.h * scaleFactor));
    const ctx = out.getContext('2d');
    if (!ctx) return null;

    const sx = Math.max(0, (overlayBounds.left + rect.x - targetBounds.left) * (sourceCanvas.width / targetBounds.width));
    const sy = Math.max(0, (overlayBounds.top + rect.y - targetBounds.top) * (sourceCanvas.height / targetBounds.height));
    const sw = Math.min(sourceCanvas.width - sx, rect.w * (sourceCanvas.width / targetBounds.width));
    const sh = Math.min(sourceCanvas.height - sy, rect.h * (sourceCanvas.height / targetBounds.height));

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, out.width, out.height);

    // Simple contrast & binarization pass to improve Arabic text OCR accuracy
    try {
      const imgData = ctx.getImageData(0, 0, out.width, out.height);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const contrast = gray < 135 ? Math.max(0, gray - 30) : Math.min(255, gray + 30);
        d[i] = contrast;
        d[i + 1] = contrast;
        d[i + 2] = contrast;
      }
      ctx.putImageData(imgData, 0, 0);
    } catch {
      // Continue if getImageData fails (e.g. cross-origin canvas)
    }

    return out;
  }, [rect, targetRef]);

  const handleCopyExtracted = async (tToCopy: string) => {
    try {
      await navigator.clipboard.writeText(tToCopy);
      setCopied(true);
      toast({ title: 'تم نسخ النص إلى الحافظة' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleExtract = async () => {
    setError(null);
    setExtractedText('');

    // 1. Try digital text extraction first (instant, 100% accurate)
    const directText = tryExtractFromTextLayer();
    if (directText) {
      setExtractedText(directText);
      try {
        await navigator.clipboard.writeText(directText);
      } catch {}
      toast({
        title: 'تم استخراج النص ونسخه بنجاح',
        description: 'تم تجهيز النص في اقتباسك دون الحاجة لكتابته',
      });
      onExtracted(directText);
      return;
    }

    // 2. Fall back to OCR on the canvas
    const canvas = cropToCanvas();
    if (!canvas) {
      setError(t('ocrFailed') || 'تعذر تحديد منطقة النص، يرجى المحاولة مرة أخرى');
      return;
    }

    setRunning(true);
    setProgress(5);

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker(lang, 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const { data } = await worker.recognize(canvas);
      await worker.terminate();

      const text = (data.text || '').replace(/\r?\n+/g, ' ').trim();
      if (!text) {
        setError(t('ocrFailed') || 'لم يتم العثور على نص واضح في هذه المنطقة');
      } else {
        setExtractedText(text);
        try {
          await navigator.clipboard.writeText(text);
        } catch {}
        toast({
          title: 'تم استخراج النص ونسخه بنجاح',
          description: 'تم تجهيز النص في اقتباسك تلقائياً',
        });
        onExtracted(text);
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setError(t('ocrFailed') || 'حدث خطأ أثناء معالجة الصورة، يرجى إعادة المحاولة');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-[0.5px] flex flex-col font-tajawal animate-in fade-in select-none">
      {/* Top action header */}
      <div className="flex items-center justify-between gap-2 p-3 bg-card border-b border-border shadow-md">
        <div className="flex items-center gap-2 min-w-0">
          <ScanLine className="h-5 w-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-sm text-foreground">استخراج نص عبر المسح الضوئي (OCR)</h3>
            <p className="text-[11px] text-muted-foreground truncate">{t('ocrDragHint')}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Drag overlay */}
      <div
        ref={overlayRef}
        className="flex-1 relative overflow-hidden touch-none cursor-crosshair"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {rect && rect.w > 2 && rect.h > 2 && (
          <div
            className="absolute border-2 border-primary bg-primary/15 rounded shadow-lg pointer-events-none transition-all duration-75"
            style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
          >
            <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white font-mono">
              {Math.round(rect.w)} × {Math.round(rect.h)}
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls panel */}
      <div className="p-4 bg-card border-t border-border space-y-3 shadow-2xl">
        {extractedText && (
          <div className="p-3 bg-secondary/60 border border-primary/30 rounded-xl space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> تم استخراج النص ونسخه تلقائياً:
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] gap-1"
                onClick={() => handleCopyExtracted(extractedText)}
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copied ? 'تم النسخ' : 'نسخ'}
              </Button>
            </div>
            <p className="text-xs text-foreground bg-background/70 p-2.5 rounded-lg border border-border/60 max-h-24 overflow-y-auto leading-relaxed select-text font-serif">
              "{extractedText}"
            </p>
            <Button
              variant="gold"
              className="w-full gap-2 h-9 text-xs font-bold"
              onClick={() => onExtracted(extractedText)}
            >
              <QuoteIcon className="h-3.5 w-3.5" />
              إنشاء اقتباس بهذا النص الآن
            </Button>
          </div>
        )}

        {error && <p className="text-xs text-destructive font-medium">{error}</p>}

        <div className="flex items-center gap-2">
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger className="w-36 sm:w-40 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OCR_LANGUAGES.map((l) => (
                <SelectItem key={l.id} value={l.id} className="text-xs">{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="gold"
            className="flex-1 gap-2 h-9 text-xs font-bold"
            disabled={!rect || rect.w < 8 || rect.h < 8 || running}
            onClick={handleExtract}
          >
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري المسح... {progress}%
              </>
            ) : (
              <>
                <ScanLine className="h-4 w-4" />
                <span>استخراج النص ونسخه</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
