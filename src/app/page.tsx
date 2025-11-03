'use client';

import { AppSoldScreen } from '@/components/auth/app-sold-screen';
import { BackgroundImage } from '@/components/auth/background-image';
import { cn } from '@/lib/utils';


export default function Home() {
  return (
    <main className={cn("relative flex min-h-screen flex-col items-center justify-center")}>
      <BackgroundImage />
      <div className="relative z-10 w-full">
        <AppSoldScreen />
      </div>
    </main>
  );
}
