"use client";

import "@/css/satoshi.css";
import "@/css/style.css";

import { Sidebar } from "@/components/Layouts/sidebar";
import { Header } from "@/components/Layouts/header";

import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import { Providers } from "./providers";

import { usePathname } from "next/navigation";
import RequireAuth from "@/components/Auth/RequireAuth";

export default function RootLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const isPublicPage =
    pathname?.startsWith("/auth") || pathname?.startsWith("/client-registration");

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <NextTopLoader color="#5750F1" showSpinner={false} />

          {isPublicPage ? (
            <main className="flex min-h-screen items-center justify-center bg-gray-2 p-4 dark:bg-[#020d1a]">
              {children}
            </main>
          ) : (
            <RequireAuth>
              <div className="flex min-h-screen">
                <Sidebar />
                <div className="flex min-w-0 flex-1 flex-col bg-gray-2 dark:bg-[#020d1a]">
                  <Header />
                  <main className="min-w-0 mx-auto w-full max-w-screen-2xl p-4 md:p-6 2xl:p-10">
                    {children}
                  </main>
                </div>
              </div>
            </RequireAuth>
          )}
        </Providers>
      </body>
    </html>
  );
}
