import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/ui/Sidebar";
import ToastProvider from "@/components/ToastProvider";
import ThemeProvider from "@/components/ui/ThemeProvider";

export const metadata: Metadata = {
  title: "RateMyDispatchers",
  description: "DispatchGuard trust intelligence for logistics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <div className="appShell">
              <Sidebar />
              <main className="mainShell">{children}</main>
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}