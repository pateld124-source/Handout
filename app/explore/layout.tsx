import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Handout — Roommates, Marketplace, Food & Campus Life',
  description: 'Everything students need in one place: roommates and sublets, a campus marketplace, homemade food, events and people at your university.',
  alternates: { canonical: 'https://www.handout.casa/explore' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
