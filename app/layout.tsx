import type { Metadata } from "next";
import "./globals.css";
import "./decision.css";
import "./mine-view.css";
import "./operation.css";
import "./haul.css";
import "./real-mine.css";
import "./shift-lab.css";
import "./project-review.css";
import "./reviewer-demo.css";

export const metadata: Metadata = {
  title: "ElectroDecision · Diagnóstico eléctrico minero",
  description: "Explora potencia, calendarios y sensibilidad para flotas mineras eléctricas, con evidencia y supuestos visibles.",
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
