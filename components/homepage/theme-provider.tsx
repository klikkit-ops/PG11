"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import { useEffect } from "react"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Force light theme
  useEffect(() => {
    document.documentElement.classList.remove("dark")
    document.documentElement.classList.add("light")
  }, [])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

