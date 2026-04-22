"use client"

import { useState, useEffect, useRef } from "react"
import type { Company, AccountPlanFull } from "@/lib/types"
import { AccountPlanHeader } from "./header"
import { OverviewTab } from "./tabs/overview"
import { StakeholderTab } from "./tabs/stakeholders"
import { ActionPlanTab } from "./tabs/action-plan"
import { ActionTimelineTab } from "./tabs/action-timeline"
import { CoverageTab } from "./tabs/coverage"
import { ValueTab } from "./tabs/value-architecture"
import { WhitespaceTab } from "./tabs/whitespace"
import { CompetitiveTab } from "./tabs/competitive"
import { RevenueForecastTab } from "./tabs/revenue-forecast"

const TABS = [
  { id: "overview", label: "Overview", icon: "strategy" },
  { id: "revenue-forecast", label: "Revenue Forecast", icon: "forecast" },
  { id: "competitive", label: "Competitive", icon: "competitive" },
  { id: "network", label: "Influence Network", icon: "people" },
  { id: "actions", label: "Action Plan", icon: "actions" },
  { id: "timeline", label: "Action Timeline", icon: "timeline" },
  { id: "coverage", label: "Coverage Heatmap", icon: "grid" },
  { id: "value", label: "Value Architecture", icon: "value" },
  { id: "whitespace", label: "Whitespace", icon: "whitespace" },
] as const

type TabId = (typeof TABS)[number]["id"]

interface AccountPlanViewProps {
  plan: AccountPlanFull
  company: Company
  onUpdate: () => void
}

export function AccountPlanView({ plan, company, onUpdate }: AccountPlanViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview")
  const [animating, setAnimating] = useState(false)
  const [pendingTab, setPendingTab] = useState<TabId | null>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Animate the sliding indicator when tab changes
  useEffect(() => {
    const btn = tabRefs.current[activeTab]
    const indicator = indicatorRef.current
    if (btn && indicator) {
      indicator.style.width = `${btn.offsetWidth}px`
      indicator.style.transform = `translateX(${btn.offsetLeft}px)`
    }
  }, [activeTab])

  function handleTabChange(tabId: TabId) {
    if (tabId === activeTab || animating) return
    setAnimating(true)
    setPendingTab(tabId)

    // Quick fade-out then swap content and fade-in
    setTimeout(() => {
      setActiveTab(tabId)
      setPendingTab(null)
      // Let the new tab content fade in
      setTimeout(() => setAnimating(false), 50)
    }, 150)
  }

  const tabContent = (
    <>
      {activeTab === "overview" && <OverviewTab plan={plan} onUpdate={onUpdate} />}
      {activeTab === "network" && <StakeholderTab plan={plan} onUpdate={onUpdate} />}
      {activeTab === "actions" && <ActionPlanTab plan={plan} onUpdate={onUpdate} />}
      {activeTab === "timeline" && <ActionTimelineTab plan={plan} onUpdate={onUpdate} />}
      {activeTab === "coverage" && <CoverageTab plan={plan} onUpdate={onUpdate} />}
      {activeTab === "value" && <ValueTab plan={plan} onUpdate={onUpdate} />}
      {activeTab === "whitespace" && <WhitespaceTab plan={plan} onUpdate={onUpdate} />}
      {activeTab === "competitive" && <CompetitiveTab plan={plan} onUpdate={onUpdate} />}
      {activeTab === "revenue-forecast" && <RevenueForecastTab plan={plan} onUpdate={onUpdate} />}
    </>
  )

  return (
    <div className="flex flex-col gap-0">
      {/* Header with KPIs */}
      <AccountPlanHeader plan={plan} company={company} onUpdate={onUpdate} />

      {/* Tab navigation */}
      <div className="relative mt-4 flex gap-1 overflow-x-auto rounded-lg border border-border/50 bg-card/50 p-1">
        {/* Sliding indicator */}
        <div
          ref={indicatorRef}
          className="absolute top-1 h-[calc(100%-8px)] rounded-md bg-accent transition-all duration-300 ease-out"
        />
        {TABS.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => { tabRefs.current[tab.id] = el }}
            onClick={() => handleTabChange(tab.id)}
            className={`relative z-10 flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
              activeTab === tab.id || pendingTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full bg-current ${activeTab === tab.id ? "opacity-100" : "opacity-40"}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content with fade transition */}
      <div
        className={`mt-4 transition-all duration-150 ease-in-out ${
          animating ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        {tabContent}
      </div>
    </div>
  )
}
