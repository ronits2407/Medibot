import SafetyDashboardPage from '@/app/(app)/dashboard/page'

export const metadata = { title: 'MediBot — Dashboard Preview' }
export const dynamic = 'force-dynamic'

export default function DeckDashboardPreview() {
  return (
    <div className="h-screen w-screen overflow-y-auto bg-background p-6">
      <SafetyDashboardPage />
    </div>
  )
}
