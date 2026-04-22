import Link from "next/link"
import { Settings, Users, CreditCard, Kanban, Plug } from "lucide-react"

const settingSections = [
  {
    href: "/settings/team",
    icon: Users,
    title: "Team",
    description: "Invite team members and manage roles.",
  },
  {
    href: "/settings/billing",
    icon: CreditCard,
    title: "Billing",
    description: "Manage your plan and payment method.",
  },
  {
    href: "/settings/pipeline",
    icon: Kanban,
    title: "Pipeline",
    description: "Customize your pipeline stages.",
  },
  {
    href: "/settings/integrations",
    icon: Plug,
    title: "Integrations",
    description: "Connect Gmail, Google Calendar, and more.",
  },
]

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, team, and preferences.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group rounded-xl border border-border/50 bg-card p-6 transition-colors hover:border-border"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <section.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold">{section.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {section.description}
            </p>
          </Link>
        ))}
      </div>

      {/* Account info */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Account</h3>
            <p className="text-xs text-muted-foreground">
              Your personal account settings
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Account settings and profile editing will be available here. For now,
          use the sections above to manage your team, billing, and pipeline.
        </p>
      </div>
    </div>
  )
}
