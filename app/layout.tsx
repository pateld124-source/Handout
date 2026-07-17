import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Providers } from './providers';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
  title: 'Handout — your campus, sorted',
  description: 'Browse verified roommates, home-cooked tiffin, rides and trusted services near your university. Free to explore.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-pattern">
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
