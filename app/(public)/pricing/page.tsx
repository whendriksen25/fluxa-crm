"use client"

import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Free",
    price: "EUR 0",
    period: "forever",
    description: "For solo founders getting started.",
    cta: "Start free",
    ctaHref: "/signup",
    highlight: false,
    features: [
      "1 user",
      "250 contacts",
      "1 pipeline board with 6 stages",
      "Smart work queue",
      "CSV import (up to 250 rows)",
      "Activity timeline",
      "Global search",
      "Community support",
    ],
  },
  {
    name: "Pro",
    price: "EUR 49",
    period: "/month",
    description: "For small teams ready to grow.",
    cta: "Start 14-day free trial",
    ctaHref: "/signup?plan=pro",
    highlight: true,
    features: [
      "Up to 10 users",
      "25,000 contacts",
      "Unlimited pipeline boards & stages",
      "Smart work queue with suggestions",
      "Unlimited CSV import + duplicate detection",
      "Outlook email & calendar sync",
      "Business card scanner (50 scans/mo)",
      "File attachments on contacts & deals",
      "Custom fields",
      "Priority email support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For teams that need integrations and control.",
    cta: "Contact us",
    ctaHref: "mailto:sales@bridgecrm.com",
    highlight: false,
    features: [
      "Everything in Pro",
      "Unlimited users & contacts",
      "HubSpot & Salesforce bi-directional sync",
      "ERP connector with field mapping",
      "Workflow automation",
      "Email sequences & marketing tools",
      "Web scraper for lead generation",
      "Advanced reporting & PDF export",
      "SSO (SAML), audit logs",
      "Implementation tracking",
      "SLA with guaranteed uptime",
      "Dedicated account manager",
    ],
  },
]

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Simple, honest pricing
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Start free. Upgrade when your team grows. No surprises.
        </p>
      </div>

      <div className="mt-16 grid gap-8 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col rounded-xl border p-8 ${
              plan.highlight
                ? "border-primary bg-card shadow-lg shadow-primary/5"
                : "border-border/50 bg-card"
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
                Most popular
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm text-muted-foreground">
                    {plan.period}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {plan.description}
              </p>
            </div>

            <ul className="mb-8 flex flex-1 flex-col gap-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href={plan.ctaHref}
              className={buttonVariants({ variant: plan.highlight ? "default" : "outline", className: "w-full" })}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-16 max-w-2xl rounded-xl border border-border/50 bg-card p-8 text-center">
        <h3 className="text-lg font-semibold">Not sure which plan?</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Start with the free plan. You can upgrade anytime — your data stays
          the same. No migration, no hassle.
        </p>
      </div>
    </div>
  )
}
