import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Model Playground',
  description: 'Compare LLMs side-by-side with real-time streaming output.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
