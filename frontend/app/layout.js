import { GeistSans, GeistMono } from "geist/font";
import "./globals.css";
import { Providers } from "./Context/Providers";
import { metadata } from "./metadata";
import PerformanceMonitor from "../components/PerformanceMonitor";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Fonts are provided locally by the `geist` package

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <PerformanceMonitor />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

// Re-export metadata
export { metadata };
