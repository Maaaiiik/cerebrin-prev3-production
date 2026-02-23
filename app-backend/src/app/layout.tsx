import type { Metadata } from "next";
// import { Inter } from "next/font/google"; // If using Google Fonts
import localFont from "next/font/local";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { NotificationProvider } from "@/components/providers/NotificationContext";

// Example local fonts - assuming create-next-app defaults
// const geistSans = localFont({
//   src: "./fonts/GeistVF.woff",
//   variable: "--font-geist-sans",
//   weight: "100 900",
// });
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });

import { ConfigProvider } from "@/context/ConfigContext";
import { UserPerspectiveProvider } from "@/context/UserPerspectiveContext";

export const metadata: Metadata = {
  title: "Cerebrin",
  description: "Strategic Management Application",
  themeColor: "#4f46e5",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
        <ConfigProvider>
          <UserPerspectiveProvider>
            <WorkspaceProvider>
              <NotificationProvider>
                <div className="flex h-screen overflow-hidden">
                  <Sidebar />
                  <main className="flex-1 overflow-auto relative bg-slate-50 dark:bg-slate-950/50">
                    {children}
                  </main>
                </div>
              </NotificationProvider>
            </WorkspaceProvider>
          </UserPerspectiveProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
