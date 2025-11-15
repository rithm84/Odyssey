import { ThemeToggle } from "./ThemeToggle";
import Link from "next/link";

export function NavBar() {
  return (
    <nav className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover-scale">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-2xl font-bold text-white">O</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Odyssey
            </span>
          </Link>
          
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}