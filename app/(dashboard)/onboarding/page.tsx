"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Users, ArrowRight, Sparkles, FileSpreadsheet } from "lucide-react"

const steps = [
  { number: 1, label: "Welcome" },
  { number: 2, label: "Import data" },
  { number: 3, label: "Done" },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [importChoice, setImportChoice] = useState<
    "excel" | "sample" | "empty" | null
  >(null)

  async function completeOnboarding() {
    try {
      await fetch("/api/onboarding/complete", { method: "POST" })
      window.location.href = "/dashboard"
    } catch {
      window.location.href = "/dashboard"
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {steps.map((step) => (
            <div key={step.number} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  step.number <= currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-muted-foreground"
                }`}
              >
                {step.number}
              </div>
              {step.number < steps.length && (
                <div
                  className={`h-px w-12 transition-colors ${
                    step.number < currentStep ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Welcome */}
        {currentStep === 1 && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
              <span className="text-xl font-bold text-primary-foreground">
                B
              </span>
            </div>
            <h1 className="text-2xl font-bold">Welcome to Bridge</h1>
            <p className="mt-3 text-muted-foreground">
              Your CRM is ready. Your default sales pipeline has been created
              with 6 stages: New Lead, Contacted, Proposal Sent, Negotiation,
              Won, and Lost.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              You can rename or change these stages anytime in Settings.
            </p>
            <Button
              onClick={() => setCurrentStep(2)}
              className="mt-8 w-full"
              size="lg"
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Import choice */}
        {currentStep === 2 && (
          <div>
            <h1 className="text-center text-2xl font-bold">
              How would you like to start?
            </h1>
            <p className="mt-2 text-center text-muted-foreground">
              You can always import more data later.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={() => setImportChoice("excel")}
                className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                  importChoice === "excel"
                    ? "border-primary bg-primary/5"
                    : "border-border/50 bg-card hover:border-border"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                  <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Upload my Excel / CSV file</p>
                  <p className="text-sm text-muted-foreground">
                    Import your existing customer data. We&apos;ll help you map the
                    columns.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setImportChoice("sample")}
                className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                  importChoice === "sample"
                    ? "border-primary bg-primary/5"
                    : "border-border/50 bg-card hover:border-border"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Start with sample data</p>
                  <p className="text-sm text-muted-foreground">
                    Load 5 example contacts and 3 deals so you can explore how
                    Bridge works.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setImportChoice("empty")}
                className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                  importChoice === "empty"
                    ? "border-primary bg-primary/5"
                    : "border-border/50 bg-card hover:border-border"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Start empty</p>
                  <p className="text-sm text-muted-foreground">
                    Begin with a clean slate and add contacts manually.
                  </p>
                </div>
              </button>
            </div>

            <Button
              onClick={() => {
                if (importChoice === "excel") {
                  window.location.href = "/import"
                } else {
                  setCurrentStep(3)
                }
              }}
              disabled={!importChoice}
              className="mt-6 w-full"
              size="lg"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 3: Done */}
        {currentStep === 3 && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
              <Sparkles className="h-7 w-7 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold">You&apos;re all set!</h1>
            <p className="mt-3 text-muted-foreground">
              Your CRM is ready to use. Here&apos;s what you can do:
            </p>

            <div className="mt-6 space-y-3 text-left">
              {[
                "Check your Work Queue for tasks and follow-ups",
                "Add your first contact or import from Excel",
                "Drag deals across your pipeline board",
                "Invite your team in Settings",
              ].map((tip) => (
                <div
                  key={tip}
                  className="flex items-start gap-3 rounded-lg border border-border/50 bg-card px-4 py-3 text-sm"
                >
                  <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                  {tip}
                </div>
              ))}
            </div>

            <Button
              onClick={completeOnboarding}
              className="mt-8 w-full"
              size="lg"
            >
              Go to dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
