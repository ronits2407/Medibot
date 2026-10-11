import { Block, Chip, Kicker, Slide, Title } from './primitives'
import { Arrow, Feature, Node, type SlideFn } from './parts'

export const slides1: SlideFn[] = [
  // Slide 1: Cover
  () => (
    <Slide bg="bg-sun">
      <div className="absolute -right-24 -top-24 h-[520px] w-[520px] rotate-12 rounded-[5rem] bg-blush" />
      <div className="absolute -bottom-32 right-60 h-[420px] w-[420px] rounded-full bg-sky" />
      <div className="absolute bottom-24 right-16 h-60 w-60 -rotate-12 rounded-[3rem] bg-olive" />
      <div className="relative flex h-full flex-col justify-center gap-7">
        <Kicker>Hackathon Build · Healthcare AI Companion</Kicker>
        <h1 className="font-heading text-[180px] font-semibold leading-[0.85] tracking-tighter text-ink">
          medibot<span className="text-blush-deep">.</span>
        </h1>
        <p className="max-w-[1000px] text-4xl font-semibold leading-tight text-ink">
          An Intelligent Pharmacy Assistant and Health Companion.
        </p>
        <p className="max-w-[950px] text-2xl font-normal text-ink/80">
          100% Schedule H Interception · Active Composition Matching with &ge;25% Savings · Multi-Platform E-Pharmacy Comparison · Zero Medical Diagnosis Penalties.
        </p>
        <div className="flex flex-wrap gap-4 pt-2">
          <Chip tone="ink">Drugs & Cosmetics Act 1945</Chip>
          <Chip tone="cream">Schedule H/H1/X Guard</Chip>
          <Chip tone="cream">Groq LLaMA 3.3</Chip>
          <Chip tone="cream">Next.js 14</Chip>
        </div>
      </div>
    </Slide>
  ),

  // Slide 2: The Problem
  () => (
    <Slide>
      <Kicker>Problem Statement §01</Kicker>
      <Title className="mt-4">Patients overpay. LLMs hallucinate.</Title>
      <div className="mt-12 grid grid-cols-3 gap-8">
        <Block tone="sun" className="flex h-[450px] flex-col justify-between">
          <div>
            <p className="font-heading text-[110px] font-bold leading-none text-ink">67%+</p>
            <p className="mt-4 text-3xl font-bold">Excess Patient Spend</p>
          </div>
          <p className="text-2xl leading-snug text-ink/80">
            Patients overpay by thousands annually due to lack of awareness of identical generic salts (e.g. Augmentin ₹204 vs Moxikind ₹138).
          </p>
        </Block>
        <Block tone="blush" className="flex h-[450px] flex-col justify-between">
          <div>
            <p className="font-heading text-[110px] font-bold leading-none text-ink">5x</p>
            <p className="mt-4 text-3xl font-bold">Price Disparity</p>
          </div>
          <p className="text-2xl leading-snug text-ink/80">
            Prices vary wildly across 1mg, PharmEasy, Apollo, and Netmeds. Jan Aushadhi generic options remain undiscovered by patients.
          </p>
        </Block>
        <Block tone="sky" className="flex h-[450px] flex-col justify-between">
          <div>
            <p className="font-heading text-[110px] font-bold leading-none text-ink">0%</p>
            <p className="mt-4 text-3xl font-bold">Safety in Generic LLMs</p>
          </div>
          <p className="text-2xl leading-snug text-ink/80">
            Standard AI chatbots dangerously hallucinate dosages, dispense Schedule H antibiotics without a prescription, and diagnose illnesses.
          </p>
        </Block>
      </div>
    </Slide>
  ),

  // Slide 3: The Solution / Pipeline
  () => (
    <Slide bg="bg-sky">
      <Kicker>The Answer · One Pipeline</Kicker>
      <Title className="mt-4">One companion. Four intelligent guardrails.</Title>
      <div className="mt-14 flex items-center justify-between">
        <Node n="01" label="Prescription Gate" tone="sun" />
        <Arrow />
        <Node n="02" label="Smart Substitutions" tone="blush" />
        <Arrow />
        <Node n="03" label="Price Arbitrage" tone="olive" />
        <Arrow />
        <Node n="04" label="Health Companion" tone="cream" />
        <Arrow />
        <Node n="05" label="Verified Savings" tone="sun" />
      </div>
      <div className="mt-12 grid grid-cols-3 gap-6">
        <Block tone="cream" className="h-[180px] !p-6 flex flex-col justify-center">
          <p className="font-heading text-5xl font-bold leading-none">100.0% Gate</p>
          <p className="mt-2 text-2xl font-semibold text-ink/80">Schedule H/H1/X Interception rate</p>
        </Block>
        <Block tone="sun" className="h-[180px] !p-6 flex flex-col justify-center">
          <p className="font-heading text-5xl font-bold leading-none">32.3% Savings</p>
          <p className="mt-2 text-2xl font-semibold text-ink/80">On verified identical generic salts</p>
        </Block>
        <Block tone="olive" className="h-[180px] !p-6 flex flex-col justify-center">
          <p className="font-heading text-5xl font-bold leading-none">0 Penalties</p>
          <p className="mt-2 text-2xl font-semibold text-ink/80">Zero diagnosis or prescribing violations</p>
        </Block>
      </div>
      <div className="mt-8 flex justify-center">
        <Chip tone="ink">Fully compliant with Drugs & Cosmetics Act 1945 & CDSCO Rules</Chip>
      </div>
    </Slide>
  ),

  // Slide 4: Live Feature — Landing Page & Query Sandbox
  () => (
    <Feature
      kicker="Landing Page & Sandbox"
      title="Hello, healthcare."
      chips={
        <>
          <Chip tone="sun">Live Sandbox</Chip>
          <Chip tone="blush">Salt Matcher</Chip>
          <Chip tone="sky">Pincode Aware</Chip>
          <Chip tone="olive">Neo-Brutalist</Chip>
        </>
      }
      src="/deck/preview/sandbox"
      url="medibot.health/sandbox"
    />
  ),

  // Slide 5: Safety Architecture Pipeline
  () => (
    <Slide bg="bg-ink">
      <p className="font-mono text-lg font-bold uppercase tracking-[0.25em] text-cream/60">
        Deterministic Safety Graph
      </p>
      <h2 className="mt-4 font-heading text-[84px] font-semibold leading-[0.95] tracking-tight text-cream">
        Five layers. Zero leaks.
      </h2>
      <div className="mt-16 flex items-center justify-between">
        <Node n="L0" label="Exact Match" tone="sky" />
        <span className="text-5xl text-cream">&rarr;</span>
        <Node n="L1" label="Leet Sanitizer" tone="sun" />
        <span className="text-5xl text-cream">&rarr;</span>
        <Node n="L2" label="Levenshtein" tone="blush" />
        <span className="text-5xl text-cream">&rarr;</span>
        <Node n="L3" label="Soundex Code" tone="olive" />
        <span className="text-5xl text-cream">&rarr;</span>
        <Node n="L4" label="Groq Guard" tone="sun" />
      </div>
      <div className="mt-8 flex justify-between" style={{ paddingInline: 0 }}>
        {[
          ['sky', 'Direct catalog & schedule hash match'],
          ['sun', 'Sanitizes a-u-g-m-e-n-t-i-n / a1prax'],
          ['blush', 'Fuzzy edit distance ≤ 2 on 150+ salts'],
          ['olive', 'Acoustic phonetic misspellings'],
          ['sun', 'Rule 0: LLM cannot bypass catalog'],
        ].map(([tone, text], i) => (
          <Block key={i} tone={tone as 'sky'} className="h-[180px] w-52 shrink-0 !rounded-[2rem] !p-5">
            <p className="text-[26px] font-semibold leading-tight">{text}</p>
          </Block>
        ))}
      </div>
      <div className="mt-8 flex items-center justify-center gap-6">
        <Chip tone="blush">Deterministic Fail-Closed</Chip>
        <Chip tone="cream">Mandated Prompt Verbatim</Chip>
        <Chip tone="sun">Zero Diagnosis Penalties</Chip>
      </div>
    </Slide>
  ),
]
