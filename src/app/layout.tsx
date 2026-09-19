import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AskTej from "@/components/AskTej";

import { Playfair_Display, Source_Sans_3 } from "next/font/google";

const headingFont = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
});

const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
});

export const metadata = {
  title: "Naga Sai Teja Bollimuntha — Developer · Writer · Builder",
  description: "Personal website of Naga Sai Teja — stories on tech, life, fitness, and building things.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${headingFont.variable}`}>
        <Navbar />
        <main className="flex-1 w-full">
          {children}
        </main>
        <Footer />
        {/* Ask Tej AI — floating chat widget, globally mounted */}
        <AskTej />
      </body>
    </html>
  );
}