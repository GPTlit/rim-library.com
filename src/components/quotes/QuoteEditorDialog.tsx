import { useMemo, useRef, useState } from 'react';
import { Loader2, Download, Share2, Send, BookPlus, ScanLine, Type as TypeIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { backgroundPresets, fontOptions } from './quotePresets';
import { QuoteStyle, uploadQuoteImage, useCreateQuote } from '@/hooks/useQuotes';
import { isRunningNative } from '@/lib/capacitorFeatures';
import { useCreateStory, uploadStoryMedia } from '@/hooks/useStories';

interface QuoteEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: string;
  bookTitle?: string;
  bookAuthor?: string;
  initialText?: string;
  initialPage?: number | null;
}

const CARD_SIZE = 640; // px, square card rendered then exported at pixelRatio 2

export const QuoteEditorDialog = ({
  open,
  onOpenChange,
  bookId,
  bookTitle,
  bookAuthor,
  initialText = '',
  initialPage = null,
}: QuoteEditorDialogProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const createQuote = useCreateQuote();
  const createStory = useCreateStory();

  const [text, setText] = useState(initialText);
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [backgroundId, setBackgroundId] = useState(backgroundPresets[0].id);
  const [fontId, setFontId] = useState(fontOptions[0].id);
  const [fontSize, setFontSize] = useState(28);
  const [align, setAlign] = useState<'right' | 'center' | 'left'>('center');
  const [vpos, setVpos] = useState<'top' | 'center' | 'bottom'>('center');
  const [showBookMeta, setShowBookMeta] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);

  const background = backgroundPresets.find((b) => b.id === backgroundId) || backgroundPresets[0];
  const font = fontOptions.find((f) => f.id === fontId) || fontOptions[0];

  const style: QuoteStyle = useMemo(() => ({
    background: backgroundId,
    fontFamily: fontId,
    fontSize,
    align,
    verticalPosition: vpos,
    showBookMeta,
    textColor: background.textColor,
  }), [backgroundId, fontId, fontSize, align, vpos, showBookMeta, background.textColor]);

  const requireAuth = () => {
    if (!user) {
      toast({
        title: t('loginRequired'),
        description: t('loginToQuote'),
        action: (
          <Button size="sm" onClick={() => navigate('/auth')}>
            {t('login')}
          </Button>
        ),
      });
      return false;
    }
    return true;
  };

  const generateBlob = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    const { toBlob } = await import('html-to-image');
    const blob = await toBlob(cardRef.current, { pixelRatio: 2, cacheBust: true });
    return blob;
  };

  const resetAfterPost = () => {
    setText('');
    setComment('');
  };

  const handleSaveImage = async () => {
    if (!text.trim()) {
      toast({ title: t('enterQuoteTextFirst') });
      return;
    }
    setBusy('save');
    try {
      const blob = await generateBlob();
      if (!blob) throw new Error('render failed');
      const fileName = `quote-${Date.now()}.png`;

      if (isRunningNative()) {
        const fsMod: any = await import(/* @vite-ignore */ ('@capacitor/' + 'filesystem'));
        const base64 = await blobToBase64(blob);
        await fsMod.Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: fsMod.Directory.Documents,
          recursive: true,
        });
        toast({ title: t('quoteImageSaved') });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast({ title: t('quoteImageSaved') });
      }
    } catch {
      toast({ title: t('ocrFailed'), variant: 'destructive' as any });
    } finally {
      setBusy(null);
    }
  };

  const handleShare = async () => {
    if (!text.trim()) {
      toast({ title: t('enterQuoteTextFirst') });
      return;
    }
    setBusy('share');
    try {
      const blob = await generateBlob();
      if (!blob) throw new Error('render failed');
      const fileName = `quote-${Date.now()}.png`;

      if (isRunningNative()) {
        const [{ Share }, fsMod] = await Promise.all([
          import('@capacitor/share'),
          import(/* @vite-ignore */ ('@capacitor/' + 'filesystem')),
        ]);
        const base64 = await blobToBase64(blob);
        const res = await fsMod.Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: fsMod.Directory.Cache,
          recursive: true,
        });
        await Share.share({ title: bookTitle || t('quoteCards'), text, url: res.uri });
      } else {
        const file = new File([blob], fileName, { type: 'image/png' });
        const nav: any = navigator;
        if (nav.canShare && nav.canShare({ files: [file] })) {
          await nav.share({ title: bookTitle || t('quoteCards'), text, files: [file] });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
      }
    } catch {
      // user cancelled share or share unsupported — no-op
    } finally {
      setBusy(null);
    }
  };

  const handlePostToBook = async () => {
    if (!requireAuth()) return;
    if (!text.trim()) {
      toast({ title: t('enterQuoteTextFirst') });
      return;
    }
    setBusy('post');
    try {
      const blob = await generateBlob();
      if (!blob || !user) throw new Error('render failed');
      const imageUrl = await uploadQuoteImage(blob, user.id);
      await createQuote.mutateAsync({
        book_id: bookId,
        text: text.trim(),
        comment: showComment ? comment.trim() || null : null,
        page: initialPage,
        style,
        image_url: imageUrl,
      });
      toast({ title: t('quotePosted') });
      resetAfterPost();
      onOpenChange(false);
    } catch {
      toast({ title: t('ocrFailed'), variant: 'destructive' as any });
    } finally {
      setBusy(null);
    }
  };

  const handlePostAsStory = async () => {
    if (!requireAuth()) return;
    if (!text.trim()) {
      toast({ title: t('enterQuoteTextFirst') });
      return;
    }
    setBusy('story');
    try {
      const blob = await generateBlob();
      if (!blob || !user) throw new Error('render failed');
      const file = new File([blob], `quote-${Date.now()}.png`, { type: 'image/png' });
      const coverUrl = await uploadStoryMedia(file, user.id, 'cover');
      const description = [text.trim(), showComment ? comment.trim() : ''].filter(Boolean).join('\n\n');
      const story = await createStory.mutateAsync({
        title: bookTitle ? `${t('createQuote')} — ${bookTitle}` : t('newQuote'),
        description,
        cover_url: coverUrl,
      });
      toast({ title: t('quoteStoryPosted') });
      resetAfterPost();
      onOpenChange(false);
      navigate(`/write/${story.id}`);
    } catch {
      toast({ title: t('ocrFailed'), variant: 'destructive' as any });
    } finally {
      setBusy(null);
    }
  };

  const justifyClass = vpos === 'top' ? 'justify-start' : vpos === 'bottom' ? 'justify-end' : 'justify-center';
  const alignClass = align === 'right' ? 'text-right items-end' : align === 'left' ? 'text-left items-start' : 'text-center items-center';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto text-right font-tajawal">
        <DialogHeader>
          <DialogTitle>{t('quoteEditorTitle')}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Live preview card */}
          <div className="flex flex-col items-center gap-2">
            <div
              ref={cardRef}
              className={`w-full aspect-square rounded-xl overflow-hidden flex flex-col p-6 ${justifyClass}`}
              style={{ background: background.css, maxWidth: CARD_SIZE }}
            >
              <div className={`flex flex-col gap-3 w-full ${alignClass}`}>
                <p
                  style={{
                    fontFamily: font.family,
                    fontSize: `${fontSize}px`,
                    color: background.textColor,
                    lineHeight: 1.6,
                  }}
                  className="whitespace-pre-wrap break-words"
                >
                  “{text || t('quoteTextPlaceholder')}”
                </p>
                {showComment && comment && (
                  <p
                    style={{ color: background.textColor, opacity: 0.85 }}
                    className="text-sm whitespace-pre-wrap break-words"
                  >
                    {comment}
                  </p>
                )}
                {showBookMeta && (bookTitle || bookAuthor) && (
                  <p style={{ color: background.textColor, opacity: 0.75 }} className="text-xs mt-2">
                    {bookTitle} {bookAuthor ? `— ${bookAuthor}` : ''}
                  </p>
                )}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">{t('livePreview')}</p>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div>
              <Label className="text-xs">{t('quoteText')}</Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('quoteTextPlaceholder')}
                className="mt-1 allow-select"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs">{t('quoteComment')}</Label>
              <Switch checked={showComment} onCheckedChange={setShowComment} />
            </div>
            {showComment && (
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('quoteCommentPlaceholder')}
                className="allow-select"
                rows={2}
              />
            )}

            <div>
              <Label className="text-xs mb-1.5 block">{t('background')}</Label>
              <div className="flex flex-wrap gap-2">
                {backgroundPresets.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBackgroundId(b.id)}
                    className={`h-9 w-9 rounded-full border-2 ${backgroundId === b.id ? 'border-primary' : 'border-border'}`}
                    style={{ background: b.css }}
                    title={b.label.ar}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 flex items-center gap-1"><TypeIcon className="h-3 w-3" />{t('font')}</Label>
                <Select value={fontId} onValueChange={setFontId}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((f) => (
                      <SelectItem key={f.id} value={f.id} style={{ fontFamily: f.family }}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">{t('fontSize')}: {fontSize}</Label>
                <input
                  type="range"
                  min={16}
                  max={48}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs mb-1.5 block">{t('alignment')}</Label>
              <ToggleGroup type="single" value={align} onValueChange={(v) => v && setAlign(v as any)} className="justify-start">
                <ToggleGroupItem value="right">{t('alignRight')}</ToggleGroupItem>
                <ToggleGroupItem value="center">{t('alignCenter')}</ToggleGroupItem>
                <ToggleGroupItem value="left">{t('alignLeft')}</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div>
              <Label className="text-xs mb-1.5 block">{t('verticalPosition')}</Label>
              <ToggleGroup type="single" value={vpos} onValueChange={(v) => v && setVpos(v as any)} className="justify-start">
                <ToggleGroupItem value="top">{t('positionTop')}</ToggleGroupItem>
                <ToggleGroupItem value="center">{t('positionCenter')}</ToggleGroupItem>
                <ToggleGroupItem value="bottom">{t('positionBottom')}</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs">{t('showBookMeta')}</Label>
              <Switch checked={showBookMeta} onCheckedChange={setShowBookMeta} />
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <Button variant="outline" className="gap-2" onClick={handleSaveImage} disabled={!!busy}>
                {busy === 'save' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {t('saveImage')}
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleShare} disabled={!!busy}>
                {busy === 'share' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                {t('shareQuote')}
              </Button>
              <Button variant="gold" className="gap-2" onClick={handlePostToBook} disabled={!!busy}>
                {busy === 'post' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {t('postToBook')}
              </Button>
              <Button variant="secondary" className="gap-2" onClick={handlePostAsStory} disabled={!!busy}>
                {busy === 'story' ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookPlus className="h-4 w-4" />}
                {t('postAsStory')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
