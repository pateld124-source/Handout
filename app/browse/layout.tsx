import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Roommates, Rooms & Sublets near Rowan University | Handout',
  description: 'Browse rooms, houses and sublets for students in Glassboro and near Rowan University. See rent, move-in dates and photos, and contact the poster.',
  alternates: { canonical: 'https://www.handout.casa/browse' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
