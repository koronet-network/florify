import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Florify",
  description: "Florify - The freshest flowers, delivered to you.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
