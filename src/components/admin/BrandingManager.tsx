import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Branding, useBrandingConfig, useSaveBranding } from '@/hooks/useBranding';

export const BrandingManager = () => {
  const { data } = useBrandingConfig();
  const save = useSaveBranding();
  const { toast } = useToast();
  const [form, setForm] = useState<Branding>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (data) setForm(data); }, [data]);

  const uploadLogo = async (file: File) => {
    setBusy(true);
    const path = `branding/logo-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('covers').upload(path, file);
    if (error) { toast({ title: 'تعذر رفع الشعار', variant: 'destructive' }); setBusy(false); return; }
    const url = supabase.storage.from('covers').getPublicUrl(path).data.publicUrl;
    setForm((f) => ({ ...f, logoUrl: url }));
    setBusy(false);
  };

  const onSave = async () => {
    setBusy(true);
    try { await save(form); toast({ title: 'تم حفظ الاسم والشعار' }); }
    catch { toast({ title: 'تعذر الحفظ', variant: 'destructive' }); }
    setBusy(false);
  };

  return (
    <Card>
      <CardHeader><CardTitle>اسم المكتبة والشعار</CardTitle></CardHeader>
      <CardContent className="space-y-4" dir="rtl">
        <div className="flex items-center gap-4">
          <img src={form.logoUrl || '/qahwa-library-logo.jpg'} alt="" className="h-20 w-20 rounded-full object-cover border border-border" />
          <Label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
            <span className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm"><Upload className="h-4 w-4" />تغيير الشعار</span>
          </Label>
          {form.logoUrl && <Button variant="ghost" size="sm" onClick={() => setForm((f) => ({ ...f, logoUrl: '' }))}>الشعار الافتراضي</Button>}
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div><Label>الاسم بالعربية</Label><Input value={form.nameAr || ''} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} placeholder="مكتبة القهوة" /></div>
          <div><Label>English name</Label><Input value={form.nameEn || ''} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} placeholder="QAHWA LIBRARY" /></div>
          <div><Label>Nom en français</Label><Input value={form.nameFr || ''} onChange={(e) => setForm({ ...form, nameFr: e.target.value })} placeholder="QAHWA LIBRARY" /></div>
        </div>
        <Button onClick={onSave} disabled={busy} className="gap-2">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}حفظ</Button>
      </CardContent>
    </Card>
  );
};
