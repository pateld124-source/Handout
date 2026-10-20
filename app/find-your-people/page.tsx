import FeaturePage, { featureMetadata, type Feature } from '@/components/marketing/FeaturePage';

const f: Feature = {
  "slug": "find-your-people",
  "name": "Find Your People",
  "title": "Find Study Buddies & Friends at Rowan University | Handout",
  "description": "Find study partners, gym buddies and project teammates at your university. Handout matches students with similar interests. Free.",
  "headline": "Find study buddies, gym partners and teammates",
  "intro": "Find Your People helps you meet students at your university who share your classes, interests and goals, from study groups to gym partners to project teammates.",
  "points": [
    {
      "title": "Match on interests",
      "text": "Tell us what you are into and see students who share it."
    },
    {
      "title": "Study and project partners",
      "text": "Find people from your classes to study with or build a project."
    },
    {
      "title": "Safe and campus-only",
      "text": "You only see students from your own campus community."
    }
  ],
  "steps": [
    "Sign up free.",
    "Add your interests and what you are looking for.",
    "Connect with students who match."
  ]
};

export const metadata = featureMetadata(f);

export default function Page() {
  return <FeaturePage f={f} />;
}
