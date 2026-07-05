import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Control de Sucursal · Pizzería",
  description: "Panel de control para administración, cocina, supervisión y meseros"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="font-body bg-masa min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
