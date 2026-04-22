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

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border/50 bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border/50 px-4">
        <img
          src="/fluxa-logo.svg"
          alt="FLUXA"
          className="h-7 w-auto"
        />
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
  )
}
