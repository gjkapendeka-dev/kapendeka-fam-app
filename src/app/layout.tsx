import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SupabaseProvider } from "@/supabase";
import { LayoutWrapper } from "@/components/layout-wrapper";

export const metadata: Metadata = {
  title: 'Kapendeka Family Hub',
  description: 'The ultimate family universe for the Kapendeka Family',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className="font-body antialiased selection:bg-primary/10">
        <SupabaseProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
          <Toaster />
        </SupabaseProvider>
      </body>
    </html>
  );
}