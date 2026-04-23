"use client"

import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import {
  ArrowRight,
  CheckCircle2,
  LayoutGrid,
  ListChecks,
  Upload,
  Search,
  Users,
  BarChart3,
  Leaf,
} from "lucide-react"

const features = [
  {
    icon: Users,
    title: "Klanten & Bedrijven",
    description:
      "Alle klantgegevens op één plek. Namen, e-mails, telefoonnummers, notities — overzichtelijk en doorzoekbaar.",
  },
  {
    icon: LayoutGrid,
    title: "Visuele Pipeline",
    description:
      "Zie elk project op een Kanban-bord. Sleep kaarten tussen fases. Direct inzicht in lopende leases en installaties.",
  },
  {
    icon: ListChecks,
    title: "Slimme Werkwachtrij",
    description:
      "Het systeem vertelt je wat vandaag te doen. Achterstallige follow-ups, stilstaande deals, nieuwe leads.",
  },
  {
    icon: Upload,
    title: "Importeren uit Excel",
    description:
      "Upload je spreadsheet, koppel de kolommen en je bent klaar. Dubbele records worden automatisch herkend.",
  },
  {
    icon: Search,
    title: "Vind Alles",
    description:
      "Eén zoekbalk vindt klanten, bedrijven, deals en notities. Geen eindeloos klikken meer tussen tabbladen.",
  },
  {
    icon: BarChart3,
    title: "Dashboard",
    description:
      "Open deals, achterstallige taken, pipelinewaarde en recente activiteit — alles in één oogopslag.",
  },
]

const comparisonPoints = [
  { label: "Tijd om op te zetten", us: "15 minuten", others: "Dagen tot weken" },
  { label: "Leercurve", us: "Geen", others: "Training nodig" },
  { label: "Prijs voor klein team", us: "Gratis of EUR 49/mnd", others: "EUR 200+/mnd" },
  { label: "Beheerder nodig", us: "Nee", others: "Meestal wel" },
  { label: "Importeren uit Excel", us: "Drag and drop", others: "Complex proces" },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 sm:pt-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              <Leaf className="h-3.5 w-3.5" strokeWidth={2.5} />
              CRM voor duurzame mobiliteit
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Volledige energieoplossingen,
              <br />
              <span className="text-primary">slim beheerd</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Het CRM voor FLUXA Solutions. Beheer leases, laadpalen,
              zonnepanelen en klantprojecten met overzicht en snelheid.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className={buttonVariants({
                  size: "lg",
                  className: "w-full rounded-full px-8 font-semibold sm:w-auto",
                })}
              >
                Simuleer nu
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className: "w-full rounded-full px-8 font-semibold sm:w-auto",
                })}
              >
                Bekijk tarieven
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="border-y border-border/50 bg-card/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-6 py-6 text-sm font-medium text-muted-foreground">
          <span>Vervangt Excel</span>
          <span className="hidden h-4 w-px bg-border sm:block" />
          <span>15 minuten setup</span>
          <span className="hidden h-4 w-px bg-border sm:block" />
          <span>Gratis abonnement</span>
          <span className="hidden h-4 w-px bg-border sm:block" />
          <span>Geen training</span>
        </div>
      </section>

      {/* Features grid */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Alles wat je nodig hebt. Niets meer.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Doet wat Excel niet kan — zonder de complexiteit die je niet wil.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border/50 bg-card p-7 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
                <feature.icon className="h-5 w-5 text-primary" strokeWidth={2.25} />
              </div>
              <h3 className="text-base font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="border-t border-border/50 bg-card/30">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              FLUXA CRM vs. de grote spelers
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Gebouwd voor teams van 1 tot 25 mensen die dingen gedaan willen
              krijgen, niet software willen configureren.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-2xl overflow-hidden rounded-2xl border border-border/50">
            <div className="grid grid-cols-3 border-b border-border/50 bg-card px-6 py-3">
              <span className="text-sm font-medium text-muted-foreground" />
              <span className="text-sm font-bold text-primary">FLUXA</span>
              <span className="text-sm font-medium text-muted-foreground">
                HubSpot / Salesforce
              </span>
            </div>
            {comparisonPoints.map((point, i) => (
              <div
                key={point.label}
                className={`grid grid-cols-3 px-6 py-4 ${
                  i < comparisonPoints.length - 1
                    ? "border-b border-border/50"
                    : ""
                }`}
              >
                <span className="text-sm text-muted-foreground">
                  {point.label}
                </span>
                <span className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {point.us}
                </span>
                <span className="text-sm text-muted-foreground">
                  {point.others}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Stop met klanten verliezen in spreadsheets
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Meer overzicht, meer projecten, minder gedoe. Begin gratis,
            upgrade wanneer je er klaar voor bent.
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className={buttonVariants({
                size: "lg",
                className: "rounded-full px-8 font-semibold",
              })}
            >
              Simuleer nu
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
