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
        variant="outline"
        size="default"
        className="rounded-full transition-smooth gap-2 px-4 shadow-soft hover:shadow-medium font-heading"
      >
        <Sun className="h-4 w-4" />
        <span className="text-sm font-medium">Day</span>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="default"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="rounded-full transition-smooth gap-2 px-4 shadow-soft hover:shadow-medium hover-scale group font-heading"
    >
      {theme === "light" ? (
        <>
          <Moon className="h-4 w-4 transition-transform group-hover:rotate-12" />
          <span className="text-sm font-medium">Night</span>
        </>
      ) : (
        <>
          <Sun className="h-4 w-4 transition-transform group-hover:rotate-180" />
          <span className="text-sm font-medium dark:lowercase">Day</span>
        </>
      )}
    </Button>
  );
}