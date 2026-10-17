import type { Metadata } from 'next';
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://upsoluti.com';
export function pageMetadata(title: string, description: string, path: string): Metadata {
 return { title, description, alternates: { canonical: path }, openGraph: { title, description, url: path, type: 'website', locale: 'pt_PT', images: ['/opengraph-image.png'] }, twitter: { card: 'summary_large_image', title, description, images: ['/opengraph-image.png'] } };
}
