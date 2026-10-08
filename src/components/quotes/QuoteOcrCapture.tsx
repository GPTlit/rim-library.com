import { useRef, useState, useCallback } from 'react';
import { Loader2, ScanLine, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { OCR_LANGUAGES } from './quotePresets';

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
 * Fullscreen overlay that lets the user drag a rectangle over the reader page,
 * crops that region to a canvas, then runs tesseract.js only when the user
 * explicitly taps "Extract" (keeps the heavy OCR worker lazy / on-demand).
 */
export const QuoteOcrCapture = ({ targetRef, onExtracted, onClose }: QuoteOcrCaptureProps) => {
  const { t } = useLanguage();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [lang, setLang] = useState('ara');
  const [rect, setRect] = useState<Rect | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const cropToCanvas = useCallback((): HTMLCanvasElement | null => {
    const target = targetRef.current;
    const overlay = overlayRef.current;
    if (!target || !overlay || !rect || rect.w < 8 || rect.h < 8) return null;

    // Find the best source: a <canvas> rendered by react-pdf inside target
    const sourceCanvas = target.querySelector('canvas') as HTMLCanvasElement | null;
    const overlayBounds = overlay.getBoundingClientRect();
    const targetBounds = target.getBoundingClientRect();

    const out = document.createElement('canvas');
    out.width = Math.max(1, Math.round(rect.w));
    out.height = Math.max(1, Math.round(rect.h));
    const ctx = out.getContext('2d');
    if (!ctx) return null;

    if (sourceCanvas) {
      const sx = (overlayBounds.left + rect.x - targetBounds.left) * (sourceCanvas.width / targetBounds.width);
      const sy = (overlayBounds.top + rect.y - targetBounds.top) * (sourceCanvas.height / targetBounds.height);
      const sw = rect.w * (sourceCanvas.width / targetBounds.width);
      const sh = rect.h * (sourceCanvas.height / targetBounds.height);
      ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, out.width, out.height);
      return out;
    }
    return null;
  }, [rect, targetRef]);

  const handleExtract = async () => {
    setError(null);
    const canvas = cropToCanvas();
    if (!canvas) {
      setError(t('ocrFailed'));
      return;
    }
    setRunning(true);
    setProgress(0);
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
      const text = (data.text || '').trim();
      if (!text) {
        setError(t('ocrFailed'));
      } else {
        onExtracted(text);
      }
    } catch {
      setError(t('ocrFailed'));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 flex flex-col">
      <div className="flex items-center justify-between gap-2 p-3 bg-card border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <ScanLine className="h-4 w-4 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground truncate">{t('ocrDragHint')}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={overlayRef}
        className="flex-1 relative overflow-hidden touch-none cursor-crosshair"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {rect && (
          <div
            className="absolute border-2 border-primary bg-primary/10 pointer-events-none"
            style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
          />
        )}
      </div>

      <div className="p-3 bg-card border-t border-border space-y-2">
        <p className="text-[11px] text-muted-foreground">{t('ocrPrivacyNote')}</p>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex items-center gap-2">
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger className="w-40 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OCR_LANGUAGES.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="gold"
            className="flex-1 gap-2"
            disabled={!rect || rect.w < 8 || rect.h < 8 || running}
            onClick={handleExtract}
          >
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('ocrRunning')} {progress}%
              </>
            ) : (
              t('ocrMode')
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
