import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: {
    default: "SupplyScope — Submit a product idea, let AI agents research it",
    template: "%s · SupplyScope",
  },
  description:
    "Submit or upload a product idea and SupplyScope's AI agents go to work — seeking market information and benchmarking similar products in the market.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
