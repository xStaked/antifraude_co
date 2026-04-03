"use client";

import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

interface PageLayoutProps {
  children: React.ReactNode;
  showGridPattern?: boolean;
}

export function PageLayout({ children, showGridPattern = true }: PageLayoutProps) {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Grid pattern background */}
      {showGridPattern && (
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
      )}

      <Navbar />
      
      <main>{children}</main>
      
      <Footer />
    </div>
  );
}
