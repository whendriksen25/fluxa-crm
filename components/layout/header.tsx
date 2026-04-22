"use client"

import Link from "next/link"
import { useState } from "react"
import { buttonVariants } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center transition-opacity hover:opacity-90">
          <img
            src="/fluxa-logo.svg"
            alt="FLUXA"
            className="h-7 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <Link
            href="/pricing"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Tarieven
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Inloggen
          </Link>
          <Link
            href="/signup"
            className={buttonVariants({
              size: "sm",
              className: "rounded-full px-5 font-semibold",
            })}
          >
            Simuleer nu
          </Link>
        </nav>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/50 px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <Link
              href="/pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              Tarieven
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              Inloggen
            </Link>
            <Link
              href="/signup"
              className={buttonVariants({
                size: "sm",
                className: "w-full rounded-full font-semibold",
              })}
            >
              Simuleer nu
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
