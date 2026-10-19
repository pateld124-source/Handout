import { notFound } from 'next/navigation';
import { DebugChecks } from './DebugChecks';

// Local troubleshooting only (see READ_ME_FIRST.md).
export default function DebugPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <DebugChecks />;
}
