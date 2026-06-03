import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://gloobloom.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "GLOOBLOOM — A surreal global organism",
  description:
    "The internet grew a dream creature together. Water it. Watch it bloom. Never let it die.",
  keywords: ["gloobloom", "digital organism", "interactive art", "generative"],
  authors: [{ name: "Gloobloom" }],
  openGraph: {
    title: "GLOOBLOOM",
    description: "The internet grew a dream creature together.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#030308",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@400;500;600&display=swap"
        />
      </head>
      <body className="overflow-hidden">{children}</body>
    </html>
  );
}
