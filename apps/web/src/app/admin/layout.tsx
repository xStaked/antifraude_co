import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel de Admin | AntiFraude Colombia",
  description: "Panel de administración para moderadores y administradores",
};

export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
