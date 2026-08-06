import './globals.css';
import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: 'Free CSV to Markdown Table Converter Online | Convert Excel & TSV to Markdown',
  description: 'Convert CSV, Excel, and TSV tabular data into perfectly formatted Markdown tables instantly in your browser. 100% free client-side processing, high speed, zero latency.',
  keywords: [
    'Free CSV to Markdown Table Converter Online',
    'convert excel to markdown',
    'CSV to markdown generator',
    'TSV to markdown table',
    'markdown table creator',
    'tabular dataset to markdown',
    'micro saas markdown tool'
  ],
  authors: [{ name: 'MarkdownTableIO Team' }],
  openGraph: {
    title: 'MarkdownTableIO | Free CSV to Markdown Table Converter',
    description: 'Convert tabular CSV & Excel datasets into clean, auto-aligned Markdown tables directly in your browser.',
    url: 'https://markdowntableio.vercel.app',
    siteName: 'MarkdownTableIO',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MarkdownTableIO - CSV to Markdown Converter',
    description: 'Instant, privacy-first browser CSV to Markdown table converter for developers and technical writers.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-slate-900 text-slate-100 min-h-screen antialiased selection:bg-teal-500 selection:text-slate-900">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

