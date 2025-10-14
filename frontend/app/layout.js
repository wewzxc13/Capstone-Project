import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./Context/Providers";
import { metadata } from "./metadata";
import PerformanceMonitor from "../components/PerformanceMonitor";

// Configure Geist Sans with variable font for better optimization
const geistSans = localFont({
  src: [
    {
      path: "../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-geist-sans",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
  adjustFontFallback: false,
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={geistSans.variable}>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${geistSans.className} antialiased`}>
        <PerformanceMonitor />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

// Re-export metadata
export { metadata };
