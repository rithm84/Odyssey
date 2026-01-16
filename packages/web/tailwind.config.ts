import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Guild badge solid colors - needed for dynamic class generation
    "bg-emerald-500",
    "bg-teal-500",
    "bg-pink-500",
    "bg-orange-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-red-500",
    "bg-cyan-500",
    "dark:bg-emerald-600",
    "dark:bg-indigo-600",
    "dark:bg-fuchsia-600",
    "dark:bg-orange-600",
    "dark:bg-blue-800",
    "dark:bg-teal-600",
    "dark:bg-purple-600",
    "dark:bg-red-600",
    "dark:bg-cyan-600",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        body: "var(--font-body)",
        heading: "var(--font-heading)",
      },
      fontSize: {
        'dark-base': ['1.0625rem', { lineHeight: '1.5rem' }],
        'dark-lg': ['1.1953125rem', { lineHeight: '1.75rem' }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        none: '0',
        sm: '0.125rem',  // 2px - minimal
        md: '0.25rem',   // 4px
        lg: '0.25rem',   // 4px (same as md for brutalist consistency)
        xl: '0.25rem',   // 4px
        '2xl': '0.25rem', // 4px
        '3xl': '0.25rem', // 4px
      },
      borderWidth: {
        DEFAULT: '1px',
        '0': '0',
        '2': '2px',
        '3': '3px',
        '4': '4px',
      },
      boxShadow: {
        brutal: '4px 4px 0px black',
        'brutal-lg': '6px 6px 0px black',
        'brutal-white': '4px 4px 0px white',
        'brutal-white-lg': '6px 6px 0px white',
        'brutal-indigo': '4px 4px 0px #4F46E5',
        'brutal-orange': '4px 4px 0px #F97316',
        'brutal-hover': '6px 6px 0px black',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;