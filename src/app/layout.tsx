import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "42Drive - Your Personal Cloud Storage",
  description:
    "Safe, Secure, Free, Cloud Storage for All.",
  icons: {
    icon: "/brand-icon.svg",
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
        className="font-sans antialiased bg-[#111113] text-[#ececec]"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
