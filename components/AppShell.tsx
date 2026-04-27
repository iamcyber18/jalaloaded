'use client';

import { usePathname } from 'next/navigation';
import { MusicPlayerProvider } from '@/components/MusicPlayerContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MusicPlayer from '@/components/MusicPlayer';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <MusicPlayerProvider>
      {!isAdminRoute && <Navbar />}
      <main className={`flex-1 w-full relative${isAdminRoute ? '' : ' pb-20'}`}>
        {children}
      </main>
      {!isAdminRoute && <MusicPlayer />}
      {!isAdminRoute && <Footer />}
    </MusicPlayerProvider>
  );
}
