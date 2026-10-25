import type { Metadata } from 'next';
const configuredSite = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.upsoluti.com');
if (configuredSite.hostname === 'upsoluti.com') configuredSite.hostname = 'www.upsoluti.com';
export const siteUrl = configuredSite.origin;
export function pageMetadata(title: string, description: string, path: string): Metadata {
 return { title, description, alternates: { canonical: path }, openGraph: { title, description, url: path, type: 'website', locale: 'pt_PT', images: ['/opengraph-image.png'] }, twitter: { card: 'summary_large_image', title, description, images: ['/opengraph-image.png'] } };
}
