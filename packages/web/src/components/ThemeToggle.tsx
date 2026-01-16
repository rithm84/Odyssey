"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by checking if component is mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Return a placeholder to avoid hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full transition-smooth hover-scale"
      >
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="rounded-full transition-smooth hover-scale group"
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4 transition-transform group-hover:rotate-12" />
      ) : (
        <Sun className="h-4 w-4 transition-transform group-hover:rotate-180" />
      )}
    </Button>
  );
}