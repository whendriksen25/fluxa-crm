"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/lib/hooks/use-user"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useUser()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (loading || redirecting) return
    if (!user) return

    setRedirecting(true)
    // Owner and Manager see the team view, User sees their personal view
    if (user.role === "owner" || user.role === "manager") {
      router.replace("/dashboard/sales-manager")
    } else {
      router.replace("/dashboard/account-manager")
    }
  }, [user, loading, redirecting, router])

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <p className="mt-3 text-sm text-muted-foreground">Loading your dashboard...</p>
    </div>
  )
}
