import { ThemeToggle } from "./ThemeToggle";
import Link from "next/link";
import { Compass } from "lucide-react";

export function NavBar() {
  return (
    <nav className="border-b border-border/30 backdrop-blur-md bg-background/70 sticky top-0 z-50 shadow-soft">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group transition-all duration-300">
            <div className="relative">
              <div className="absolute inset-0 gradient-primary rounded-xl blur-sm opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-11 w-11 rounded-xl gradient-primary flex items-center justify-center shadow-medium group-hover:shadow-glow-orange transition-all duration-300 group-hover:scale-105">
                <Compass className="h-6 w-6 text-white" />
              </div>
            </div>
            <span className="text-2xl font-black text-gradient uppercase" style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.05em' }}>
              Odyssey
            </span>
          </Link>

          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}