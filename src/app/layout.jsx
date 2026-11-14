import { Schibsted_Grotesk } from "next/font/google";
import "./globals.css";

const sans = Schibsted_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });

export const metadata = {
  title: "Spotter",
  description: "Savaitės treniruočių planas, pritaikytas tavo laikui, įrangai ir sveikatai.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="lt" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}
