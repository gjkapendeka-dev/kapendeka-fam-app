import type {Metadata} from 'next';
import './globals.css';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { SupabaseProvider } from "@/supabase";

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
          <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background overflow-x-hidden">
              <AppSidebar />
              <SidebarInset className="flex flex-col relative w-full">
                <div className="md:hidden fixed top-4 right-4 z-[60]">
                  <SidebarTrigger className="h-12 w-12 text-primary bg-white shadow-xl rounded-2xl active:scale-90 transition-transform" />
                </div>
                <main className="flex-1 overflow-y-auto overflow-x-hidden pt-2">
                  {children}
                </main>
              </SidebarInset>
            </div>
            <Toaster />
          </SidebarProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}