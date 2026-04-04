import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Codex Portfolio Pages",
  description: "Filesystem-backed portfolio prototype built in an isolated Codex Pages subtree."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
