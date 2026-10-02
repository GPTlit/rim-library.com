import React, { createContext, useContext, useState, useEffect } from 'react';

export interface BrandingSettings {
  nameAr: string;
  nameEn: string;
  nameFr: string;
  subtitleAr: string;
  subtitleEn: string;
  subtitleFr: string;
  logoUrl: string;
  faviconUrl: string;
}

const DEFAULT_BRANDING: BrandingSettings = {
  nameAr: 'مكتبة القهوة',
  nameEn: 'Qahwa Library',
  nameFr: 'Bibliothèque Qahwa',
  subtitleAr: 'واحة القراءة والمعرفة الشنقيطية',
  subtitleEn: 'Oasis of Reading & Knowledge',
  subtitleFr: 'Oasis de Lecture et Savoir',
  logoUrl: '/qahwa-library-logo.jpg',
  faviconUrl: '/favicon.ico',
};

const STORAGE_KEY = 'library_branding_settings_v1';

interface BrandingContextType {
  branding: BrandingSettings;
  updateBranding: (newSettings: Partial<BrandingSettings>) => void;
  resetBranding: () => void;
  getLibraryName: (lang?: string) => string;
  getLibrarySubtitle: (lang?: string) => string;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_BRANDING, ...parsed };
      }
    } catch (e) {
      console.error('Error loading branding settings:', e);
    }
    return DEFAULT_BRANDING;
  });

  // Dynamically update document favicon whenever faviconUrl changes
  useEffect(() => {
    if (!branding.faviconUrl) return;
    try {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'shortcut icon';
        document.head.appendChild(link);
      }
      link.href = branding.faviconUrl;
    } catch (e) {
      console.error('Error updating favicon:', e);
    }
  }, [branding.faviconUrl]);

  const updateBranding = (newSettings: Partial<BrandingSettings>) => {
    setBranding((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving branding settings:', e);
      }
      return updated;
    });
  };

  const resetBranding = () => {
    setBranding(DEFAULT_BRANDING);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Error resetting branding:', e);
    }
  };

  const getLibraryName = (lang: string = 'ar') => {
    if (lang === 'en') return branding.nameEn || branding.nameAr;
    if (lang === 'fr') return branding.nameFr || branding.nameAr;
    return branding.nameAr || DEFAULT_BRANDING.nameAr;
  };

  const getLibrarySubtitle = (lang: string = 'ar') => {
    if (lang === 'en') return branding.subtitleEn || branding.subtitleAr;
    if (lang === 'fr') return branding.subtitleFr || branding.subtitleAr;
    return branding.subtitleAr || DEFAULT_BRANDING.subtitleAr;
  };

  return (
    <BrandingContext.Provider
      value={{
        branding,
        updateBranding,
        resetBranding,
        getLibraryName,
        getLibrarySubtitle,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
