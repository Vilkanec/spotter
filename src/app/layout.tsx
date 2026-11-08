import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import "./globals.css";

const sans = Schibsted_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Spotter",
  description: "Savaitės treniruočių planas, pritaikytas tavo laikui, įrangai ir sveikatai.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lt" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}
