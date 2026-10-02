import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

export interface Branding {
  nameAr?: string;
  nameEn?: string;
  nameFr?: string;
  logoUrl?: string;
}

export const useBrandingConfig = () =>
  useQuery({
    queryKey: ['branding'],
    queryFn: async () => {
      const { data } = await supabase.from('app_config').select('value').eq('key', 'branding').maybeSingle();
      return (data?.value as Branding) || {};
    },
    staleTime: 5 * 60 * 1000,
  });

export const useBranding = () => {
  const { t, language } = useLanguage();
  const { data } = useBrandingConfig();
  const custom = language === 'ar' ? data?.nameAr : language === 'fr' ? data?.nameFr || data?.nameEn : data?.nameEn;
  return { name: custom?.trim() || t('libraryName'), logoUrl: data?.logoUrl || '/qahwa-library-logo.jpg' };
};

export const useSaveBranding = () => {
  const qc = useQueryClient();
  return async (value: Branding) => {
    const { data: existing } = await supabase.from('app_config').select('id').eq('key', 'branding').maybeSingle();
    const res = existing
      ? await supabase.from('app_config').update({ value: value as any }).eq('key', 'branding')
      : await supabase.from('app_config').insert({ key: 'branding', value: value as any });
    if (res.error) throw res.error;
    qc.invalidateQueries({ queryKey: ['branding'] });
  };
};
