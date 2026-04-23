"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/hooks/use-user"
import { SearchBar } from "./search-bar"
import {
  Users,
  Building2,
  Kanban,
  Activity,
  Upload,
  Settings,
  LogOut,
  UserCircle,
  BarChart3,
  X,
} from "lucide-react"

const navItems = [
  { href: "/dashboard/account-manager", label: "My Accounts", icon: UserCircle },
  { href: "/dashboard/sales-manager", label: "Sales Team", icon: BarChart3 },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/activities", label: "Activities", icon: Activity },
  { href: "/import", label: "Import", icon: Upload },
]

const bottomItems = [
  { href: "/settings", label: "Settings", icon: Settings },
]

interface SidebarProps {
  /** Mobile drawer open state (ignored on desktop) */
  isOpen?: boolean
  /** Called when the mobile drawer should close */
  onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  function handleNavClick() {
    // Close mobile drawer when a nav item is tapped
    onClose?.()
  }

  return (
    <>
      {/*
       * Desktop: normal left sidebar (always visible, not positioned)
       * Mobile:  fixed drawer that slides in from the left
       */}
      <aside
        className={cn(
          // Shared styles
          "flex h-full w-60 shrink-0 flex-col border-r border-border/50 bg-card",
          // Desktop — static in the flex row
          "md:relative md:translate-x-0 md:z-auto",
          // Mobile — fixed overlay drawer
          "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out md:static md:inset-auto md:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo + mobile close button */}
        <div className="flex h-16 items-center justify-between border-b border-border/50 px-5">
          <img
            src="/fluxa-logo.svg"
            alt="FLUXA"
            className="h-9 w-auto"
          />
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pt-4 pb-2">
          <SearchBar />
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-border/50 px-3 py-3">
          {bottomItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}

          {/* User + Logout */}
          <div className="mt-2 flex items-center justify-between rounded-lg px-3 py-2">
            <span className="truncate text-sm text-muted-foreground">
              {user?.full_name || user?.email || "Loading..."}
            </span>
            <button
              onClick={handleLogout}
              className="ml-2 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
