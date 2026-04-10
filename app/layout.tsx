import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tbilisi Weekend Picker",
  description: "Mobile-first group decision app for Tbilisi outings"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
