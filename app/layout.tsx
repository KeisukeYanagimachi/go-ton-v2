import type { Metadata } from "next";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
