import PrivacyBanner from '@/components/PrivacyBanner';
import './privacy.css';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Analytics from '@/components/Analytics';
import CardMotion from '@/components/CardMotion';
import ChatWidget from '@/components/ChatWidget';
import { siteUrl } from '@/lib/site';
import './globals.css';
import './inner.css';
import './motion.css';
import './chat.css';
export const metadata: Metadata = {
 metadataBase: new URL(siteUrl),
 title: { default: 'UPsoluti | Marketing, Automação e Inteligência Artificial', template: '%s | UPsoluti' },
 description: 'Mais vendas e menos tarefas manuais. Marketing, software e inteligência artificial para empresas.',
 alternates: { canonical: '/' },
 openGraph: { type: 'website', locale: 'pt_PT', siteName: 'UPsoluti', images: ['/opengraph-image.png'] },
 twitter: { card: 'summary_large_image', images: ['/opengraph-image.png'] }
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="pt-PT"><body className="antialiased"><a className="skip-link" href="#conteudo">Saltar para o conteúdo</a><Header /><div id="conteudo" tabIndex={-1}>{children}</div><Footer /><Analytics /><CardMotion /><ChatWidget /><PrivacyBanner /></body></html>;
}
