import { DeckClient } from '@/components/deck/DeckClient'

export const metadata = {
  title: 'MediBot — Slide Deck (Hackathon Presentation)',
  description: '100% Schedule H Interception, Active Composition Matching, Multi-Platform Arbitrage',
}
export const dynamic = 'force-dynamic'

export default function DeckPage() {
  return <DeckClient />
}
