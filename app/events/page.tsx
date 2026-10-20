import FeaturePage, { featureMetadata, type Feature } from '@/components/marketing/FeaturePage';

const f: Feature = {
  "slug": "events",
  "name": "Campus Events",
  "title": "Campus Events at Rowan University | Handout",
  "description": "See what is happening around campus and RSVP in one tap. Student events, meetups and activities near Rowan University on Handout.",
  "headline": "See what’s happening on campus",
  "intro": "Handout Events shows student events, meetups and activities around your campus in one place, so you never miss the things worth going to.",
  "points": [
    {
      "title": "All in one feed",
      "text": "Events from students and campus groups, sorted by date."
    },
    {
      "title": "RSVP in one tap",
      "text": "Say you are going and keep track of your plans."
    },
    {
      "title": "Post your own",
      "text": "Running a club meeting or a game night? Add it so other students can find it."
    }
  ],
  "steps": [
    "Sign up free.",
    "Open Events and browse what is coming up.",
    "RSVP, or post your own event."
  ]
};

export const metadata = featureMetadata(f);

export default function Page() {
  return <FeaturePage f={f} />;
}
