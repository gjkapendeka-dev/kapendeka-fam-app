import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SupabaseProvider } from "@/supabase";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { RealtimeBroadcast } from "@/components/realtime-broadcast";

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
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className="font-body antialiased selection:bg-primary/10">
        <SupabaseProvider>
          <LayoutWrapper>
            {children}
            <RealtimeBroadcast />
          </LayoutWrapper>
          <Toaster />
        </SupabaseProvider>
      </body>
    </html>
  );
}