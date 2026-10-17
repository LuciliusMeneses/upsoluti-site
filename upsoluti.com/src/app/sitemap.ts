import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';
import { services, solutions } from '@/lib/navigation';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/sobre', '/contacto', '/privacidade', '/politicas', ...services.map(service => service.href), ...solutions.map(solution => solution.href)].map(path => ({ url: siteUrl + path }));
}
