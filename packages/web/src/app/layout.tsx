import type { Metadata } from "next"; // type import, discarded after compilation, saves space
import { Inter } from "next/font/google"; // import function to import 'inter' google font
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const inter = Inter({ subsets: ["latin"] }); // create instance of 'inter' font with object as parameter; constant will hold an object that has a className property

// metadata for page, important for SEO -> Next.js reads this and generates <head> tags with title and meta tags
export const metadata: Metadata = {
  title: "Odyssey - Event Planning Made Simple",
  description: "Plan and manage your events with Odyssey - coordinate schedules, track budgets, organize transportation, and more",
};


export default function RootLayout({
  children, // receives children automatically via route; if user visits '/' (homepage), then children will be <Home/>
}: Readonly<{
  children: React.ReactNode; // React.ReactNode means children can be anything that react can render (string, number, div, component with multiple divs, etc)
}>) {
  // in the case of a mismatch between server and client render, ignore React hydration warning
  return (
    <html lang="en" suppressHydrationWarning> 
      <body className={inter.className}>
        {/* head will be inserted above body by Next.js when user visits a route like '/ */}
        <ThemeProvider
          // tells the theme provider how to apply theme (in this case, class); it does <html class="dark"> or <html class="light"> (based on globals.css)
          attribute="class"
          // use system theme by default
          defaultTheme="system"
          // allows extraction of preferred theme from OS
          enableSystem
          // disables flickering when react re-renders theme
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}