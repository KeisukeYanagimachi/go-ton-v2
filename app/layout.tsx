import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";

import "./globals.css";

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

/** アプリ全体の共通レイアウトとグローバルフォント設定。 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`app-body ${inter.variable} ${notoSansJp.variable}`}>
        {children}
      </body>
    </html>
  );
}
