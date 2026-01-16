import { ThemeToggle } from "./ThemeToggle";
import { AuthButton } from "./AuthButton";
import Link from "next/link";

export function NavBar() {
  return (
    <nav className="border-brutal-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-4 group"
          >
            <span className="text-3xl font-black text-foreground uppercase tracking-tight hover:text-primary transition-colors">
              ODYSSEY
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <AuthButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
