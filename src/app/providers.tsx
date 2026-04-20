"use client";


import { AuthProvider } from "@/components/Auth/AuthProvider";
import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import { ThemeProvider } from "next-themes";
import { AppToaster } from "@/components/AppToaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light" attribute="class">
      <SidebarProvider>
        <AuthProvider>
          {children}
          <AppToaster aria-label="Notification" />
        </AuthProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}
