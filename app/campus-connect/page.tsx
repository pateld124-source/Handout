import FeaturePage, { featureMetadata, type Feature } from '@/components/marketing/FeaturePage';

const f: Feature = {
  "slug": "campus-connect",
  "name": "Campus Connect",
  "title": "Campus Connect: Meet Students at Rowan University | Handout",
  "description": "Campus Connect is Handout’s campus-only way to meet other students for dating and friendship. Students only, with blocking and safety tools. Free.",
  "headline": "Meet people from your own campus",
  "intro": "Campus Connect is a students-only space on Handout for meeting people at your university, whether you are looking for dating, friends or someone to grab coffee with between classes.",
  "points": [
    {
      "title": "Students only",
      "text": "Only student accounts can see Campus Connect profiles, and you choose whether your profile is visible."
    },
    {
      "title": "Block anyone, anytime",
      "text": "If you block someone, they can no longer see your profile or message you."
    },
    {
      "title": "Free for students",
      "text": "Create a profile, browse and connect at no cost."
    }
  ],
  "steps": [
    "Sign up free as a student.",
    "Create your Campus Connect profile and add photos.",
    "Browse students from your campus and say hi."
  ]
};

export const metadata = featureMetadata(f);

export default function Page() {
  return <FeaturePage f={f} />;
}
