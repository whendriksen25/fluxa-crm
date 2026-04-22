import Link from "next/link"
import { Leaf } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
            <Leaf className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold tracking-tight text-muted-foreground">
            <span className="font-extrabold text-primary">FLUXA</span> CRM
          </span>
        </div>

        <nav className="flex items-center gap-6">
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
        </nav>
      </div>
    </footer>
  )
}
