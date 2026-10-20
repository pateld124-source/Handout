import FeaturePage, { featureMetadata, type Feature } from '@/components/marketing/FeaturePage';

const f: Feature = {
  "slug": "roommates",
  "name": "Roommate Matching",
  "title": "Roommate Matching for Rowan University Students | Handout",
  "description": "Find a roommate, room or sublet near Rowan University in Glassboro, NJ. Handout matches students on budget, move-in date and lifestyle. Free.",
  "headline": "Find a roommate who actually fits your life",
  "intro": "Handout matches students near Rowan University by budget, move-in date, cleanliness, sleep schedule, diet and pets, so your roommate is not a random stranger from a group chat. Post your room or browse rooms, houses and sublets in Glassboro for free.",
  "points": [
    {
      "title": "Match score on every listing",
      "text": "Each roommate listing shows how well it fits your own preferences, so you can skip the ones that will not work."
    },
    {
      "title": "Rooms, houses and sublets",
      "text": "See rent, move-in date, photos and location for rooms and whole houses near campus, including summer and semester sublets."
    },
    {
      "title": "Message inside Handout",
      "text": "Talk to the poster in Handout messages first. You do not have to share your phone number to start."
    }
  ],
  "steps": [
    "Sign up free.",
    "Tell us your budget, move-in date and habits, or post your room.",
    "Browse your matches and message the ones you like."
  ]
};

export const metadata = featureMetadata(f);

export default function Page() {
  return <FeaturePage f={f} />;
}
