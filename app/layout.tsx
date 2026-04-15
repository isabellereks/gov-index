import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Track Policy",
  description:
    "Interactive atlas of AI and data center policy across world, regional, and state governments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans bg-white text-ink antialiased">
        {/* Plain <script> tag — Next 16 + React 19 warn when a
            `next/script` inline-body is rendered inside React because
            inline scripts inside React components aren't executed on
            the client. dangerouslySetInnerHTML is the supported path
            for small boot snippets. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('scrollRestoration' in history) history.scrollRestoration = 'manual';`,
          }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
