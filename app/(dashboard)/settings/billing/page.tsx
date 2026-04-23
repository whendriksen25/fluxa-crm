"use client"

import { buttonVariants } from "@/components/ui/button"
import { CreditCard, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function BillingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and payment method.
        </p>
      </div>

      {/* Current plan */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Free Plan</h3>
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                Current
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              1 user, 250 contacts, 1 pipeline board
            </p>
          </div>
          <Link href="/pricing" className={buttonVariants({ size: "sm" })}>
            Upgrade
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Payment method */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Payment method</h3>
            <p className="text-xs text-muted-foreground">
              No payment method on file
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          You&apos;re on the free plan — no payment method is needed. When you
          upgrade to Pro, you&apos;ll be redirected to a secure Stripe checkout
          page.
        </p>
      </div>
    </div>
  )
}
