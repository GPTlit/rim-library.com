import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  Home,
  Grid3X3,
  History,
  Download,
  Upload,
  LogOut,
  Shield,
  Info,
  Sparkles,
  Users,
  ShoppingBag,
  User,
  Moon,
  Sun,
  Globe,
  Lock,
  FileText,
  LogIn,
  ChevronLeft,
} from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/components/ThemeProvider';
import { useBranding } from '@/contexts/BrandingContext';
import { Logo } from './Logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const languages = [
  { code: 'ar' as const, name: 'العربية' },
  { code: 'en' as const, name: 'English' },
  { code: 'fr' as const, name: 'Français' },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { getLibraryName, getLibrarySubtitle } = useBranding();

  const libraryName = getLibraryName(language);
  const librarySubtitle = getLibrarySubtitle(language);

  // Grouped Navigation links
  const mainNavGroups = [
    {
      groupTitle: language === 'ar' ? 'الرئيسية والتصفح' : language === 'fr' ? 'Navigation' : 'Browse',
      links: [
        { href: '/', label: t('home'), icon: Home },
        { href: '/categories', label: t('categories'), icon: Grid3X3 },
        { href: '/store', label: t('store'), icon: ShoppingBag },
        { href: '/author-chat', label: t('authorChat'), icon: Sparkles },
        { href: '/eterke', label: t('eterke'), icon: Users },
      ],
    },
    {
      groupTitle: language === 'ar' ? 'قراءاتي وحسابي' : language === 'fr' ? 'Mon Espace' : 'My Library',
      links: [
        { href: '/history', label: t('history'), icon: History },
        { href: '/downloads', label: t('downloads'), icon: Download },
        { href: '/upload', label: t('uploadBook'), icon: Upload },
        { href: '/profile', label: t('profile'), icon: User },
      ],
    },
    {
      groupTitle: language === 'ar' ? 'حول وإدارة' : language === 'fr' ? 'À Propos & Admin' : 'About & Admin',
      links: [
        ...(isAdmin ? [{ href: '/admin-upload-mrt', label: t('adminPanel'), icon: Shield, highlight: true }] : []),
        { href: '/about', label: t('about'), icon: Info },
        {
          href: '/privacy',
          label: language === 'ar' ? 'سياسة الخصوصية' : language === 'fr' ? 'Politique de Confidentialité' : 'Privacy Policy',
          icon: Lock,
        },
        {
          href: '/copyright',
          label: language === 'ar' ? 'حقوق النشر' : language === 'fr' ? 'Droits d\'Auteur' : 'Copyright',
          icon: FileText,
        },
      ],
    },
  ];

  const handleSignOut = async () => {
    setIsMenuOpen(false);
    await signOut();
  };

  return (
    <header className="w-full border-b border-border/60 bg-card/95 backdrop-blur-md shadow-xs select-none">
      <div className="container-library">
        <div className="flex h-16 items-center justify-between gap-3 overflow-hidden">
          {/* 1. The library logo and brand name (Full natural size, no shrinking or truncation) */}
          <div className="shrink-0 flex items-center">
            <Logo />
          </div>

          {/* Action controls outside the menu:
              ONLY:
              1. Theme toggle button (Dark / Light)
              2. Notification bell button
              3. Language selector button
              4. Hamburger menu button (three lines)
          */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* 2. Dark / Light mode toggle button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-foreground hover:bg-secondary rounded-full"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
              aria-label="تبديل المظهر"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-amber-500 animate-in fade-in" />
              ) : (
                <Moon className="h-5 w-5 text-primary animate-in fade-in" />
              )}
            </Button>

            {/* 3. Notification bell button */}
            <NotificationBell />

            {/* 4. Language selector button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-foreground hover:bg-secondary rounded-full"
                  title="تغيير اللغة / Change Language"
                  aria-label="تغيير اللغة"
                >
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 font-tajawal">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={cn(
                      'cursor-pointer flex items-center justify-between',
                      language === lang.code && 'bg-primary/10 text-primary font-bold'
                    )}
                  >
                    <span>{lang.name}</span>
                    {language === lang.code && <span className="text-xs">✓</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 5. Hamburger menu button (three lines) that opens the full navigation sheet */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-foreground hover:bg-secondary rounded-full"
                  aria-label="القائمة الرئيسية"
                  title="القائمة الرئيسية"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side={language === 'ar' ? 'right' : 'left'}
                className="w-80 sm:w-96 p-0 font-tajawal flex flex-col justify-between bg-card text-foreground border-border"
              >
                {/* Sheet Header */}
                <div className="p-5 border-b border-border/60 bg-muted/30">
                  <SheetHeader className="text-right sm:text-right">
                    <SheetTitle className="text-right">
                      <div className="flex items-center gap-3">
                        <Logo />
                      </div>
                    </SheetTitle>
                  </SheetHeader>

                  {/* User Profile Card or Guest Invite */}
                  <div className="mt-4 pt-3 border-t border-border/50">
                    {user ? (
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">
                            {user.user_metadata?.full_name || user.email?.split('@')[0] || t('profile')}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        {isAdmin && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 shrink-0">
                            {t('adminPanel')}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                        <div className="text-right">
                          <span className="text-xs font-bold text-primary block">
                            {language === 'ar' ? 'زائر كريم' : 'Guest Visitor'}
                          </span>
                          <span className="text-[11px] text-muted-foreground block">
                            {language === 'ar' ? 'سجّل دخولك للاستفادة الكاملة' : 'Sign in to access all features'}
                          </span>
                        </div>
                        <Button asChild size="sm" variant="gold" className="shrink-0 text-xs h-8 gap-1.5" onClick={() => setIsMenuOpen(false)}>
                          <Link to="/auth">
                            <LogIn className="h-3.5 w-3.5" />
                            {language === 'ar' ? 'دخول' : 'Sign In'}
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Nav Links Groups (Scrollable) */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
                  {mainNavGroups.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-1">
                      <h4 className="text-[11px] font-bold text-muted-foreground px-3 mb-1 uppercase tracking-wider">
                        {group.groupTitle}
                      </h4>
                      <div className="space-y-0.5">
                        {group.links.map((link) => {
                          const Icon = link.icon;
                          const isActive = location.pathname === link.href;
                          return (
                            <Link
                              key={link.href}
                              to={link.href}
                              onClick={() => setIsMenuOpen(false)}
                              className={cn(
                                'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                                isActive
                                  ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                                  : 'text-foreground/90 hover:bg-secondary hover:text-foreground'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary-foreground' : 'text-primary')} />
                                <span>{link.label}</span>
                              </div>
                              <ChevronLeft className={cn('h-3.5 w-3.5 opacity-50', language !== 'ar' && 'rotate-180')} />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sheet Footer */}
                <div className="p-4 border-t border-border/60 bg-muted/20">
                  {user ? (
                    <Button
                      variant="outline"
                      className="w-full justify-center gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 h-10"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                      {t('logout')}
                    </Button>
                  ) : (
                    <Button asChild variant="gold" className="w-full justify-center gap-2 h-10" onClick={() => setIsMenuOpen(false)}>
                      <Link to="/auth">
                        <LogIn className="h-4 w-4" />
                        {language === 'ar' ? 'تسجيل الدخول / حساب جديد' : 'Sign In / Register'}
                      </Link>
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
