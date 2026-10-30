import type { Metadata } from "next";
import "./globals.css";
import "./design.css";
import "./sharing.css";
import "./panel-tools.css";

export const metadata: Metadata = {
  title: "Órbita · AR Studio",
  description: "Crea, personaliza y gestiona tus experiencias de realidad aumentada.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
