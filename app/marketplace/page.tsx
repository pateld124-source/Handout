import FeaturePage, { featureMetadata, type Feature } from '@/components/marketing/FeaturePage';

const f: Feature = {
  "slug": "marketplace",
  "name": "Student Marketplace",
  "title": "Student Marketplace: Buy & Sell Textbooks at Rowan | Handout",
  "description": "Buy and sell textbooks, dorm items and furniture with students near Rowan University. No fees and no commission on Handout’s student marketplace.",
  "headline": "Buy and sell textbooks and dorm stuff with students nearby",
  "intro": "The Handout marketplace is a free place for students to sell textbooks, course supplies, furniture and dorm items to other students on campus. No fees, no commission. Just meet safely on campus.",
  "points": [
    {
      "title": "No fees, no commission",
      "text": "Post an item for free and keep everything you sell it for."
    },
    {
      "title": "Students near you",
      "text": "Buyers and sellers are students at your university, so pickup is easy."
    },
    {
      "title": "Photos and messages",
      "text": "Add photos to your listing and chat with buyers inside Handout."
    }
  ],
  "steps": [
    "Sign up free.",
    "Post your item with photos and a price, or browse what is for sale.",
    "Message, meet on campus and trade."
  ]
};

export const metadata = featureMetadata(f);

export default function Page() {
  return <FeaturePage f={f} />;
}
