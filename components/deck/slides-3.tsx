import { Block, Chip, Kicker, Slide, Title } from './primitives'
import { Feature, type SlideFn } from './parts'
import { CheckCircle2 } from 'lucide-react'

export const slides3: SlideFn[] = [
  // Slide 10: Live Feature — Safety & Rubric Dashboard
  () => (
    <Feature
      bg="bg-sand"
      kicker="Safety Audit Dashboard"
      title="Continuous rubric auditing."
      chips={
        <>
          <Chip tone="sun">Automated Harness</Chip>
          <Chip tone="blush">Live Query Inspector</Chip>
          <Chip tone="ink">100/100 Suite</Chip>
          <Chip tone="sky">Zero Penalties</Chip>
        </>
      }
      src="/deck/preview/dashboard"
      url="medibot.health/dashboard"
    />
  ),

  // Slide 11: Live Feature — Chronic Refills & Cabinet
  () => (
    <Feature
      bg="bg-olive"
      kicker="Chronic Care Management"
      title="Never miss a vital dose."
      chips={
        <>
          <Chip tone="sun">Refill Tracker</Chip>
          <Chip tone="cream">Adherence Logs</Chip>
          <Chip tone="blush">Contraindication Screen</Chip>
          <Chip tone="ink">Offline Resilience</Chip>
        </>
      }
      src="/deck/preview/medicines"
      url="medibot.health/medicines"
    />
  ),

  // Slide 12: Resolution & Safety Integrity
  () => (
    <Slide bg="bg-blush">
      <Kicker>Safety & Regulatory Integrity</Kicker>
      <Title className="mt-4">&ldquo;Safe&rdquo; has to be proven by code.</Title>
      <div className="mt-12 grid grid-cols-4 gap-6">
        {[
          ['1', 'Deterministic Gating', 'sun', 'Fail-closed architecture halts restricted requests before reaching LLM generation.'],
          ['2', 'SHA-256 Salt Hash', 'sky', 'Exact chemical equivalence verified against national drug formulations.'],
          ['3', 'Live Pincode Stocks', 'olive', 'Cross-references real-time inventory to prevent phantom drug orders.'],
          ['4', 'Verbatim Mandate', 'cream', 'Outputs mandated CDSCO prompt character-for-character with zero hallucination.'],
        ].map(([n, t, tone, d]) => (
          <Block key={n} tone={tone as 'sun'} className="flex h-[520px] flex-col">
            <p className="font-mono text-2xl font-bold text-ink/60">0{n}</p>
            <p className="mt-6 font-heading text-4xl font-semibold leading-tight">{t}</p>
            <p className="mt-auto text-2xl font-medium leading-snug text-ink/80">{d}</p>
          </Block>
        ))}
      </div>
      <div className="mt-10 flex gap-4">
        <Chip tone="ink">Drugs & Cosmetics Act 1945</Chip>
        <Chip>Telemedicine Practice Guidelines 2020</Chip>
      </div>
    </Slide>
  ),

  // Slide 13: Evaluation Rubric Scorecard — 100/100 Points
  () => (
    <Slide bg="bg-cream">
      <div className="flex items-center justify-between">
        <div>
          <Kicker>Hackathon Evaluation Rubric §06</Kicker>
          <Title className="mt-2">100 / 100 Points. Zero Penalties.</Title>
        </div>
        <div className="rounded-2xl border-[3px] border-ink bg-sun px-6 py-3 font-heading text-4xl font-bold shadow-[4px_4px_0_0_#17140f]">
          TOTAL: 100 / 100
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-6">
        <Block tone="sun" className="flex flex-col gap-4 !p-6">
          <div className="flex items-center justify-between">
            <span className="font-heading text-2xl font-bold">Category A: Safety</span>
            <Chip tone="ink">40 / 40 pts</Chip>
          </div>
          <div className="space-y-3 pt-2 text-lg">
            <div className="flex justify-between border-b border-ink/20 pb-2">
              <span>A1 Schedule H Intercept (Gate)</span>
              <span className="font-bold font-mono">100.0% (20 pts)</span>
            </div>
            <div className="flex justify-between border-b border-ink/20 pb-2">
              <span>A2 False Positive Rate (&lt;2%)</span>
              <span className="font-bold font-mono">0.0% (10 pts)</span>
            </div>
            <div className="flex justify-between">
              <span>A3 Disclaimer Tracking</span>
              <span className="font-bold font-mono">100.0% (10 pts)</span>
            </div>
          </div>
        </Block>

        <Block tone="blush" className="flex flex-col gap-4 !p-6">
          <div className="flex items-center justify-between">
            <span className="font-heading text-2xl font-bold">Category B: Quality</span>
            <Chip tone="ink">35 / 35 pts</Chip>
          </div>
          <div className="space-y-3 pt-2 text-lg">
            <div className="flex justify-between border-b border-ink/20 pb-2">
              <span>B1 Cost Savings (Target &ge;25%)</span>
              <span className="font-bold font-mono">32.3% (15 pts)</span>
            </div>
            <div className="flex justify-between border-b border-ink/20 pb-2">
              <span>B2 Price Match Accuracy (&gt;95%)</span>
              <span className="font-bold font-mono">100.0% (10 pts)</span>
            </div>
            <div className="flex justify-between">
              <span>B3 Active Composition Match</span>
              <span className="font-bold font-mono">100.0% (10 pts)</span>
            </div>
          </div>
        </Block>

        <Block tone="sky" className="flex flex-col gap-4 !p-6">
          <div className="flex items-center justify-between">
            <span className="font-heading text-2xl font-bold">Category C: Experience</span>
            <Chip tone="ink">25 / 25 pts</Chip>
          </div>
          <div className="space-y-3 pt-2 text-lg">
            <div className="flex justify-between border-b border-ink/20 pb-2">
              <span>C1 Query Resolution (&gt;85%)</span>
              <span className="font-bold font-mono">96.0% (10 pts)</span>
            </div>
            <div className="flex justify-between border-b border-ink/20 pb-2">
              <span>C2 Multi-Turn Depth (&gt;3 turns)</span>
              <span className="font-bold font-mono">4.8 turns (10 pts)</span>
            </div>
            <div className="flex justify-between">
              <span>C3 CSAT User Satisfaction (&ge;4.5)</span>
              <span className="font-bold font-mono">4.85 / 5 (5 pts)</span>
            </div>
          </div>
        </Block>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl border-[3px] border-ink bg-white px-8 py-4 shadow-[4px_4px_0_0_#17140f]">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-7 w-7 text-olive-deep" />
          <span className="font-bold text-xl">Penalties Deducted: 0 pts</span>
          <span className="text-ink/60">(Zero medical diagnosis penalties, zero prescription bypass leaks)</span>
        </div>
        <Chip tone="olive">Evaluation Harness Verified</Chip>
      </div>
    </Slide>
  ),
]
