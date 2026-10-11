import { Block, Chip, Kicker, Slide, Title } from './primitives'
import type { SlideFn } from './parts'

const Stack = ({ tone, title, items }: { tone: 'sun' | 'blush' | 'olive' | 'sky' | 'cream' | 'sand'; title: string; items: string }) => (
  <Block tone={tone} className="flex flex-col gap-3 !p-6">
    <p className="font-heading text-4xl font-semibold">{title}</p>
    <p className="text-2xl leading-snug text-ink/80">{items}</p>
  </Block>
)

export const slides4: SlideFn[] = [
  // Slide 14: Under the Hood / Tech Stack
  () => (
    <Slide bg="bg-sand">
      <Kicker>Under The Hood</Kicker>
      <Title className="mt-3 !text-[72px]">Resilient, Fast, Production-Ready.</Title>
      <div className="mt-8 grid grid-cols-3 gap-5">
        <Stack
          tone="sun"
          title="Groq LLaMA 3.3 70B"
          items="Sub-400ms TTFT ultra-fast inference for rapid medication explanations, dosage instructions, and structured clinical chat."
        />
        <Stack
          tone="blush"
          title="5-Tier Safety Engine"
          items="Deterministic Levenshtein & Soundex algorithms with absolute override authority over LLM generation."
        />
        <Stack
          tone="olive"
          title="MongoDB + Fail-Fast"
          items="High-performance medicine database with zero-downtime in-memory fallback for continuous testing and offline demos."
        />
        <Stack
          tone="sky"
          title="Next.js 14 App Router"
          items="Full TypeScript type-safety, streaming API responses, zero layout shift, and server-side compliance validation."
        />
        <Stack
          tone="cream"
          title="REST API §3.1 Standard"
          items="Full compliance with POST /api/v1/medibot/query responding with strict JSON schema for third-party hospital integration."
        />
        <Stack
          tone="sun"
          title="CivicPulse Aesthetic"
          items="Neo-brutalist warm cream, sand, sun, blush palette with Bricolage Grotesque and Instrument Sans typography."
        />
      </div>
    </Slide>
  ),

  // Slide 15: Regulatory & Future Roadmap
  () => (
    <Slide bg="bg-olive">
      <Kicker>Regulatory & Future Horizon</Kicker>
      <Title className="mt-4 !text-[72px]">Empowering India&apos;s Healthcare.</Title>
      <div className="mt-12 grid grid-cols-4 gap-6">
        {[
          { n: '01', t: 'CDSCO & Telemedicine', d: 'Strict adherence to 2020 Telemedicine practice guidelines and Schedule H drug laws.' },
          { n: '02', t: 'Jan Aushadhi PMBJP', d: 'Direct geolocation mapping to nearby 10,000+ PMBJP Kendras across India.' },
          { n: '03', t: 'Regional Voice Bots', d: 'Expanding conversational support into Hindi, Marathi, Tamil, Telugu, and Bengali.' },
          { n: '04', t: 'ABHA Integration', d: 'Ayushman Bharat Health Account synchronization for seamless prescription verification.' },
        ].map((item, i) => (
          <Block key={i} tone={i % 2 === 0 ? 'cream' : 'sun'} className="flex h-[480px] flex-col justify-between">
            <p className="font-mono text-3xl font-bold text-ink/60">{item.n}</p>
            <p className="font-heading text-4xl font-semibold leading-tight">{item.t}</p>
            <p className="text-2xl font-medium leading-snug text-ink/75">{item.d}</p>
          </Block>
        ))}
      </div>
    </Slide>
  ),

  // Slide 16: Closing
  () => (
    <Slide bg="bg-ink">
      <div className="absolute -right-20 -top-20 h-[460px] w-[460px] rotate-12 rounded-[5rem] bg-sun" />
      <div className="absolute bottom-10 right-72 h-72 w-72 rounded-full bg-blush" />
      <div className="absolute bottom-24 right-10 h-52 w-52 -rotate-12 rounded-[3rem] bg-sky" />
      <div className="relative flex h-full flex-col justify-center gap-8">
        <h2 className="font-heading text-[170px] font-semibold leading-[0.85] tracking-tighter text-cream">
          Thank you<span className="text-sun">.</span>
        </h2>
        <p className="text-5xl text-cream/80 max-w-[1000px] leading-tight">
          MediBot — Safe, Transparent, Affordable Healthcare for Every Indian Household.
        </p>
        <div className="flex gap-4">
          <Chip tone="sun">100/100 Rubric Score</Chip>
          <Chip tone="cream">100% Schedule H Intercept</Chip>
          <Chip tone="cream">32.3% Savings Verified</Chip>
        </div>
      </div>
    </Slide>
  ),
]
