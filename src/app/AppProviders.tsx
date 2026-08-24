import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { LocationProvider } from '../contexts/LocationContext';
import { DataProvider } from '../contexts/DataContext';
import { ThemeProvider } from '../contexts/ThemeContext';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export default function AppProviders({ children }: { children: ReactNode }) {
  if (!PUBLISHABLE_KEY) {
    console.warn("Missing Clerk Publishable Key");
  }

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY || "missing_key"}>
      <ThemeProvider>
        <DataProvider>
          <LocationProvider>{children}</LocationProvider>
        </DataProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
