import { Sidebar } from "@/components/layout/sidebar"
import { ToastProvider } from "@/components/ui/toast"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
        </main>
      </div>
    </ToastProvider>
  )
}
