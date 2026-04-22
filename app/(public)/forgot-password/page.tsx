"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Something went wrong.")
        return
      }

      setSent(true)
    } catch {
      setError("Could not connect. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-20">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">B</span>
          </div>
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-border/50 bg-card p-6 text-center">
            <p className="text-sm">
              Check your email. We sent a reset link to{" "}
              <strong>{email}</strong>.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Didn&apos;t get it? Check your spam folder or{" "}
              <button
                onClick={() => setSent(false)}
                className="text-foreground underline"
              >
                try again
              </button>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground transition-colors hover:text-primary"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
