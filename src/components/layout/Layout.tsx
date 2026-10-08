import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { SignInBanner } from '@/components/SignInBanner';
import { BottomNav } from './BottomNav';
import { MobileAppPrompt } from '@/components/MobileAppPrompt';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-50 w-full">
        <SignInBanner />
        <Header />
      </div>
      <main className="flex-1 pb-20">{children}</main>
      <Footer />
      <BottomNav />
      <MobileAppPrompt />
    </div>
  );
};
