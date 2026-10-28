import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prontuário ILPI",
  description: "Protótipo de prontuário para Instituição de Longa Permanência para Idosos: admissão e SAE",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-background font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
