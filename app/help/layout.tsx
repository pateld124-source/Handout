import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Center | Handout',
  description: 'Answers to common questions about Handout: accounts, listings, roommates, safety and how to contact us.',
  alternates: { canonical: 'https://www.handout.casa/help' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
