import type { Metadata } from "next";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "@/styles/globals.css";

import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.handout.casa"),
  // Keyword-led title (brand + what people actually search). Individual pages
  // that set their own full title still override this.
  title: "Handout — Student Roommates, Sublets & Campus Marketplace",
  description:
    "Handout is a free student community. Find a roommate or sublet, buy and sell textbooks in the campus marketplace, meet people, and see what's happening at your university.",
  keywords: [
    "Handout",
    "student roommate finder",
    "college roommates",
    "student sublets",
    "campus marketplace",
    "college textbook marketplace",
    "student community app",
    "find a roommate in college",
    "campus events",
  ],
  applicationName: "Handout",
  openGraph: {
    type: "website",
    siteName: "Handout",
    url: "https://www.handout.casa",
    title: "Handout — Student Roommates, Sublets & Campus Marketplace",
    description:
      "Find a roommate or sublet, buy and sell textbooks, and meet students at your university. Free student community.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Handout — Student Roommates, Sublets & Campus Marketplace",
    description:
      "Find a roommate or sublet, buy and sell textbooks, and meet students at your university. Free.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-pattern">
        <Providers>
          {children}
          <Analytics />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}