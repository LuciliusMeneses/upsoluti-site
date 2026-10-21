import { notFound } from 'next/navigation';
import { getService, servicesData } from '@/lib/services';
import { pageMetadata } from '@/lib/site';
import { offeringCopy } from '@/lib/offering-pages';
import OfferingPage from '@/components/OfferingPage';

export function generateStaticParams() { return Object.keys(servicesData).map(slug => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getService(slug);
  return service ? pageMetadata(service.name, service.description, '/servicos/' + slug) : {};
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();
  return <OfferingPage slug={slug} name={service.name} title={service.title} highlight={service.highlight} copy={offeringCopy[slug]} contact={'/contacto?objetivo=' + service.goal + '&origem=' + slug} ctaLabel={slug === 'software' ? 'Conversar sobre o meu projeto' : 'Falar sobre esta necessidade'} related={service.related.map(id => ({ name: getService(id)!.name, href: '/servicos/' + id }))} />;
}
