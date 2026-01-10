import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});
const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans-jp",
});

export const metadata: Metadata = {
  title: "SPI App",
  description: "Internal SPI exam platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${inter.variable} ${notoSansJp.variable}`}
        style={{
          fontFamily: "var(--font-inter), var(--font-noto-sans-jp), sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
