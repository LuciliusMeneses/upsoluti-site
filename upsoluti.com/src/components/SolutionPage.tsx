import OfferingPage from './OfferingPage';
import { solutionData, type SolutionSlug } from '@/lib/solutions';
import { offeringCopy } from '@/lib/offering-pages';

export default function SolutionPage({ slug }: { slug: SolutionSlug }) {
  const solution = solutionData[slug];
  return <OfferingPage slug={slug} name={solution.name} title={solution.title} highlight={solution.highlight} copy={offeringCopy[slug]} contact={'/contacto?objetivo=' + slug + '&origem=' + slug} ctaLabel="Explorar a minha necessidade" solution />;
}
