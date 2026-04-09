import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/ui/Sidebar";
import ToastProvider from "@/components/ToastProvider";
import ThemeProvider from "@/components/ui/ThemeProvider";

export const metadata: Metadata = {
  title: "RateMyDispatchers",
  description: "Reviews, rankings, leads, favorites, and marketplace trust signals.",
};

const themeInitScript = `
(function () {
  try {
    var key = "rmd_theme";
    var raw = localStorage.getItem(key);
    var theme =
      raw === "dark" || raw === "bright" || raw === "futuristic"
        ? raw
        : "dark";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
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