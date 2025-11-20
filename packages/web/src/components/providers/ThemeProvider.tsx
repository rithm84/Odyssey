"use client";

import * as React from "react"; // import all react
import { ThemeProvider as NextThemesProvider } from "next-themes"; // use alias because of function name

// create interface for typing
interface ThemeProviderProps {
  children: React.ReactNode;
  [key: string]: any; // use index signature; property name can be any string, property itself can be anything
}

// use rest and spread to pass props to next-themes
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}