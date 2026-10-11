import { QuerySandbox } from '@/components/landing/QuerySandbox'

export const metadata = { title: 'MediBot — Sandbox Preview' }
export const dynamic = 'force-dynamic'

export default function DeckSandboxPreview() {
  return (
    <div className="min-h-screen w-full bg-background p-6 flex items-center justify-center">
      <div className="w-full max-w-5xl">
        <QuerySandbox />
      </div>
    </div>
  )
}
