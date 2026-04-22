"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Mail, Calendar, RefreshCw, Check, X, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Integration {
  id: string
  provider: string
  email_address: string | null
  sync_enabled: boolean
  last_sync_at: string | null
  scopes: string[]
}

export default function IntegrationsPage() {
  const [integration, setIntegration] = useState<Integration | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<"gmail" | "calendar" | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  // Check URL params for success/error from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("success") === "connected") {
      setSyncResult("Google account connected successfully!")
      // Clean up URL
      window.history.replaceState({}, "", "/settings/integrations")
    }
    if (params.get("error")) {
      setSyncResult(`Connection failed: ${params.get("error")}`)
      window.history.replaceState({}, "", "/settings/integrations")
    }
  }, [])

  // Fetch current integration status
  useEffect(() => {
    async function fetchIntegration() {
      try {
        const res = await fetch("/api/integrations/google/status")
        if (res.ok) {
          const data = await res.json()
          setIntegration(data.integration || null)
        }
      } catch {
        console.error("Failed to fetch integration status")
      } finally {
        setLoading(false)
      }
    }
    fetchIntegration()
  }, [])

  const handleConnect = () => {
    // Redirect to Google OAuth — this is a full page redirect
    window.location.href = "/api/integrations/google/auth"
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      const res = await fetch("/api/integrations/google/disconnect", { method: "DELETE" })
      if (res.ok) {
        setIntegration(null)
        setSyncResult("Google account disconnected.")
      }
    } catch {
      setSyncResult("Failed to disconnect.")
    } finally {
      setDisconnecting(false)
    }
  }

  const handleSync = async (type: "gmail" | "calendar") => {
    setSyncing(type)
    setSyncResult(null)
    try {
      const endpoint =
        type === "gmail"
          ? "/api/integrations/gmail/sync"
          : "/api/integrations/calendar/sync"

      const res = await fetch(endpoint, { method: "POST" })
      const data = await res.json()

      if (res.ok) {
        const r = data.result
        if (type === "gmail") {
          setSyncResult(`Gmail sync complete: ${r.synced} emails synced, ${r.skipped} skipped.`)
        } else {
          setSyncResult(`Calendar sync complete: ${r.pulled || 0} events pulled.`)
        }
        // Refresh integration data to update last_sync_at
        const statusRes = await fetch("/api/integrations/google/status")
        if (statusRes.ok) {
          const statusData = await statusRes.json()
          setIntegration(statusData.integration || null)
        }
      } else {
        setSyncResult(data.error || "Sync failed.")
      }
    } catch {
      setSyncResult("Sync failed — please try again.")
    } finally {
      setSyncing(null)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return "Never"
    return new Date(date).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const hasGmailScope = integration?.scopes?.some((s) => s.includes("gmail"))
  const hasCalendarScope = integration?.scopes?.some((s) => s.includes("calendar"))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/settings"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Settings
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your Google account to sync emails and calendar events.
        </p>
      </div>

      {/* Status message */}
      {syncResult && (
        <div className="rounded-lg border border-border/50 bg-card px-4 py-3 text-sm">
          {syncResult}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-border/50 bg-card p-12 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !integration ? (
        /* Not connected state */
        <div className="rounded-xl border border-border/50 bg-card">
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: "rgba(74, 143, 224, 0.15)" }}>
              <Mail className="h-5 w-5" style={{ color: "#4a8fe0" }} />
            </div>
            <h3 className="text-base font-medium">Connect your Google account</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Link your Gmail and Google Calendar to automatically sync emails as activities
              and keep your calendar in sync with CRM tasks and meetings.
            </p>
            <Button size="sm" className="mt-6" onClick={handleConnect}>
              Connect Google Account
            </Button>
          </div>
        </div>
      ) : (
        /* Connected state */
        <div className="flex flex-col gap-4">
          {/* Connection status card */}
          <div className="rounded-xl border border-border/50 bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "rgba(40, 214, 136, 0.15)" }}>
                  <Check className="h-5 w-5" style={{ color: "#28d688" }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Google Connected</h3>
                  <p className="text-xs text-muted-foreground">
                    {integration.email_address || "Connected"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-red-400 hover:text-red-300 border-red-400/30 hover:border-red-400/50"
              >
                {disconnecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <X className="mr-2 h-4 w-4" />
                )}
                Disconnect
              </Button>
            </div>
          </div>

          {/* Gmail sync card */}
          <div className="rounded-xl border border-border/50 bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Gmail Sync</h3>
                  <p className="text-xs text-muted-foreground">
                    {hasGmailScope
                      ? `Last synced: ${formatDate(integration.last_sync_at)}`
                      : "Gmail scope not granted — reconnect to enable"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSync("gmail")}
                disabled={syncing !== null || !hasGmailScope}
              >
                {syncing === "gmail" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Sync now
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground pl-[52px]">
              Emails sent to or received from CRM contacts are automatically logged as activities.
            </p>
          </div>

          {/* Calendar sync card */}
          <div className="rounded-xl border border-border/50 bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Google Calendar Sync</h3>
                  <p className="text-xs text-muted-foreground">
                    {hasCalendarScope
                      ? "Two-way sync enabled — tasks push to calendar, events pull into CRM"
                      : "Calendar scope not granted — reconnect to enable"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSync("calendar")}
                disabled={syncing !== null || !hasCalendarScope}
              >
                {syncing === "calendar" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Sync now
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground pl-[52px]">
              Follow-up tasks with due dates are automatically added to your Google Calendar with a 15-minute reminder.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
