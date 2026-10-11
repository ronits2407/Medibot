import MedicinesPage from '@/app/(app)/medicines/page'

export const metadata = { title: 'MediBot — Medicines Preview' }
export const dynamic = 'force-dynamic'

export default function DeckMedicinesPreview() {
  return (
    <div className="h-screen w-screen overflow-y-auto bg-background p-6">
      <MedicinesPage />
    </div>
  )
}
