import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useBranding, BrandingSettings } from '@/contexts/BrandingContext';
import { useBrandingConfig, useSaveBranding, Branding } from '@/hooks/useBranding';
import { supabase } from '@/integrations/supabase/client';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  Save,
  RotateCcw,
  Sun,
  Moon,
  Globe,
  Loader2,
  Check,
  Menu,
  Bell,
  X,
  Link as LinkIcon,
  Smartphone,
  Apple,
} from 'lucide-react';

export const BrandingManager: React.FC = () => {
  const { branding, updateBranding, resetBranding } = useBranding();
  const { toast } = useToast();

  const [formData, setFormData] = useState<BrandingSettings>(() => ({
    ...branding,
  }));

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Store / App links (saved to app_config 'branding' JSON via useBranding.ts)
  const { data: brandingConfig } = useBrandingConfig();
  const saveBranding = useSaveBranding();
  const [linksForm, setLinksForm] = useState<Branding>({});
  const [isSavingLinks, setIsSavingLinks] = useState(false);

  useEffect(() => {
    if (brandingConfig) {
      setLinksForm({
        storeUrl: brandingConfig.storeUrl || '',
        androidAppUrl: brandingConfig.androidAppUrl || '',
        iosAppUrl: brandingConfig.iosAppUrl || '',
      });
    }
  }, [brandingConfig]);

  const handleLinkChange = (field: keyof Branding, value: string) => {
    setLinksForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveLinks = async () => {
    setIsSavingLinks(true);
    try {
      await saveBranding({ ...(brandingConfig || {}), ...linksForm });
      toast({
        title: 'تم حفظ روابط المتجر والتطبيق',
        description: 'سيظهر إشعار تحميل التطبيق للزوار تلقائياً عند توفر الروابط.',
      });
    } catch (e: any) {
      toast({
        title: 'خطأ',
        description: e.message || 'فشل حفظ الروابط',
        variant: 'destructive',
      });
    } finally {
      setIsSavingLinks(false);
    }
  };

  const logoFileRef = useRef<HTMLInputElement>(null);
  const faviconFileRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof BrandingSettings, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `logo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        // Fallback to local Data URL
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          setFormData((prev) => ({ ...prev, logoUrl: dataUrl }));
        };
        reader.readAsDataURL(file);
      } else {
        const { data } = supabase.storage.from('covers').getPublicUrl(fileName);
        setFormData((prev) => ({ ...prev, logoUrl: data.publicUrl }));
      }

      toast({
        title: 'تم اختيار الشعار',
        description: 'يمكنك معاينته في الأسفل ثم الضغط على حفظ التغييرات.',
      });
    } catch (err: any) {
      toast({
        title: 'خطأ',
        description: err.message || 'فشل رفع الشعار',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFavicon(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `favicon_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          setFormData((prev) => ({ ...prev, faviconUrl: dataUrl }));
        };
        reader.readAsDataURL(file);
      } else {
        const { data } = supabase.storage.from('covers').getPublicUrl(fileName);
        setFormData((prev) => ({ ...prev, faviconUrl: data.publicUrl }));
      }

      toast({
        title: 'تم اختيار الأيقونة المفضلة (Favicon)',
        description: 'يمكنك معاينتها في تبويب المتصفح المحاكي أدناه.',
      });
    } catch (err: any) {
      toast({
        title: 'خطأ',
        description: err.message || 'فشل رفع الأيقونة',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingFavicon(false);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
      updateBranding(formData);
      toast({
        title: 'تم حفظ الهوية بنجاح',
        description: 'تم تحديث الشعار والاسم والأيقونة عبر الموقع والترويسة فوراً.',
      });
    } catch (e: any) {
      toast({
        title: 'خطأ',
        description: e.message || 'حدث خطأ أثناء حفظ الهوية',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    resetBranding();
    setFormData({
      nameAr: 'مكتبة القهوة',
      nameEn: 'Qahwa Library',
      nameFr: 'Bibliothèque Qahwa',
      subtitleAr: 'واحة القراءة والمعرفة الشنقيطية',
      subtitleEn: 'Oasis of Reading & Knowledge',
      subtitleFr: 'Oasis de Lecture et Savoir',
      logoUrl: '/qahwa-library-logo.jpg',
      faviconUrl: '/favicon.ico',
    });
    toast({
      title: 'تمت استعادة الإعدادات الأصلية',
      description: 'تمت استعادة الاسم والشعار الأصليين بنجاح.',
    });
  };

  return (
    <div className="space-y-8 font-tajawal">
      {/* Intro Card */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                إدارة الاسم والشعار والأيقونة المفضلة (Favicon)
              </CardTitle>
              <CardDescription>
                تحكم بالكامل في هوية المكتبة البصرية، اسم المكتبة بلغات متعددة، والشعار المعروض في الترويسة وتبويب المتصفح.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
                <RotateCcw className="h-3.5 w-3.5" />
                استعادة الافتراضي
              </Button>
              <Button variant="gold" size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5 text-xs">
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                حفظ التغييرات
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo & Favicon Upload Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-secondary/30 border border-border">
            {/* Logo Upload Box */}
            <div className="space-y-3">
              <Label className="text-sm font-bold flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                شعار المكتبة (Logo)
              </Label>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full border-2 border-primary/40 overflow-hidden bg-card shadow-md flex items-center justify-center shrink-0">
                  <img
                    src={formData.logoUrl || '/placeholder.svg'}
                    alt="Logo Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/qahwa-library-logo.jpg';
                    }}
                  />
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  <input
                    type="file"
                    ref={logoFileRef}
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 w-full sm:w-auto"
                    disabled={isUploadingLogo}
                    onClick={() => logoFileRef.current?.click()}
                  >
                    {isUploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    رفع شعار جديد
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    يُفضل صورة مربعة واضحة بصيغة PNG أو JPG أو WebP بدقة 512×512 بكسل.
                  </p>
                </div>
              </div>
            </div>

            {/* Favicon Upload Box */}
            <div className="space-y-3">
              <Label className="text-sm font-bold flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                أيقونة المتصفح المفضلة (Favicon)
              </Label>
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl border border-border overflow-hidden bg-card shadow-sm flex items-center justify-center p-2 shrink-0">
                  <img
                    src={formData.faviconUrl || '/favicon.ico'}
                    alt="Favicon Preview"
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/favicon.ico';
                    }}
                  />
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  <input
                    type="file"
                    ref={faviconFileRef}
                    accept="image/x-icon,image/png,image/svg+xml,image/jpeg"
                    onChange={handleFaviconUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 w-full sm:w-auto"
                    disabled={isUploadingFavicon}
                    onClick={() => faviconFileRef.current?.click()}
                  >
                    {isUploadingFavicon ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    رفع أيقونة Favicon
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    تظهر في شريط تبويبات المتصفح. يُفضل ملف .ico أو .png بحجم 32×32 أو 64×64.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Multilingual Library Names */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Arabic */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary inline-block">
                العربية (الأساسية)
              </span>
              <div className="space-y-1.5">
                <Label htmlFor="nameAr" className="text-xs font-semibold">
                  اسم المكتبة بالعربية:
                </Label>
                <Input
                  id="nameAr"
                  value={formData.nameAr}
                  onChange={(e) => handleInputChange('nameAr', e.target.value)}
                  placeholder="مكتبة القهوة"
                  dir="rtl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subtitleAr" className="text-xs font-semibold">
                  الوصف الترحيبي الفرعي:
                </Label>
                <Input
                  id="subtitleAr"
                  value={formData.subtitleAr}
                  onChange={(e) => handleInputChange('subtitleAr', e.target.value)}
                  placeholder="واحة القراءة والمعرفة الشنقيطية"
                  dir="rtl"
                />
              </div>
            </div>

            {/* English */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground inline-block">
                English
              </span>
              <div className="space-y-1.5">
                <Label htmlFor="nameEn" className="text-xs font-semibold">
                  Library Name (English):
                </Label>
                <Input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => handleInputChange('nameEn', e.target.value)}
                  placeholder="Qahwa Library"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subtitleEn" className="text-xs font-semibold">
                  Subtitle (English):
                </Label>
                <Input
                  id="subtitleEn"
                  value={formData.subtitleEn}
                  onChange={(e) => handleInputChange('subtitleEn', e.target.value)}
                  placeholder="Oasis of Reading & Knowledge"
                  dir="ltr"
                />
              </div>
            </div>

            {/* French */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground inline-block">
                Français
              </span>
              <div className="space-y-1.5">
                <Label htmlFor="nameFr" className="text-xs font-semibold">
                  Nom de la Bibliothèque (Français):
                </Label>
                <Input
                  id="nameFr"
                  value={formData.nameFr}
                  onChange={(e) => handleInputChange('nameFr', e.target.value)}
                  placeholder="Bibliothèque Qahwa"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subtitleFr" className="text-xs font-semibold">
                  Sous-titre (Français):
                </Label>
                <Input
                  id="subtitleFr"
                  value={formData.subtitleFr}
                  onChange={(e) => handleInputChange('subtitleFr', e.target.value)}
                  placeholder="Oasis de Lecture et Savoir"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Store & App Links Section */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-primary" />
                روابط المتجر والتطبيق (Store &amp; App Links)
              </CardTitle>
              <CardDescription>
                حدد روابط متجر Google Play وApp Store ورابط المتجر العام. تُستخدم لعرض بانر "حمّل على هاتفك" لزوار الموقع من الهاتف.
              </CardDescription>
            </div>
            <Button variant="gold" size="sm" onClick={handleSaveLinks} disabled={isSavingLinks} className="gap-1.5 text-xs">
              {isSavingLinks ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              حفظ الروابط
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="storeUrl" className="text-xs font-semibold flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5 text-primary" />
              رابط المتجر (Store URL)
            </Label>
            <Input
              id="storeUrl"
              value={linksForm.storeUrl || ''}
              onChange={(e) => handleLinkChange('storeUrl', e.target.value)}
              placeholder="https://example.com/store"
              dir="ltr"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="androidAppUrl" className="text-xs font-semibold flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-primary" />
                رابط تطبيق أندرويد (Play Store)
              </Label>
              <Input
                id="androidAppUrl"
                value={linksForm.androidAppUrl || ''}
                onChange={(e) => handleLinkChange('androidAppUrl', e.target.value)}
                placeholder="https://play.google.com/store/apps/details?id=..."
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="iosAppUrl" className="text-xs font-semibold flex items-center gap-1.5">
                <Apple className="h-3.5 w-3.5 text-primary" />
                رابط تطبيق آيفون (App Store)
              </Label>
              <Input
                id="iosAppUrl"
                value={linksForm.iosAppUrl || ''}
                onChange={(e) => handleLinkChange('iosAppUrl', e.target.value)}
                placeholder="https://apps.apple.com/app/id..."
                dir="ltr"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Branding Preview Section */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            معاينة مباشرة في الوقت الفعلي (Live Branding Preview)
          </CardTitle>
          <CardDescription>
            شاهد كيف تظهر التعديلات مباشرة في الوضع الفاتح والوضع الداكن، وكذلك داخل تبويب المتصفح الحقيقي.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 1. Simulated Browser Tab Preview */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              معاينة تبويب المتصفح (Browser Tab Preview)
            </Label>
            <div className="rounded-xl border border-border/80 bg-muted/60 p-3 overflow-hidden shadow-inner">
              {/* Fake Chrome / Safari Tab Header */}
              <div className="flex items-center gap-2 max-w-sm bg-card border border-border px-3 py-2 rounded-t-xl shadow-xs">
                <img
                  src={formData.faviconUrl || '/favicon.ico'}
                  alt="Tab Favicon"
                  className="h-4 w-4 shrink-0 object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/favicon.ico';
                  }}
                />
                <span className="text-xs font-bold text-foreground truncate flex-1">
                  {formData.nameAr || 'مكتبة القهوة'} | {formData.subtitleAr || 'واحة القراءة'}
                </span>
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer shrink-0" />
              </div>
              <div className="h-2 bg-card rounded-b-xl border-x border-b border-border" />
            </div>
          </div>

          {/* 2. Light Theme Header Preview */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Sun className="h-3.5 w-3.5 text-amber-500" />
              معاينة الترويسة في الوضع الفاتح (Light Mode)
            </Label>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-slate-900 overflow-hidden">
              <div className="flex items-center justify-between">
                {/* Brand Logo & Title */}
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full border-2 border-amber-600/30 overflow-hidden shadow-sm shrink-0 bg-slate-50">
                    <img
                      src={formData.logoUrl || '/qahwa-library-logo.jpg'}
                      alt="Light Logo"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/qahwa-library-logo.jpg';
                      }}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-extrabold text-slate-900 leading-tight">
                      {formData.nameAr || 'مكتبة القهوة'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {formData.subtitleAr || 'واحة القراءة والمعرفة'}
                    </span>
                  </div>
                </div>

                {/* Visible 4 Icons Outside Menu */}
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                    <Sun className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                    <Menu className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Dark Theme Header Preview */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Moon className="h-3.5 w-3.5 text-sky-400" />
              معاينة الترويسة في الوضع الداكن (Dark Mode)
            </Label>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-sm text-zinc-100 overflow-hidden">
              <div className="flex items-center justify-between">
                {/* Brand Logo & Title */}
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full border-2 border-primary/40 overflow-hidden shadow-sm shrink-0 bg-zinc-900">
                    <img
                      src={formData.logoUrl || '/qahwa-library-logo.jpg'}
                      alt="Dark Logo"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/qahwa-library-logo.jpg';
                      }}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-extrabold text-white leading-tight">
                      {formData.nameAr || 'مكتبة القهوة'}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {formData.subtitleAr || 'واحة القراءة والمعرفة'}
                    </span>
                  </div>
                </div>

                {/* Visible 4 Icons Outside Menu */}
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
                    <Moon className="h-4 w-4 text-sky-400" />
                  </div>
                  <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
                    <Menu className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
