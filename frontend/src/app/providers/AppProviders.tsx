import type { PropsWithChildren } from 'react';
import { ThemeSynchronizer } from '@/app/providers/ThemeSynchronizer';
import { PlatformEffects } from '@/app/providers/PlatformEffects';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <>
      <ThemeSynchronizer />
      <PlatformEffects />
      {children}
    </>
  );
}
