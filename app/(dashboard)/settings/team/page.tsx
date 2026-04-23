import { Button } from "@/components/ui/button"
import { Plus, Users } from "lucide-react"

export default function TeamPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite team members and manage who has access.
          </p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Invite member
        </Button>
      </div>

      <div className="rounded-xl border border-border/50 bg-card">
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium">Just you for now</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Invite your colleagues to work together. They&apos;ll get their own
            login and see the same contacts, deals, and pipeline.
          </p>
          <Button size="sm" className="mt-6">
            <Plus className="mr-2 h-4 w-4" />
            Invite your first team member
          </Button>
        </div>
      </div>
    </div>
  )
}
