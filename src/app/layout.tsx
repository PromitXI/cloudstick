import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "CloudStick - Your Personal Cloud Storage",
  description:
    "Upload, organize, and access your files from anywhere. Secure cloud storage for your family.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="font-sans antialiased bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
