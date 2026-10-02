import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const text = {
  ar: {
    msg: 'مرحباً بك في مكتبتنا! سجّل الدخول للوصول إلى محتوى المكتبة كاملاً والتفاعل مع الكتب.',
    cta: 'تسجيل الدخول',
  },
  en: {
    msg: 'Welcome to our library! Sign in to access full library content and interact with books.',
    cta: 'Sign In',
  },
  fr: {
    msg: 'Bienvenue dans notre bibliothèque ! Connectez-vous pour accéder à tout le contenu.',
    cta: 'Se connecter',
  },
};

export const SignInBanner = () => {
  const { user, loading } = useAuth();
  const { language } = useLanguage();

  if (loading || user) return null;
  const t = text[language] ?? text.ar;

  return (
    <div className="w-full bg-primary text-primary-foreground border-b border-primary-foreground/15 shadow-xs">
      <div className="container-library flex items-center justify-between gap-3 py-2 text-xs sm:text-sm">
        <p className="flex-1 font-medium leading-snug">{t.msg}</p>
        <Button asChild size="sm" variant="secondary" className="shrink-0 font-bold text-xs h-8">
          <Link to="/auth">
            <LogIn className="h-3.5 w-3.5" />
            {t.cta}
          </Link>
        </Button>
      </div>
    </div>
  );
};